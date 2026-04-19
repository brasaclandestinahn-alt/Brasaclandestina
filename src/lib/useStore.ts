"use client";
import { useState, useEffect, useCallback } from "react";
import { MOCK_PRODUCTS, MOCK_INGREDIENTS, MOCK_ORDERS, MOCK_EMPLOYEES, MOCK_INVENTORY_LOGS, MOCK_ORDER_STATUSES, Product, Order, Ingredient, Employee, InventoryLog, OrderStatusConfig, OrderItem } from "./mockDB";
import { supabase } from "./supabase";

interface AppState {
  products: Product[];
  ingredients: Ingredient[];
  orders: Order[];
  employees: Employee[];
  inventoryLogs: InventoryLog[];
  orderStatuses: OrderStatusConfig[];
}

const getInitialState = (): AppState => {
  if (typeof window !== "undefined") {
    const local = localStorage.getItem("brasa-state-bom-v2");
    if (local) {
      try {
        const parsed = JSON.parse(local);
        let savedStatuses = parsed.orderStatuses || MOCK_ORDER_STATUSES;
        if (!savedStatuses.some((s: OrderStatusConfig) => s.category === "cancelled")) {
            savedStatuses = [...savedStatuses, { id: "cancelled", label: "Cancelado / Anulado", color: "#ef4444", category: "cancelled", order: savedStatuses.length + 1 }];
        }
        return { 
          ...parsed, 
          orderStatuses: savedStatuses 
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
    orderStatuses: MOCK_ORDER_STATUSES 
  };
};

let globalState: AppState = getInitialState();
const listeners = new Set<(state: AppState) => void>();

const notifyListeners = () => {
  listeners.forEach(listener => listener(globalState));
};

const commitState = async (newState: AppState, source: 'local' | 'remote' = 'local') => {
  globalState = newState;
  if (typeof window !== "undefined") {
    localStorage.setItem("brasa-state-bom-v2", JSON.stringify(newState));
    const channel = new BroadcastChannel("brasa-realtime-bom-v2");
    channel.postMessage("STATE_UPDATED");
    channel.close();
  }
  notifyListeners(); 
};

const persistToSupabase = async (table: string, data: any, method: 'upsert' | 'delete' = 'upsert') => {
    try {
        if (method === 'upsert') {
            await supabase.from(table).upsert(data);
        } else {
            await supabase.from(table).delete().match({ id: data.id });
        }
    } catch (err) {
        console.error(`Error persistiendo en ${table}:`, err);
    }
};

export function useAppState() {
  const [state, setState] = useState<AppState>(globalState);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setHydrated(true);
    
    let isMounted = true;

    const loadInitialData = async () => {
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Timeout Supabase")), 3000)
        );

        try {
            const fetchPromise = Promise.all([
                supabase.from('orders').select('*'),
                supabase.from('ingredients').select('*'),
                supabase.from('products').select('*'),
                supabase.from('employees').select('*'),
                supabase.from('inventory_logs').select('*'),
                supabase.from('order_statuses').select('*')
            ]);

            const results: any = await Promise.race([fetchPromise, timeoutPromise]);
            
            const [
                {data: orders}, 
                {data: ingredients}, 
                {data: products}, 
                {data: employees}, 
                {data: logs}, 
                {data: statuses}
            ] = results;

            if (isMounted) {
                if (orders && orders.length > 0) {
                    globalState = {
                        orders: orders || [],
                        ingredients: ingredients || [],
                        products: products || [],
                        employees: employees || [],
                        inventoryLogs: logs || [],
                        orderStatuses: (statuses && statuses.length > 0) ? statuses : MOCK_ORDER_STATUSES
                    };
                    commitState(globalState, 'remote');
                    setState(globalState);
                }
            }
        } catch (error) {
            console.warn("⚠️ Modo Offline activo:", error);
        } finally {
            if (isMounted) setLoading(false);
        }
    };

    loadInitialData();

    // Realtime logic
    let orderChannel: any;
    if (!(window as any)._supabase_subscribed) {
        orderChannel = supabase.channel('realtime_orders')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async () => {
                const { data: latestOrders } = await supabase.from('orders').select('*');
                if (latestOrders && isMounted) {
                    globalState = { ...globalState, orders: latestOrders };
                    commitState(globalState, 'remote');
                    setState(globalState);
                }
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') (window as any)._supabase_subscribed = true;
            });
    }

    listeners.add(setState);

    return () => {
        isMounted = false;
        listeners.delete(setState);
        if (orderChannel) {
            (window as any)._supabase_subscribed = false;
            supabase.removeChannel(orderChannel);
        }
    };
  }, []);

  const addOrder = useCallback((order: Order) => {
    let newState = { ...globalState, orders: [...globalState.orders, order] };
    let newIngredients = [...newState.ingredients];
    let newLogs = [...newState.inventoryLogs];
    
    order.items.forEach(item => {
      const product = newState.products.find(p => p.id === item.product_id);
      if (product && product.recipe) {
         product.recipe.forEach(rec => {
           const ingIdx = newIngredients.findIndex(ing => ing.id === rec.ingredient_id);
           if (ingIdx > -1) {
             const deduction = item.quantity * rec.quantity;
             newIngredients[ingIdx] = {
               ...newIngredients[ingIdx],
               stock: Math.max(0, newIngredients[ingIdx].stock - deduction)
             };
             newLogs.push({
               id: "log_" + Date.now().toString(36),
               ingredient_id: rec.ingredient_id,
               type: "out",
               quantity: deduction,
               reason: `Venta TKT-${order.id.slice(-4).toUpperCase()}`,
               user: "Sistema POS",
               date: new Date().toISOString()
             });
           }
         });
      }
    });

    newState.ingredients = newIngredients;
    newState.inventoryLogs = newLogs;
    commitState(newState);
    persistToSupabase('orders', order);
    persistToSupabase('ingredients', newIngredients);
    persistToSupabase('inventory_logs', newLogs[newLogs.length - 1]);
  }, []);

  const appendItemToOrder = useCallback((orderId: string, item: OrderItem) => {
    const orderIndex = globalState.orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return;
    const oldOrder = globalState.orders[orderIndex];
    let newIngredients = [...globalState.ingredients];
    let newLogs = [...globalState.inventoryLogs];
    const product = globalState.products.find(p => p.id === item.product_id);
    if (product && product.recipe) {
        product.recipe.forEach(rec => {
          const ingIdx = newIngredients.findIndex(ing => ing.id === rec.ingredient_id);
          if (ingIdx > -1) {
            const deduction = item.quantity * rec.quantity;
            newIngredients[ingIdx] = { ...newIngredients[ingIdx], stock: Math.max(0, newIngredients[ingIdx].stock - deduction) };
            newLogs.push({ id: "log_" + Date.now().toString(36), ingredient_id: rec.ingredient_id, type: "out", quantity: deduction, reason: `Adición a TKT-${orderId.slice(-4).toUpperCase()}`, user: "Sistema Admin", date: new Date().toISOString() });
          }
        });
    }
    const addedSubtotal = (product?.price || 0) * item.quantity;
    const existingItemIndex = oldOrder.items.findIndex(i => i.product_id === item.product_id);
    let newItemsList = [...oldOrder.items];
    if (existingItemIndex > -1) {
      newItemsList[existingItemIndex] = { ...newItemsList[existingItemIndex], quantity: newItemsList[existingItemIndex].quantity + item.quantity, subtotal: newItemsList[existingItemIndex].subtotal + addedSubtotal };
    } else {
      newItemsList.push({ product_id: item.product_id, quantity: item.quantity, subtotal: addedSubtotal });
    }
    const updatedOrder = { ...oldOrder, items: newItemsList, total: oldOrder.total + addedSubtotal };
    const newOrders = [...globalState.orders];
    newOrders[orderIndex] = updatedOrder;
    commitState({ ...globalState, orders: newOrders, ingredients: newIngredients, inventoryLogs: newLogs });
    persistToSupabase('orders', updatedOrder);
    persistToSupabase('ingredients', newIngredients);
  }, []);

  const updateOrderStatus = useCallback((orderId: string, status: string) => {
    const oldOrder = globalState.orders.find(o => o.id === orderId);
    if (!oldOrder) return;
    const newStatusObj = globalState.orderStatuses.find(s => s.id === status);
    const isCancelling = newStatusObj && newStatusObj.category === "cancelled";
    let newIngredients = [...globalState.ingredients];
    let newLogs = [...globalState.inventoryLogs];
    let willRefund = false;
    if (isCancelling && !oldOrder.is_refunded) {
       willRefund = true;
       oldOrder.items.forEach(item => {
         const product = globalState.products.find(p => p.id === item.product_id);
         if (product && product.recipe) {
            product.recipe.forEach(rec => {
              const ingIdx = newIngredients.findIndex(ing => ing.id === rec.ingredient_id);
              if (ingIdx > -1) {
                 const refundAmt = item.quantity * rec.quantity;
                 newIngredients[ingIdx] = { ...newIngredients[ingIdx], stock: newIngredients[ingIdx].stock + refundAmt };
                 newLogs.push({ id: "log_" + Date.now().toString(36), ingredient_id: rec.ingredient_id, type: "in", quantity: refundAmt, reason: `Reversión por Ticket Cancelado TKT-${orderId.slice(-4).toUpperCase()}`, user: "Sistema Admin", date: new Date().toISOString() });
              }
            });
         }
       });
    }
    const updatedOrder = { ...oldOrder, status, ...(willRefund ? { is_refunded: true } : {}) };
    commitState({ ...globalState, orders: globalState.orders.map(o => o.id === orderId ? updatedOrder : o), ingredients: newIngredients, inventoryLogs: newLogs });
    persistToSupabase('orders', updatedOrder);
    persistToSupabase('ingredients', newIngredients);
  }, []);

  const updateIngredientStock = useCallback((ingredientId: string, addedStock: number) => {
    const newState = { ...globalState, ingredients: globalState.ingredients.map(ing => ing.id === ingredientId ? { ...ing, stock: ing.stock + addedStock } : ing) };
    const newLog = { id: "log_" + Date.now().toString(36), ingredient_id: ingredientId, type: "in", quantity: addedStock, reason: "Ingreso Manual (Logística)", user: "Admin / Gerencia", date: new Date().toISOString() };
    newState.inventoryLogs = [...newState.inventoryLogs, newLog];
    commitState(newState);
    persistToSupabase('ingredients', newState.ingredients.find(ing => ing.id === ingredientId));
    persistToSupabase('inventory_logs', newLog);
  }, []);

  const addProductWithRecipe = useCallback((product: Product) => {
    commitState({ ...globalState, products: [...globalState.products, product] });
    persistToSupabase('products', product);
  }, []);

  const editProduct = useCallback((id: string, updates: Partial<Product>) => {
    const updated = globalState.products.find(p => p.id === id);
    if (!updated) return;
    const finalProduct = { ...updated, ...updates };
    commitState({ ...globalState, products: globalState.products.map(p => p.id === id ? finalProduct : p) });
    persistToSupabase('products', finalProduct);
  }, []);

  const addEmployee = useCallback((employee: Employee) => {
    commitState({ ...globalState, employees: [...globalState.employees, employee] });
    persistToSupabase('employees', employee);
  }, []);

  const addIngredient = useCallback((ingredient: Ingredient) => {
    commitState({ ...globalState, ingredients: [...globalState.ingredients, ingredient] });
    persistToSupabase('ingredients', ingredient);
  }, []);

  const editIngredient = useCallback((id: string, updates: Partial<Ingredient>) => {
    const updated = globalState.ingredients.find(ing => ing.id === id);
    if (!updated) return;
    const finalIng = { ...updated, ...updates };
    commitState({ ...globalState, ingredients: globalState.ingredients.map(ing => ing.id === id ? finalIng : ing) });
    persistToSupabase('ingredients', finalIng);
  }, []);

  const removeIngredient = useCallback((id: string) => {
    commitState({ ...globalState, ingredients: globalState.ingredients.filter(ing => ing.id !== id) });
    persistToSupabase('ingredients', { id }, 'delete');
  }, []);

  const addOrderStatus = useCallback((statusConfig: OrderStatusConfig) => {
    commitState({ ...globalState, orderStatuses: [...globalState.orderStatuses, statusConfig] });
    persistToSupabase('order_statuses', statusConfig);
  }, []);

  const editOrderStatus = useCallback((id: string, updates: Partial<OrderStatusConfig>) => {
    const target = globalState.orderStatuses.find(s => s.id === id);
    if (!target) return;
    const finalStatus = { ...target, ...updates };
    commitState({ ...globalState, orderStatuses: globalState.orderStatuses.map(s => s.id === id ? finalStatus : s) });
    persistToSupabase('order_statuses', finalStatus);
  }, []);

  const removeOrderStatus = useCallback((id: string) => {
    commitState({ ...globalState, orderStatuses: globalState.orderStatuses.filter(s => s.id !== id) });
    persistToSupabase('order_statuses', { id }, 'delete');
  }, []);

  const getProductAvailability = useCallback((product: Product) => {
    if (!product.recipe || product.recipe.length === 0) return 1; 
    let minPossible = Infinity;
    for (let rec of product.recipe) {
       const ing = state.ingredients.find(i => i.id === rec.ingredient_id);
       if (!ing) return 0;
       const possible = Math.floor(ing.stock / rec.quantity);
       if (possible < minPossible) minPossible = possible;
    }
    return minPossible;
  }, [state.ingredients]);

  return { state, hydrated, loading, addOrder, appendItemToOrder, updateOrderStatus, updateIngredientStock, addProductWithRecipe, editProduct, addEmployee, addIngredient, editIngredient, removeIngredient, addOrderStatus, editOrderStatus, removeOrderStatus, getProductAvailability };
}
