"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { MOCK_PRODUCTS, MOCK_INGREDIENTS, MOCK_ORDERS, MOCK_EMPLOYEES, MOCK_INVENTORY_LOGS, MOCK_ORDER_STATUSES, MOCK_PAYMENT_METHODS, MOCK_CATEGORIES, MOCK_INGREDIENT_GROUPS, MOCK_CONFIG, MOCK_EXPENSES, Product, Order, Ingredient, Employee, InventoryLog, OrderStatusConfig, OrderItem, PaymentMethod, AppConfig, Expense, Partner, Discount } from "./mockDB";
import { supabase } from "./supabase";
import { User, Session } from "@supabase/supabase-js";

// Genera un ID único combinando timestamp + random para evitar 
// colisiones en operaciones rápidas (ej: forEach de recetas)
const generateLogId = (suffix: string = "") => {
  return "log_" 
    + Date.now().toString(36) 
    + "_" 
    + Math.random().toString(36).slice(2, 8)
    + (suffix ? "_" + suffix : "");
};

// Senior Storage Utility: Standalone and stable
export const uploadProductImage = async (file: File, path: string) => {
    try {
        // Primero verificamos si el bucket existe intentando listar (esto fallará si no hay bucket o no hay permisos)
        const { error: bucketError } = await supabase.storage.getBucket('products');
        if (bucketError) {
            console.error("Bucket Error:", bucketError);
            throw new Error(`El cubo 'products' no es accesible: ${bucketError.message}. Por favor, ejecute el código SQL proporcionado.`);
        }

        const { data, error } = await supabase.storage
            .from('products')
            .upload(path, file, { upsert: true, cacheControl: '3600' });
        
        if (error) {
            console.error("Supabase Upload Error:", error);
            throw error;
        }
        
        const { data: { publicUrl } } = supabase.storage
            .from('products')
            .getPublicUrl(data.path);
        
        return publicUrl;
    } catch (err) {
        console.error("Critical Storage Failure:", err);
        throw err; // Lanzamos el error para que el UI pueda mostrarlo
    }
};

export const uploadHeroImage = async (file: File): Promise<string> => {
  try {
    const { error: bucketError } = await supabase.storage
      .getBucket('branding');
    if (bucketError) {
      throw new Error(
        `El bucket 'branding' no es accesible: ${bucketError.message}. ` +
        `Ejecuta el SQL de configuración en Supabase.`
      );
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const path = `hero/hero-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from('branding')
      .upload(path, file, { 
        upsert: true, 
        cacheControl: '3600',
        contentType: file.type
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('branding')
      .getPublicUrl(path);

    return publicUrl;
  } catch (err) {
    console.error('[uploadHeroImage]', err);
    throw err;
  }
};

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  image_url?: string;
}

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
  lastUpdate?: number;
  loading: boolean;
  hydrated: boolean;
  cart: CartItem[];
  discounts: Discount[];
  appliedDiscountId: string | null;
}

const getInitialState = (): AppState => {
  if (typeof window !== "undefined") {
    const local = localStorage.getItem("brasa-state-bom-v2");
    if (local) {
      try {
        const parsed = JSON.parse(local);
        return { 
          ...parsed, 
          products: parsed.products || [],
          orderStatuses: parsed.orderStatuses || MOCK_ORDER_STATUSES,
          paymentMethods: parsed.paymentMethods || MOCK_PAYMENT_METHODS,
          categories: parsed.categories || MOCK_CATEGORIES,
          ingredientGroups: parsed.ingredientGroups || MOCK_INGREDIENT_GROUPS,
          expenses: parsed.expenses || MOCK_EXPENSES,
          config: parsed.config || MOCK_CONFIG,
          cart: parsed.cart || [],
          discounts: parsed.discounts || [],
          appliedDiscountId: parsed.appliedDiscountId || null,
          loading: true,
          hydrated: false
        };
      } catch (e) {
        console.error("Error parsing local state", e);
      }
    }
  }
  return { 
    products: [],
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
    loading: true,
    hydrated: false,
    cart: [],
    discounts: [],
    appliedDiscountId: null,
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
            let employee = globalState.employees.find(e => e.user_id === user?.id) || null;
            
            // SUPER ADMIN BYPASS
            if (!employee && user?.email === "jhonsroks@icloud.com") {
                employee = { id: "super-admin", name: "Super Admin", role: "admin", pin: "9999", user_id: user.id };
            }

            const newState = { ...globalState, session, user, currentEmployee: employee };
            commitState(newState);
        });

        const initData = async () => {
            // EVITAR SOBREESCRITURA: Si el estado ya está hidratado y tenemos órdenes,
            // no volvemos a cargar todo de Supabase inmediatamente al cambiar de página.
            // Esto previene que una respuesta lenta de Supabase sobreescriba cambios locales.
            if (globalState.hydrated && globalState.orders.length > 0) {
                return;
            }

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
                    supabase.from('config').select('*'),
                    supabase.from('discounts').select('*')
                ]);

                // Individual Validation & Fallbacks
                const rawProducts = (results[0].data && results[0].data.length > 0) ? results[0].data : MOCK_PRODUCTS;
                const products = rawProducts.map((p: any) => ({ 
                    ...p, 
                    recipe: Array.isArray(p.recipe) ? p.recipe : []
                }));

                const rawOrders = (results[1].data && results[1].data.length > 0) ? results[1].data : [];
                const orders = rawOrders.map((o: any) => ({ ...o, items: Array.isArray(o.items) ? o.items : [] }));

                const rawIngredients = (results[2].data && results[2].data.length > 0) ? results[2].data : MOCK_INGREDIENTS;
                const ingredients = rawIngredients.map((ing: any) => ({ ...ing, group: ing.group ?? "" }));
                const employees = (results[3].data && results[3].data.length > 0) ? results[3].data : MOCK_EMPLOYEES;
                const orderStatuses = (results[4].data && results[4].data.length > 0) ? results[4].data : MOCK_ORDER_STATUSES;
                const inventoryLogs = (results[5].data && results[5].data.length > 0) ? results[5].data : MOCK_INVENTORY_LOGS;
                let expenses: Expense[] = [];
                if (results[7].error) {
                  console.error("[Supabase] Error cargando expenses:", results[7].error);
                } else if (results[7].data && results[7].data.length > 0) {
                  expenses = results[7].data;
                } else {
                  expenses = MOCK_EXPENSES;
                }

                const discounts = (results[9].data && results[9].data.length > 0) ? results[9].data : [];
                
                const rawConfigList = results[8].data;
                const rawConfig = (rawConfigList && Array.isArray(rawConfigList) && rawConfigList.length > 0) ? rawConfigList[0] : null;
                
                let categories = (
                    (rawConfig?.categories && Array.isArray(rawConfig.categories) && rawConfig.categories.length > 0)
                        ? rawConfig.categories
                        : (globalState.categories && globalState.categories.length > 0)
                            ? globalState.categories
                            : MOCK_CATEGORIES
                );

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

                let currentEmployee = employees.find(e => e.user_id === globalState.user?.id) || null;

                if (!currentEmployee && globalState.user?.email === "jhonsroks@icloud.com") {
                    currentEmployee = { id: "super-admin", name: "Super Admin", role: "admin", pin: "9999", user_id: globalState.user.id };
                }

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
                    currentEmployee,
                    discounts,
                    loading: false,
                    hydrated: true
                };
                
                commitState(globalState);
                setState(globalState);
                setLoading(false);

            } catch (err) {
                console.warn("Critical error in initData, using local state:", err);
                globalState = { ...globalState, loading: false };
                setState(globalState);
                setLoading(false);
            }
        };

        initData();

        if (!masterChannel && typeof window !== "undefined") {
            const checkUser = async () => {
                const { data: { session } } = await supabase.auth.getSession();
                const user = session?.user ?? null;
                const { data: freshEmployees } = await supabase.from('employees').select('*');
                const employees = (freshEmployees && freshEmployees.length > 0) ? freshEmployees : globalState.employees;
                let employee = employees.find(e => e.user_id === user?.id) || null;

                if (!employee && user?.email === "jhonsroks@icloud.com") {
                    employee = { id: "super-admin", name: "Super Admin", role: "admin", pin: "9999", user_id: user.id };
                }

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
                .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
                    const { eventType, new: newRecord, old: oldRecord } = payload;
                    let updatedProducts = [...globalState.products];
                    
                    if (eventType === 'INSERT') {
                        // Verificar si ya existe (evita duplicado por optimistic update)
                        const yaExiste = updatedProducts.some(p => p.id === (newRecord as Product).id);
                        if (!yaExiste) {
                            updatedProducts.push({
                                ...(newRecord as Product),
                                recipe: Array.isArray((newRecord as Product).recipe) 
                                  ? (newRecord as Product).recipe 
                                  : []
                            });
                        }
                    } else if (eventType === 'UPDATE') {
                        if (newRecord.image_url && !newRecord.image_url.startsWith('data:')) {
                            const sep = newRecord.image_url.includes('?') ? '&' : '?';
                            newRecord.image_url = `${newRecord.image_url}${sep}t=${Date.now()}`;
                        }
                        updatedProducts = updatedProducts.map(p => p.id === newRecord.id ? { ...p, ...newRecord } : p);
                    } else if (eventType === 'DELETE') {
                        updatedProducts = updatedProducts.filter(p => p.id !== oldRecord.id);
                    }

                    globalState = { 
                        ...globalState, 
                        products: updatedProducts,
                        lastUpdate: Date.now()
                    };
                    commitState(globalState);
                })
                .on('postgres_changes', 
                  { event: '*', schema: 'public', table: 'expenses' }, 
                  (payload) => {
                    const { eventType, new: newRecord, old: oldRecord } = payload;
                    let updatedExpenses = [...globalState.expenses];
                    
                    if (eventType === 'INSERT') {
                      const yaExiste = updatedExpenses.some(
                        e => e.id === (newRecord as Expense).id
                      );
                      if (!yaExiste) {
                        updatedExpenses.push(newRecord as Expense);
                      }
                    } else if (eventType === 'UPDATE') {
                      updatedExpenses = updatedExpenses.map(e => 
                        e.id === (newRecord as Expense).id 
                          ? { ...e, ...(newRecord as Expense) } 
                          : e
                      );
                    } else if (eventType === 'DELETE') {
                      updatedExpenses = updatedExpenses.filter(e => 
                        e.id !== (oldRecord as Expense).id
                      );
                    }
                    
                    globalState = { ...globalState, expenses: updatedExpenses };
                    commitState(globalState);
                  }
                )
                .subscribe();
        }

        listeners.add(setState);
        return () => { listeners.delete(setState); };
    }, []);

    const addOrder = useCallback((order: Order) => {
        let newIngredients = [...globalState.ingredients];
        let newLogs = [...globalState.inventoryLogs];
        const affectedIngredientIds = new Set<string>();

        order.items.forEach(item => {
            const product = globalState.products.find(p => p.id === item.product_id);
            if (product && product.recipe && product.recipe.length > 0) {
                product.recipe.forEach(rec => {
                    const ingIdx = newIngredients.findIndex(i => i.id === rec.ingredient_id);
                    if (ingIdx > -1) {
                        const ingredient = newIngredients[ingIdx];
                        const deduction = item.quantity * rec.quantity;
                        newIngredients[ingIdx] = { ...ingredient, stock: ingredient.stock - deduction };
                        affectedIngredientIds.add(rec.ingredient_id);
                        const log = { id: generateLogId(), ingredient_id: rec.ingredient_id, ingredient_name: ingredient.name, type: "out" as "in" | "out", quantity: deduction, reason: `Venta TKT-${order.id.slice(-4).toUpperCase()}`, user: "Sistema", date: new Date().toISOString() };
                        newLogs.push(log);
                        persistToSupabase('inventory_logs', log);
                    }
                });
            } else if (product) {
                const warnLog = { 
                    id: generateLogId("warn"),
                    ingredient_id: "sin_receta",
                    ingredient_name: `⚠ Sin receta: ${product.name}`,
                    type: "out" as "in" | "out",
                    quantity: item.quantity,
                    reason: `Venta TKT-${order.id.slice(-4).toUpperCase()} · Producto sin receta configurada`,
                    user: "Sistema",
                    date: new Date().toISOString()
                };
                newLogs.push(warnLog);
                persistToSupabase('inventory_logs', warnLog);
            }
        });

        const newState = { ...globalState, orders: [...globalState.orders, order], ingredients: newIngredients, inventoryLogs: newLogs };
        commitState(newState);
        persistToSupabase('orders', order);
        
        // OPTIMIZACIÓN: Solo persistir los ingredientes afectados
        newIngredients
            .filter(ing => affectedIngredientIds.has(ing.id))
            .forEach(ing => persistToSupabase('ingredients', ing));
    }, []);

    const updateIngredientStock = useCallback((id: string, amt: number) => {
        const ingredient = globalState.ingredients.find(i => i.id === id);
        const log = { id: generateLogId(), ingredient_id: id, ingredient_name: ingredient?.name || "Desconocido", type: "in" as "in" | "out", quantity: amt, reason: "Ingreso Manual / Logística", user: "Admin", date: new Date().toISOString() };
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
        const affectedIngredientIds = new Set<string>();

        if (!wasCancelled && isCancelled) {
            order.items.forEach(item => {
                const product = globalState.products.find(p => p.id === item.product_id);
                if (product && product.recipe) {
                    product.recipe.forEach(rec => {
                        const ingIdx = newIngredients.findIndex(i => i.id === rec.ingredient_id);
                        if (ingIdx > -1) {
                            const ingredient = newIngredients[ingIdx];
                            const quantity = item.quantity * rec.quantity;
                            newIngredients[ingIdx] = { ...ingredient, stock: ingredient.stock + quantity };
                            affectedIngredientIds.add(rec.ingredient_id);
                            const log = { id: generateLogId(), ingredient_id: rec.ingredient_id, ingredient_name: ingredient.name, type: "in" as "in" | "out", quantity, reason: `Cancelación TKT-${order.id.slice(-4).toUpperCase()}`, user: "Sistema", date: new Date().toISOString() };
                            newLogs.push(log);
                            persistToSupabase('inventory_logs', log);
                        }
                    });
                }
            });
        } else if (wasCancelled && !isCancelled) {
            order.items.forEach(item => {
                const product = globalState.products.find(p => p.id === item.product_id);
                if (product && product.recipe) {
                    product.recipe.forEach(rec => {
                        const ingIdx = newIngredients.findIndex(i => i.id === rec.ingredient_id);
                        if (ingIdx > -1) {
                            const ingredient = newIngredients[ingIdx];
                            const quantity = item.quantity * rec.quantity;
                            newIngredients[ingIdx] = { ...ingredient, stock: ingredient.stock - quantity };
                            affectedIngredientIds.add(rec.ingredient_id);
                            const log = { id: generateLogId(), ingredient_id: rec.ingredient_id, ingredient_name: ingredient.name, type: "out" as "in" | "out", quantity, reason: `Reversión Cancelación TKT-${order.id.slice(-4).toUpperCase()}`, user: "Sistema", date: new Date().toISOString() };
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
        
        // OPTIMIZACIÓN: Solo persistir los ingredientes afectados
        newIngredients
            .filter(ing => affectedIngredientIds.has(ing.id))
            .forEach(ing => persistToSupabase('ingredients', ing));
    }, []);

    const updatePaymentStatus = useCallback((orderId: string, status: "pending" | "paid") => {
        const target = globalState.orders.find(o => o.id === orderId);
        if (!target) return;
        const updated = { ...target, payment_status: status };
        const newState = {
            ...globalState,
            orders: globalState.orders.map(o => o.id === orderId ? updated : o)
        };
        commitState(newState);
        persistToSupabase('orders', updated);
    }, []);

    const updateOrderDetails = useCallback((orderId: string, updates: Partial<Order>) => {
        const order = globalState.orders.find(o => o.id === orderId);
        if (!order) return;
        
        const updated = { ...order, ...updates };
        const newState = {
            ...globalState,
            orders: globalState.orders.map(o => o.id === orderId ? updated : o)
        };
        commitState(newState);
        persistToSupabase('orders', updated);
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
    
    const addDiscount = useCallback((d: Discount) => {
        const newState = { ...globalState, discounts: [...(globalState.discounts || []), d] };
        commitState(newState);
        persistToSupabase('discounts', d);
    }, []);

    const editDiscount = useCallback((id: string, updates: Partial<Discount>) => {
        const current = (globalState.discounts || []).find(d => d.id === id);
        if (!current) return;
        const updated = { ...current, ...updates };
        const newState = { ...globalState, discounts: (globalState.discounts || []).map(d => d.id === id ? updated : d) };
        commitState(newState);
        persistToSupabase('discounts', updated);
    }, []);

    const removeDiscount = useCallback((id: string) => {
        const newState = { ...globalState, discounts: (globalState.discounts || []).filter(d => d.id !== id) };
        commitState(newState);
        supabase.from('discounts').delete().match({ id }).then();
    }, []);

    const removeItemFromOrder = useCallback((orderId: string, itemIndex: number) => {
        const order = globalState.orders.find(o => o.id === orderId);
        if (!order) return;
        const updatedItems = order.items.filter((_, idx) => idx !== itemIndex);
        const newTotal = updatedItems.reduce((acc, i) => acc + i.subtotal, 0);
        const updatedOrder = { ...order, items: updatedItems, total: newTotal };
        const newState = { ...globalState, orders: globalState.orders.map(o => o.id === orderId ? updatedOrder : o) };
        commitState(newState);
        persistToSupabase('orders', updatedOrder);
    }, []);

    const updateItemQuantity = useCallback((orderId: string, itemIndex: number, newQty: number) => {
        const order = globalState.orders.find(o => o.id === orderId);
        if (!order || newQty < 1) return;
        const item = order.items[itemIndex];
        if (!item) return;
        const unitPrice = item.subtotal / item.quantity;
        const updatedItems = order.items.map((it, idx) => 
            idx === itemIndex ? { ...it, quantity: newQty, subtotal: unitPrice * newQty } : it
        );
        const newTotal = updatedItems.reduce((acc, i) => acc + i.subtotal, 0);
        const updatedOrder = { ...order, items: updatedItems, total: newTotal };
        const newState = { ...globalState, orders: globalState.orders.map(o => o.id === orderId ? updatedOrder : o) };
        commitState(newState);
        persistToSupabase('orders', updatedOrder);
    }, []);


    const appendCustomItemToOrder = useCallback((orderId: string, name: string, price: number, qty: number) => {
        const order = globalState.orders.find(o => o.id === orderId);
        if (!order) return;
        const newItem = {
            product_id: "custom_" + Date.now().toString(36),
            product_name: name,
            quantity: qty,
            subtotal: price * qty
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
        newProducts.forEach(p => {
             if (p.category === newName) persistToSupabase('products', p);
        });
    }, []);

    const reorderCategories = useCallback((fromIndex: number, toIndex: number) => {
      if (toIndex < 0 || toIndex >= globalState.categories.length) return;
      const newCategories = [...globalState.categories];
      const [moved] = newCategories.splice(fromIndex, 1);
      newCategories.splice(toIndex, 0, moved);
      const newConfig = { ...globalState.config, categories: newCategories };
      globalState = { ...globalState, categories: newCategories, config: newConfig };
      commitState(globalState);
      persistToSupabase('config', { ...newConfig, id: globalState.config.id || 1 });
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

    const setAppliedDiscountId = (id: string | null) => {
        commitState({ ...globalState, appliedDiscountId: id });
    };

    return { 
        state, hydrated, loading,
        addOrder, updateIngredientStock, updateOrderStatus, updatePaymentStatus, updateOrderDetails,
        addDiscount, editDiscount, removeDiscount, setAppliedDiscountId,
        addCategory, removeCategory, updateCategory, reorderCategories,
        addIngredientGroup, removeIngredientGroup, updateIngredientGroup,
        removeOrder, appendItemToOrder, removeItemFromOrder, updateItemQuantity,
        appendCustomItemToOrder,
        uploadProductImage,
        updateConfig: (updates: Partial<AppConfig>) => {
            const newConfig = { ...globalState.config, ...updates };
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
        addCustomUnit: (unit: string) => {
          const trimmed = unit.trim();
          if (!trimmed) return;
          const current = globalState.config?.custom_units || [];
          if (current.includes(trimmed)) return; // No duplicar
          const newConfig = { 
            ...globalState.config, 
            custom_units: [...current, trimmed] 
          };
          globalState = { ...globalState, config: newConfig };
          commitState(globalState);
          persistToSupabase('config', { 
            ...newConfig, 
            id: globalState.config.id || 1 
          });
        },
        removeCustomUnit: (unit: string) => {
          const current = globalState.config?.custom_units || [];
          const newConfig = { 
            ...globalState.config, 
            custom_units: current.filter((u: string) => u !== unit)
          };
          globalState = { ...globalState, config: newConfig };
          commitState(globalState);
          persistToSupabase('config', { 
            ...newConfig, 
            id: globalState.config.id || 1 
          });
        },
        updatePartners: (newPartners: Partner[]) => {
          const newConfig = { 
            ...globalState.config, 
            partners: newPartners 
          };
          globalState = { 
            ...globalState, 
            config: newConfig 
          };
          commitState(globalState);
          persistToSupabase('config', { 
            ...newConfig, 
            id: globalState.config.id || 1 
          });
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
        removeEmployee: (id: string) => {
            const newState = { ...globalState, employees: globalState.employees.filter(e => e.id !== id) };
            commitState(newState);
            supabase.from('employees').delete().match({ id }).then();
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
        editProduct: async (id: string, updates: any) => {
            const target = globalState.products.find(p => p.id === id);
            if (!target) return;

            // Senior Implementation: Cache Busting for non-Base64 URLs
            if (updates.image_url && !updates.image_url.startsWith('data:')) {
                const separator = updates.image_url.includes('?') ? '&' : '?';
                updates.image_url = `${updates.image_url}${separator}v=${Date.now()}`;
            }

            const updated = { ...target, ...updates };
            const newState = { ...globalState, products: globalState.products.map(p => p.id === id ? updated : p) };
            
            // Immediate Frontend Reactivity
            commitState(newState);
            
            // Asynchronous Persistence
            try {
                await persistToSupabase('products', updated);
                return { success: true };
            } catch (error) {
                console.error("Critical: Failed to save product to Supabase", error);
                return { success: false, error };
            }
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
        addInventoryLog: (log: InventoryLog) => {
            const newState = { ...globalState, inventoryLogs: [...globalState.inventoryLogs, log] };
            commitState(newState);
            persistToSupabase('inventory_logs', log);
        },
        addExpense: async (e: Expense) => {
            // Optimistic update: mostrar inmediatamente en UI
            const newState = { 
              ...globalState, 
              expenses: [...globalState.expenses, e] 
            };
            commitState(newState);
            
            // Persistir directamente (no usar persistToSupabase genérico)
            try {
              const { error } = await supabase
                .from('expenses')
                .upsert({
                  id: e.id,
                  description: e.description,
                  amount: e.amount,
                  date: e.date,
                  status: e.status,
                  category: e.category,
                  provider: e.provider || null
                });
              
              if (error) {
                console.error("[Supabase] Error guardando gasto:", error);
                alert(
                  "⚠️ El gasto se guardó localmente pero no pudo " +
                  "sincronizarse.\nError: " + error.message
                );
              }
            } catch (err: any) {
              console.error("[Supabase] Error crítico en addExpense:", err);
            }
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
                loading: false,
                hydrated: true,
                cart: [],
                discounts: [],
                appliedDiscountId: null,
            };
            globalState = freshState;
            if (typeof window !== "undefined") {
                localStorage.removeItem("brasa-state-bom-v2");
            }
            commitState(freshState);
        },
        addToCart: (item: CartItem) => {
            const existing = globalState.cart.find(i => i.id === item.id);
            let newCart;
            if (existing) {
                newCart = globalState.cart.map(i => i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i);
            } else {
                newCart = [...globalState.cart, item];
            }
            commitState({ ...globalState, cart: newCart });
        },
        removeFromCart: (id: string) => {
            commitState({ ...globalState, cart: globalState.cart.filter(i => i.id !== id) });
        },
        updateQuantity: (id: string, quantity: number) => {
            if (quantity <= 0) {
                commitState({ ...globalState, cart: globalState.cart.filter(i => i.id !== id) });
            } else {
                commitState({ ...globalState, cart: globalState.cart.map(i => i.id === id ? { ...i, quantity } : i) });
            }
        },
        clearCart: () => {
            commitState({ ...globalState, cart: [] });
        },
        getCartTotal: () => {
            return globalState.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        },
        getCartCount: () => {
            return globalState.cart.reduce((count, item) => count + item.quantity, 0);
        }
    };
}
