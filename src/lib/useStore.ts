"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { MOCK_PRODUCTS, MOCK_INGREDIENTS, MOCK_ORDERS, MOCK_EMPLOYEES, MOCK_INVENTORY_LOGS, MOCK_ORDER_STATUSES, MOCK_PAYMENT_METHODS, MOCK_CATEGORIES, MOCK_INGREDIENT_GROUPS, Product, Order, Ingredient, Employee, InventoryLog, OrderStatusConfig, OrderItem, PaymentMethod } from "./mockDB";
import { supabase } from "./supabase";

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
}

const getInitialState = (): AppState => {
  if (typeof window !== "undefined") {
    const local = localStorage.getItem("brasa-state-bom-v2");
    if (local) {
      try {
        const parsed = JSON.parse(local);
        return { 
          ...parsed, 
          orderStatuses: parsed.orderStatuses || MOCK_ORDER_STATUSES,
          paymentMethods: parsed.paymentMethods || MOCK_PAYMENT_METHODS,
          categories: parsed.categories || MOCK_CATEGORIES,
          ingredientGroups: parsed.ingredientGroups || MOCK_INGREDIENT_GROUPS
        };
      } catch (e) {
        console.error("Error parsing local state", e);
      }
    }
  }
  return { 
    products: MOCK_PRODUCTS, 
    ingredients: MOCK_INGREDIENTS, 
    orders: MOCK_ORDERS, 
    employees: MOCK_EMPLOYEES, 
    inventoryLogs: MOCK_INVENTORY_LOGS,
    orderStatuses: MOCK_ORDER_STATUSES,
    paymentMethods: MOCK_PAYMENT_METHODS,
    categories: MOCK_CATEGORIES,
    ingredientGroups: MOCK_INGREDIENT_GROUPS
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
        await supabase.from(table).upsert(data);
    } catch (err) {
        console.error(`Error persistiendo en ${table}:`, err);
    }
};

export function useAppState() {
    const [state, setState] = useState<AppState>(globalState);
    const [hydrated, setHydrated] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setHydrated(true);

        const initData = async () => {
            try {
                const [p, o, i, e, s, l, pm] = await Promise.all([
                    supabase.from('products').select('*'),
                    supabase.from('orders').select('*'),
                    supabase.from('ingredients').select('*'),
                    supabase.from('employees').select('*'),
                    supabase.from('order_statuses').select('*'),
                    supabase.from('inventory_logs').select('*'),
                    supabase.from('payment_methods').select('*')
                ]);

                // Individual Validation & Fallbacks
                const products = (p.data && p.data.length > 0) ? p.data : MOCK_PRODUCTS;
                const orders = (o.data && o.data.length > 0) ? o.data : [];
                const ingredients = (i.data && i.data.length > 0) ? i.data : MOCK_INGREDIENTS;
                const employees = (e.data && e.data.length > 0) ? e.data : MOCK_EMPLOYEES;
                const inventoryLogs = (l.data && l.data.length > 0) ? l.data : MOCK_INVENTORY_LOGS;
                const orderStatuses = (s.data && s.data.length > 0) ? s.data : MOCK_ORDER_STATUSES;
                
                let paymentMethods = (pm.data && pm.data.length > 0) ? pm.data : MOCK_PAYMENT_METHODS;
                paymentMethods = paymentMethods.map(m => {
                    if (m.id === "transferencia" && (!m.options || m.options.length === 0)) {
                        const defaultOpt = MOCK_PAYMENT_METHODS.find(mp => mp.id === "transferencia")?.options || [];
                        return { ...m, options: defaultOpt };
                    }
                    return m;
                });

                globalState = {
                    products,
                    orders,
                    ingredients,
                    employees,
                    inventoryLogs,
                    orderStatuses,
                    paymentMethods,
                    categories: globalState.categories,
                    ingredientGroups: globalState.ingredientGroups
                };
                
                commitState(globalState);
                setState(globalState);

                if (o.error && o.error.code !== "PGRST116") console.error("Error fetching orders:", o.error);
                if (e.error) console.error("Error fetching employees:", e.error);

            } catch (err) {
                console.warn("Critical error in initData, using local state:", err);
            }
        };

        if (globalState.products === MOCK_PRODUCTS) initData();

        if (!masterChannel && typeof window !== "undefined") {
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
                        const deduction = item.quantity * rec.quantity;
                        newIngredients[ingIdx] = { ...newIngredients[ingIdx], stock: Math.max(0, newIngredients[ingIdx].stock - deduction) };
                        const log = { id: "log_" + Date.now().toString(36), ingredient_id: rec.ingredient_id, type: "out" as "in" | "out", quantity: deduction, reason: `Venta TKT-${order.id.slice(-4).toUpperCase()}`, user: "Sistema", date: new Date().toISOString() };
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
        const log = { id: "log_" + Date.now().toString(36), ingredient_id: id, type: "in" as "in" | "out", quantity: amt, reason: "Ingreso Manual / Logística", user: "Admin", date: new Date().toISOString() };
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
        const newState = { ...globalState, orders: globalState.orders.map(o => o.id === orderId ? { ...o, status } : o) };
        commitState(newState);
        const up = newState.orders.find(o => o.id === orderId);
        if (up) persistToSupabase('orders', up);
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
        const newState = { ...globalState, categories: [...globalState.categories, name] };
        commitState(newState);
    }, []);

    const removeCategory = useCallback((name: string) => {
        const newState = { ...globalState, categories: globalState.categories.filter(c => c !== name) };
        commitState(newState);
    }, []);

    const updateCategory = useCallback((oldName: string, newName: string) => {
        if (!newName || globalState.categories.includes(newName)) return;
        const newCategories = globalState.categories.map(c => c === oldName ? newName : c);
        const newProducts = globalState.products.map(p => p.category === oldName ? { ...p, category: newName } : p);
        const newState = { ...globalState, categories: newCategories, products: newProducts };
        commitState(newState);
    }, []);

    const addIngredientGroup = useCallback((name: string) => {
        if (!name || globalState.ingredientGroups.includes(name)) return;
        const newState = { ...globalState, ingredientGroups: [...globalState.ingredientGroups, name] };
        commitState(newState);
    }, []);

    const removeIngredientGroup = useCallback((name: string) => {
        const newState = { ...globalState, ingredientGroups: globalState.ingredientGroups.filter(g => g !== name) };
        commitState(newState);
    }, []);

    const updateIngredientGroup = useCallback((oldName: string, newName: string) => {
        if (!newName || globalState.ingredientGroups.includes(newName)) return;
        const newGroups = globalState.ingredientGroups.map(g => g === oldName ? newName : g);
        const newIngredients = globalState.ingredients.map(i => i.group === oldName ? { ...i, group: newName } : i);
        const newState = { ...globalState, ingredientGroups: newGroups, ingredients: newIngredients };
        commitState(newState);
    }, []);

    return { 
        state, hydrated, loading,
        addOrder, updateIngredientStock, updateOrderStatus,
        addCategory, removeCategory, updateCategory,
        addIngredientGroup, removeIngredientGroup, updateIngredientGroup,
        removeOrder, appendItemToOrder,
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
            const newState = { ...globalState, ingredients: [...globalState.ingredients, i] };
            commitState(newState);
            persistToSupabase('ingredients', i);
        },
        editIngredient: (id: string, updates: any) => {
            const target = globalState.ingredients.find(i => i.id === id);
            if (!target) return;
            const updated = { ...target, ...updates };
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
    };
}
