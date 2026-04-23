"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { MOCK_PRODUCTS, MOCK_INGREDIENTS, MOCK_ORDERS, MOCK_EMPLOYEES, MOCK_INVENTORY_LOGS, MOCK_ORDER_STATUSES, MOCK_PAYMENT_METHODS, MOCK_CATEGORIES, MOCK_INGREDIENT_GROUPS, MOCK_CONFIG, MOCK_EXPENSES, Product, Order, Ingredient, Employee, InventoryLog, OrderStatusConfig, OrderItem, PaymentMethod, AppConfig, Expense } from "./mockDB";
import { supabase } from "./supabase";
import { User, Session } from "@supabase/supabase-js";

interface AppState {
  products: Product[];
  ingredients: Ingredient[];
  orders: Order[];
  employees: Employee[];
  inventoryLogs: InventoryLog[];
  orderStatuses: OrderStatusConfig[];
  paymentMethods: PaymentMethod[];
  categories: string[];
  ingredientGroups: string[];
  expenses: Expense[];
  config: AppConfig;
  user: User | null;
  session: Session | null;
  currentEmployee: Employee | null;
}

const getInitialState = (): AppState => {
  if (typeof window !== "undefined") {
    const local = localStorage.getItem("brasa-state-bom-v2");
    if (local) {
      try {
        const parsed = JSON.parse(local);
        return { 
          ...parsed, 
          // Prefer cached products if they exist, else empty
          products: parsed.products || [],
          orderStatuses: parsed.orderStatuses || MOCK_ORDER_STATUSES,
          paymentMethods: parsed.paymentMethods || MOCK_PAYMENT_METHODS,
          categories: parsed.categories || MOCK_CATEGORIES,
          ingredientGroups: parsed.ingredientGroups || MOCK_INGREDIENT_GROUPS,
          expenses: parsed.expenses || MOCK_EXPENSES,
          config: parsed.config || MOCK_CONFIG
        };
      } catch (e) {
        console.error("Error parsing local state", e);
      }
    }
  }
  return { 
    products: [], // Start empty to avoid flash of wrong data
    ingredients: [], 
    orders: [], 
    employees: [], 
    inventoryLogs: [],
    orderStatuses: MOCK_ORDER_STATUSES,
    paymentMethods: MOCK_PAYMENT_METHODS,
    categories: [],
    ingredientGroups: [],
    expenses: [],
    config: MOCK_CONFIG,
    user: null,
    session: null,
    currentEmployee: null,
  };
};

let globalState: AppState = getInitialState();
const listeners = new Set<(state: AppState) => void>();
let masterChannel: any = null;

const notifyListeners = () => {
  listeners.forEach(listener => listener(globalState));
};

const commitState = async (newState: AppState) => {
  globalState = newState;
  if (typeof window !== "undefined") {
    localStorage.setItem("brasa-state-bom-v2", JSON.stringify(newState));
  }
  notifyListeners(); 
};

const persistToSupabase = async (table: string, data: any) => {
    try {
        const { error } = await supabase.from(table).upsert(data);
        if (error) {
            console.error(`[Supabase Error] Fallo al persistir en ${table}:`, error.message, error.details);
        }
    } catch (err) {
        console.error(`[Network Error] Excepción al persistir en ${table}:`, err);
    }
};

export function useAppState() {
    const [state, setState] = useState<AppState>(globalState);
    const [hydrated, setHydrated] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setHydrated(true);

        // Auth Listeners
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const user = session?.user ?? null;
            const employee = globalState.employees.find(e => e.user_id === user?.id) || null;
            
            const newState = { ...globalState, session, user, currentEmployee: employee };
            commitState(newState);
        });

        const initData = async () => {
            setLoading(true);
            try {
                const results = await Promise.all([
                    supabase.from('products').select('*'),
                    supabase.from('orders').select('*'),
                    supabase.from('ingredients').select('*'),
                    supabase.from('employees').select('*'),
                    supabase.from('order_statuses').select('*'),
                    supabase.from('inventory_logs').select('*'),
                    supabase.from('payment_methods').select('*'),
                    supabase.from('expenses').select('*'),
                    supabase.from('config').select('*')
                ]);

                // Individual Validation & Fallbacks
                // Normalizamos 'recipe' a [] si viene null/undefined de Supabase JSON
                const rawProducts = (results[0].data && results[0].data.length > 0) ? results[0].data : MOCK_PRODUCTS;
                    return { 
                        ...p, 
                        recipe: Array.isArray(p.recipe) ? p.recipe : []
                        // Note: Fallbacks are now handled in the UI components to avoid polluting the DB
                    };

                // Normalizamos 'items' a [] si viene null/undefined de Supabase JSON
                const rawOrders = (results[1].data && results[1].data.length > 0) ? results[1].data : [];
                const orders = rawOrders.map((o: any) => ({ ...o, items: Array.isArray(o.items) ? o.items : [] }));

                // Normalizar ingredients: asegurar que `group` nunca sea null (Supabase puede retornar null)
                const rawIngredients = (results[2].data && results[2].data.length > 0) ? results[2].data : MOCK_INGREDIENTS;
                const ingredients = rawIngredients.map((ing: any) => ({ ...ing, group: ing.group ?? "" }));
                const employees = (results[3].data && results[3].data.length > 0) ? results[3].data : MOCK_EMPLOYEES;
                const orderStatuses = (results[4].data && results[4].data.length > 0) ? results[4].data : MOCK_ORDER_STATUSES;
                const inventoryLogs = (results[5].data && results[5].data.length > 0) ? results[5].data : MOCK_INVENTORY_LOGS;
                const expenses = (results[7].data && results[7].data.length > 0) ? results[7].data : MOCK_EXPENSES;
                
                // Config: read from Supabase first, fallback to local/global state, then to mock
                const rawConfigList = results[8].data;
                const rawConfig = (rawConfigList && Array.isArray(rawConfigList) && rawConfigList.length > 0) ? rawConfigList[0] : null;
                
                // CRITICAL FIX: Extract categories and ingredient_groups from config object.
                // Priority: Supabase DB → localStorage (globalState) → hardcoded mocks
                let categories = (
                    (rawConfig?.categories && Array.isArray(rawConfig.categories) && rawConfig.categories.length > 0)
                        ? rawConfig.categories
                        : (globalState.categories && globalState.categories.length > 0)
                            ? globalState.categories
                            : MOCK_CATEGORIES
                );

                // SMART MERGE: Si el estado local tiene categorías que NO están en la DB, las preservamos.
                // Esto evita que una DB desincronizada borre el trabajo del usuario al recargar.
                if (globalState.categories && globalState.categories.length > categories.length) {
                    const extraLocal = globalState.categories.filter(c => !categories.includes(c));
                    if (extraLocal.length > 0) {
                        console.log("[Store] Recuperando categorías locales no sincronizadas:", extraLocal);
                        categories = [...new Set([...categories, ...extraLocal])];
                    }
                }

                const ingredientGroups = (
                    (rawConfig?.ingredient_groups && Array.isArray(rawConfig.ingredient_groups) && rawConfig.ingredient_groups.length > 0)
                        ? rawConfig.ingredient_groups
                        : (globalState.ingredientGroups && globalState.ingredientGroups.length > 0)
                            ? globalState.ingredientGroups
                            : MOCK_INGREDIENT_GROUPS
                );

                // Build final config merging DB values with the resolved arrays
                const configFromDB: AppConfig = rawConfig
                    ? { ...rawConfig, categories, ingredient_groups: ingredientGroups }
                    : { ...globalState.config, categories, ingredient_groups: ingredientGroups };

                let paymentMethods = (results[6].data && results[6].data.length > 0) ? results[6].data : MOCK_PAYMENT_METHODS;
                paymentMethods = paymentMethods.map((m: any) => {
                    if (m.id === "transferencia" && (!m.options || m.options.length === 0)) {
                        const defaultOpt = MOCK_PAYMENT_METHODS.find(mp => mp.id === "transferencia")?.options || [];
                        return { ...m, options: defaultOpt };
                    }
                    return m;
                });

                const currentEmployee = employees.find(e => e.user_id === globalState.user?.id) || null;

                globalState = {
                    ...globalState,
                    products,
                    orders,
                    ingredients,
                    employees,
                    orderStatuses,
                    inventoryLogs,
                    paymentMethods,
                    expenses,
                    categories,
                    ingredientGroups,
                    config: configFromDB,
                    currentEmployee
                };
                
                commitState(globalState);
                setState(globalState);
                setLoading(false);

                // Garantizar que la base de datos esté sincronizada con la configuración final
                // Si no había config, o si detectamos que faltaban categorías (merge), actualizamos la DB.
                const needsSync = !rawConfig || (categories.length > (rawConfig?.categories?.length || 0));
                
                if (needsSync) {
                    console.log("[Store] Sincronizando configuración con Supabase...");
                    persistToSupabase('config', { 
                        ...configFromDB, 
                        id: rawConfig?.id || 1,
                        categories: categories,
                        ingredient_groups: ingredientGroups
                    });
                }

                if (results[1].error && results[1].error.code !== "PGRST116") console.error("Error fetching orders:", results[1].error);
                if (results[3].error) console.error("Error fetching employees:", results[3].error);

            } catch (err) {
                console.warn("Critical error in initData, using local state:", err);
                setLoading(false);
            }
        };

        // Always run initData to get fresh employees with user_id. If products are cached, we skip heavy reload.
        initData();

        if (!masterChannel && typeof window !== "undefined") {
            // Re-check employee on first load after data is fetched
            const checkUser = async () => {
                const { data: { session } } = await supabase.auth.getSession();
                const user = session?.user ?? null;
                // Always fetch fresh employees from DB to get user_id field
                const { data: freshEmployees } = await supabase.from('employees').select('*');
                const employees = (freshEmployees && freshEmployees.length > 0) ? freshEmployees : globalState.employees;
                const employee = employees.find(e => e.user_id === user?.id) || null;
                globalState = { ...globalState, employees, session, user, currentEmployee: employee };
                commitState(globalState);
            };
            checkUser();
            masterChannel = supabase.channel('brasa_master_stream_v3')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async () => {
                    const { data } = await supabase.from('orders').select('*');
                    if (data) { globalState = { ...globalState, orders: data }; commitState(globalState); }
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_logs' }, async () => {
                    const { data } = await supabase.from('inventory_logs').select('*');
                    if (data) { globalState = { ...globalState, inventoryLogs: data }; commitState(globalState); }
                })
                .subscribe();
        }

        listeners.add(setState);
        return () => { listeners.delete(setState); };
    }, []);

    const addOrder = useCallback((order: Order) => {
        let newIngredients = [...globalState.ingredients];
        let newLogs = [...globalState.inventoryLogs];

        order.items.forEach(item => {
            const product = globalState.products.find(p => p.id === item.product_id);
            if (product && product.recipe) {
                product.recipe.forEach(rec => {
                    const ingIdx = newIngredients.findIndex(i => i.id === rec.ingredient_id);
                    if (ingIdx > -1) {
                        const ingredient = newIngredients[ingIdx];
                        const deduction = item.quantity * rec.quantity;
                        newIngredients[ingIdx] = { ...ingredient, stock: Math.max(0, ingredient.stock - deduction) };
                        const log = { id: "log_" + Date.now().toString(36), ingredient_id: rec.ingredient_id, ingredient_name: ingredient.name, type: "out" as "in" | "out", quantity: deduction, reason: `Venta TKT-${order.id.slice(-4).toUpperCase()}`, user: "Sistema", date: new Date().toISOString() };
                        newLogs.push(log);
                        persistToSupabase('inventory_logs', log);
                    }
                });
            }
        });

        const newState = { ...globalState, orders: [...globalState.orders, order], ingredients: newIngredients, inventoryLogs: newLogs };
        commitState(newState);
        persistToSupabase('orders', order);
        newIngredients.forEach(ing => persistToSupabase('ingredients', ing));
    }, []);

    const updateIngredientStock = useCallback((id: string, amt: number) => {
        const ingredient = globalState.ingredients.find(i => i.id === id);
        const log = { id: "log_" + Date.now().toString(36), ingredient_id: id, ingredient_name: ingredient?.name || "Desconocido", type: "in" as "in" | "out", quantity: amt, reason: "Ingreso Manual / Logística", user: "Admin", date: new Date().toISOString() };
        const newState = { 
            ...globalState, 
            ingredients: globalState.ingredients.map(i => i.id === id ? { ...i, stock: i.stock + amt } : i),
            inventoryLogs: [...globalState.inventoryLogs, log]
        };
        commitState(newState);
        const up = newState.ingredients.find(i => i.id === id);
        if (up) persistToSupabase('ingredients', up);
        persistToSupabase('inventory_logs', log);
    }, []);

    const updateOrderStatus = useCallback((orderId: string, status: string) => {
        const order = globalState.orders.find(o => o.id === orderId);
        if (!order) return;

        const oldStatusObj = globalState.orderStatuses.find(s => s.id === order.status);
        const newStatusObj = globalState.orderStatuses.find(s => s.id === status);

        const wasCancelled = oldStatusObj?.category === "cancelled";
        const isCancelled = newStatusObj?.category === "cancelled";

        let newIngredients = [...globalState.ingredients];
        let newLogs = [...globalState.inventoryLogs];

        if (!wasCancelled && isCancelled) {
            // Devolver stock
            order.items.forEach(item => {
                const product = globalState.products.find(p => p.id === item.product_id);
                if (product && product.recipe) {
                    product.recipe.forEach(rec => {
                        const ingIdx = newIngredients.findIndex(i => i.id === rec.ingredient_id);
                        if (ingIdx > -1) {
                            const ingredient = newIngredients[ingIdx];
                            const quantity = item.quantity * rec.quantity;
                            newIngredients[ingIdx] = { ...ingredient, stock: ingredient.stock + quantity };
                            const log = { id: "log_" + Date.now().toString(36), ingredient_id: rec.ingredient_id, ingredient_name: ingredient.name, type: "in" as "in" | "out", quantity, reason: `Cancelación TKT-${order.id.slice(-4).toUpperCase()}`, user: "Sistema", date: new Date().toISOString() };
                            newLogs.push(log);
                            persistToSupabase('inventory_logs', log);
                        }
                    });
                }
            });
        } else if (wasCancelled && !isCancelled) {
            // Descontar stock (reversión)
            order.items.forEach(item => {
                const product = globalState.products.find(p => p.id === item.product_id);
                if (product && product.recipe) {
                    product.recipe.forEach(rec => {
                        const ingIdx = newIngredients.findIndex(i => i.id === rec.ingredient_id);
                        if (ingIdx > -1) {
                            const ingredient = newIngredients[ingIdx];
                            const quantity = item.quantity * rec.quantity;
                            newIngredients[ingIdx] = { ...ingredient, stock: Math.max(0, ingredient.stock - quantity) };
                            const log = { id: "log_" + Date.now().toString(36), ingredient_id: rec.ingredient_id, ingredient_name: ingredient.name, type: "out" as "in" | "out", quantity, reason: `Reversión Cancelación TKT-${order.id.slice(-4).toUpperCase()}`, user: "Sistema", date: new Date().toISOString() };
                            newLogs.push(log);
                            persistToSupabase('inventory_logs', log);
                        }
                    });
                }
            });
        }

        const newState = { 
            ...globalState, 
            orders: globalState.orders.map(o => o.id === orderId ? { ...o, status } : o),
            ingredients: newIngredients,
            inventoryLogs: newLogs
        };
        commitState(newState);
        const up = newState.orders.find(o => o.id === orderId);
        if (up) persistToSupabase('orders', up);
        newIngredients.forEach(ing => persistToSupabase('ingredients', ing));
    }, []);

    const appendItemToOrder = useCallback((orderId: string, item: any) => {
        const order = globalState.orders.find(o => o.id === orderId);
        if (!order) return;

        const product = globalState.products.find(p => p.id === item.product_id);
        const itemPrice = product ? product.price : 0;
        const newItem = { 
            ...item, 
            product_name: product?.name || item.product_id, 
            subtotal: item.quantity * itemPrice 
        };

        const updatedOrder = { 
            ...order, 
            items: [...order.items, newItem],
            total: order.total + newItem.subtotal
        };

        const newState = { ...globalState, orders: globalState.orders.map(o => o.id === orderId ? updatedOrder : o) };
        commitState(newState);
        persistToSupabase('orders', updatedOrder);
    }, []);

    const removeOrder = useCallback((orderId: string) => {
        const newState = { ...globalState, orders: globalState.orders.filter(o => o.id !== orderId) };
        commitState(newState);
        supabase.from('orders').delete().match({ id: orderId }).then();
    }, []);

    const addCategory = useCallback((name: string) => {
        if (!name || globalState.categories.includes(name)) return;
        const newCategories = [...globalState.categories, name];
        const newConfig = { ...globalState.config, categories: newCategories };
        globalState = { ...globalState, categories: newCategories, config: newConfig };
        commitState(globalState);
        persistToSupabase('config', { ...newConfig, id: globalState.config.id || 1 });
    }, []);

    const removeCategory = useCallback((name: string) => {
        const newCategories = globalState.categories.filter(c => c !== name);
        const newConfig = { ...globalState.config, categories: newCategories };
        globalState = { ...globalState, categories: newCategories, config: newConfig };
        commitState(globalState);
        persistToSupabase('config', { ...newConfig, id: globalState.config.id || 1 });
    }, []);

    const updateCategory = useCallback((oldName: string, newName: string) => {
        if (!newName || globalState.categories.includes(newName)) return;
        const newCategories = globalState.categories.map(c => c === oldName ? newName : c);
        const newProducts = globalState.products.map(p => p.category === oldName ? { ...p, category: newName } : p);
        const newConfig = { ...globalState.config, categories: newCategories };
        globalState = { ...globalState, categories: newCategories, products: newProducts, config: newConfig };
        commitState(globalState);
        persistToSupabase('config', { ...newConfig, id: globalState.config.id || 1 });
        // También persistir productos actualizados si es necesario (ya lo hace commitState localmente)
        newProducts.forEach(p => {
             if (p.category === newName) persistToSupabase('products', p);
        });
    }, []);

    const addIngredientGroup = useCallback((name: string) => {
        if (!name || globalState.ingredientGroups.includes(name)) return;
        const newGroups = [...globalState.ingredientGroups, name];
        const newConfig = { ...globalState.config, ingredient_groups: newGroups };
        globalState = { ...globalState, ingredientGroups: newGroups, config: newConfig };
        commitState(globalState);
        persistToSupabase('config', { ...newConfig, id: globalState.config.id || 1 });
    }, []);

    const removeIngredientGroup = useCallback((name: string) => {
        const newGroups = globalState.ingredientGroups.filter(g => g !== name);
        const newConfig = { ...globalState.config, ingredient_groups: newGroups };
        globalState = { ...globalState, ingredientGroups: newGroups, config: newConfig };
        commitState(globalState);
        persistToSupabase('config', { ...newConfig, id: globalState.config.id || 1 });
    }, []);

    const updateIngredientGroup = useCallback((oldName: string, newName: string) => {
        if (!newName || globalState.ingredientGroups.includes(newName)) return;
        const newGroups = globalState.ingredientGroups.map(g => g === oldName ? newName : g);
        const newIngredients = globalState.ingredients.map(i => i.group === oldName ? { ...i, group: newName } : i);
        const newConfig = { ...globalState.config, ingredient_groups: newGroups };
        globalState = { ...globalState, ingredientGroups: newGroups, ingredients: newIngredients, config: newConfig };
        commitState(globalState);
        persistToSupabase('config', { ...newConfig, id: globalState.config.id || 1 });
        newIngredients.forEach(i => {
            if (i.group === newName) persistToSupabase('ingredients', i);
        });
    }, []);

    return { 
        state, hydrated, loading,
        addOrder, updateIngredientStock, updateOrderStatus,
        addCategory, removeCategory, updateCategory,
        addIngredientGroup, removeIngredientGroup, updateIngredientGroup,
        removeOrder, appendItemToOrder,
        updateConfig: (updates: Partial<AppConfig>) => {
            const newConfig = { ...globalState.config, ...updates };
            // CRITICAL FIX: Keep root-level categories and ingredientGroups in sync with config
            const syncedCategories = newConfig.categories ?? globalState.categories;
            const syncedGroups = newConfig.ingredient_groups ?? globalState.ingredientGroups;
            globalState = { 
                ...globalState, 
                config: newConfig,
                categories: syncedCategories,
                ingredientGroups: syncedGroups
            };
            commitState(globalState);
            persistToSupabase('config', { ...newConfig, id: globalState.config.id || 1 });
        },
        getProductAvailability: (p: Product) => {
            if (!p.recipe || p.recipe.length === 0) return 99;
            let min = Infinity;
            p.recipe.forEach(r => {
                const ing = globalState.ingredients.find(i => i.id === r.ingredient_id);
                if (ing) { const pos = Math.floor(ing.stock / r.quantity); if (pos < min) min = pos; }
            });
            return min === Infinity ? 0 : min;
        },
        addEmployee: (e: Employee) => {
            const newState = { ...globalState, employees: [...globalState.employees, e] };
            commitState(newState);
            persistToSupabase('employees', e);
        },
        addOrderStatus: (s: OrderStatusConfig) => {
            const newState = { ...globalState, orderStatuses: [...globalState.orderStatuses, s] };
            commitState(newState);
            persistToSupabase('order_statuses', s);
        },
        removeOrderStatus: (id: string) => {
            const newState = { ...globalState, orderStatuses: globalState.orderStatuses.filter(s => s.id !== id) };
            commitState(newState);
            supabase.from('order_statuses').delete().match({ id }).then();
        },
        editOrderStatus: (id: string, updates: any) => {
            const target = globalState.orderStatuses.find(s => s.id === id);
            if (!target) return;
            const updated = { ...target, ...updates };
            const newState = { ...globalState, orderStatuses: globalState.orderStatuses.map(s => s.id === id ? updated : s) };
            commitState(newState);
            persistToSupabase('order_statuses', updated);
        },
        addProductWithRecipe: (p: Product) => {
            const newState = { ...globalState, products: [...globalState.products, p] };
            commitState(newState);
            persistToSupabase('products', p);
        },
        editProduct: (id: string, updates: any) => {
            const target = globalState.products.find(p => p.id === id);
            if (!target) return;
            const updated = { ...target, ...updates };
            const newState = { ...globalState, products: globalState.products.map(p => p.id === id ? updated : p) };
            commitState(newState);
            persistToSupabase('products', updated);
        },
        removeProduct: (id: string) => {
            const newState = { ...globalState, products: globalState.products.filter(p => p.id !== id) };
            commitState(newState);
            supabase.from('products').delete().match({ id }).then();
        },
        addIngredient: (i: Ingredient) => {
            // Normalizar group antes de persistir
            const normalized = { ...i, group: i.group ?? "" };
            const newState = { ...globalState, ingredients: [...globalState.ingredients, normalized] };
            commitState(newState);
            persistToSupabase('ingredients', normalized);
        },
        editIngredient: (id: string, updates: any) => {
            const target = globalState.ingredients.find(i => i.id === id);
            if (!target) return;
            // CRITICAL: Normalizar group para que nunca sea undefined/null al persistir en Supabase
            const updated = { 
                ...target, 
                ...updates,
                group: (updates.group !== undefined ? updates.group : target.group) ?? ""
            };
            const newState = { ...globalState, ingredients: globalState.ingredients.map(i => i.id === id ? updated : i) };
            commitState(newState);
            persistToSupabase('ingredients', updated);
        },
        removeIngredient: (id: string) => {
            const newState = { ...globalState, ingredients: globalState.ingredients.filter(i => i.id !== id) };
            commitState(newState);
            supabase.from('ingredients').delete().match({ id }).then();
        },
        addPaymentMethod: (pm: PaymentMethod) => {
            const newState = { ...globalState, paymentMethods: [...globalState.paymentMethods, pm] };
            commitState(newState);
            persistToSupabase('payment_methods', pm);
        },
        editPaymentMethod: (id: string, updates: Partial<PaymentMethod>) => {
            const target = globalState.paymentMethods.find(pm => pm.id === id);
            if (!target) return;
            const updated = { ...target, ...updates };
            const newState = { ...globalState, paymentMethods: globalState.paymentMethods.map(pm => pm.id === id ? updated : pm) };
            commitState(newState);
            persistToSupabase('payment_methods', updated);
        },
        removePaymentMethod: (id: string) => {
            const newState = { ...globalState, paymentMethods: globalState.paymentMethods.filter(pm => pm.id !== id) };
            commitState(newState);
            supabase.from('payment_methods').delete().match({ id }).then();
        },
        addExpense: (e: Expense) => {
            const newState = { ...globalState, expenses: [...globalState.expenses, e] };
            commitState(newState);
            persistToSupabase('expenses', e);
        },
        editExpense: (id: string, updates: Partial<Expense>) => {
            const target = globalState.expenses.find(x => x.id === id);
            if (!target) return;
            const updated = { ...target, ...updates };
            const newState = { ...globalState, expenses: globalState.expenses.map(x => x.id === id ? updated : x) };
            commitState(newState);
            persistToSupabase('expenses', updated);
        },
        removeExpense: (id: string) => {
            const newState = { ...globalState, expenses: globalState.expenses.filter(x => x.id !== id) };
            commitState(newState);
            supabase.from('expenses').delete().match({ id }).then();
        },
        signIn: async (email: string, pass: string) => {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
            if (error) throw error;
            return data;
        },
        signOut: async () => {
            await supabase.auth.signOut();
            // Limpiar completamente el globalState para evitar mezcla de datos al re-login
            const freshState: AppState = {
                products: MOCK_PRODUCTS,
                ingredients: MOCK_INGREDIENTS,
                orders: [],
                employees: MOCK_EMPLOYEES,
                inventoryLogs: MOCK_INVENTORY_LOGS,
                orderStatuses: MOCK_ORDER_STATUSES,
                paymentMethods: MOCK_PAYMENT_METHODS,
                categories: MOCK_CATEGORIES,
                ingredientGroups: MOCK_INGREDIENT_GROUPS,
                expenses: MOCK_EXPENSES,
                config: MOCK_CONFIG,
                user: null,
                session: null,
                currentEmployee: null,
            };
            globalState = freshState;
            if (typeof window !== "undefined") {
                localStorage.removeItem("brasa-state-bom-v2");
            }
            commitState(freshState);
        }
    };
}
