"use client";
import { useState, useEffect, useCallback, useRef } from "react";
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
        return { 
          ...parsed, 
          orderStatuses: parsed.orderStatuses || MOCK_ORDER_STATUSES 
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
let masterChannel: any = null; // Singleton Connection

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

export function useAppState() {
    const [state, setState] = useState<AppState>(globalState);
    const [hydrated, setHydrated] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setHydrated(true);

        // 1. Cargador Inicial (Solo se dispara una vez por sesion)
        const initData = async () => {
            try {
                const [p, o, i, e, s, l] = await Promise.all([
                    supabase.from('products').select('*'),
                    supabase.from('orders').select('*'),
                    supabase.from('ingredients').select('*'),
                    supabase.from('employees').select('*'),
                    supabase.from('order_statuses').select('*'),
                    supabase.from('inventory_logs').select('*')
                ]);

                if (p.data && p.data.length > 0) {
                    globalState = {
                        products: p.data || [],
                        orders: o.data || [],
                        ingredients: i.data || [],
                        employees: e.data || [],
                        inventoryLogs: l.data || [],
                        orderStatuses: (s.data && s.data.length > 0) ? s.data : MOCK_ORDER_STATUSES
                    };
                    commitState(globalState);
                    setState(globalState);
                }
            } catch (err) {
                console.warn("Offline Mode");
            }
        };

        if (globalState.products === MOCK_PRODUCTS) initData();

        // 2. Singleton Realtime: Blindaje contra navegacion Admin
        if (!masterChannel && typeof window !== "undefined") {
            console.log("🚀 Iniciando Motor Realtime Único...");
            masterChannel = supabase.channel('brasa_master_stream')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async () => {
                    const { data } = await supabase.from('orders').select('*');
                    if (data) {
                        globalState = { ...globalState, orders: data };
                        commitState(globalState);
                    }
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'ingredients' }, async () => {
                    const { data } = await supabase.from('ingredients').select('*');
                    if (data) {
                        globalState = { ...globalState, ingredients: data };
                        commitState(globalState);
                    }
                })
                .subscribe((status) => {
                    console.log("📡 Master Stream Status:", status);
                });
        }

        listeners.add(setState);
        return () => {
            listeners.delete(setState);
        };
    }, []);

    const addOrder = useCallback((order: Order) => {
        const newState = { ...globalState, orders: [...globalState.orders, order] };
        commitState(newState);
        supabase.from('orders').upsert(order).then();
    }, []);

    const appendItemToOrder = useCallback((orderId: string, item: OrderItem) => {
        const order = globalState.orders.find(o => o.id === orderId);
        if (!order) return;
        const product = globalState.products.find(p => p.id === item.product_id);
        const addedSubtotal = (product?.price || 0) * item.quantity;
        const updatedOrder = { 
            ...order, 
            items: [...order.items, { ...item, subtotal: addedSubtotal }],
            total: order.total + addedSubtotal
        };
        const newState = { ...globalState, orders: globalState.orders.map(o => o.id === orderId ? updatedOrder : o) };
        commitState(newState);
        supabase.from('orders').upsert(updatedOrder).then();
    }, []);

    const updateOrderStatus = useCallback((orderId: string, status: string) => {
        const newState = { ...globalState, orders: globalState.orders.map(o => o.id === orderId ? { ...o, status } : o) };
        commitState(newState);
        const up = newState.orders.find(o => o.id === orderId);
        if (up) supabase.from('orders').upsert(up).then();
    }, []);

    const updateIngredientStock = useCallback((id: string, amt: number) => {
        const newState = { ...globalState, ingredients: globalState.ingredients.map(i => i.id === id ? { ...i, stock: i.stock + amt } : i) };
        commitState(newState);
        const up = newState.ingredients.find(i => i.id === id);
        if (up) supabase.from('ingredients').upsert(up).then();
    }, []);

    return { 
        state, hydrated, loading,
        addOrder, appendItemToOrder, updateOrderStatus, updateIngredientStock,
        getProductAvailability: (p: Product) => 99,
        addEmployee: (e: Employee) => {
            const newState = { ...globalState, employees: [...globalState.employees, e] };
            commitState(newState);
            supabase.from('employees').upsert(e).then();
        },
        addOrderStatus: (s: OrderStatusConfig) => {
            const newState = { ...globalState, orderStatuses: [...globalState.orderStatuses, s] };
            commitState(newState);
            supabase.from('order_statuses').upsert(s).then();
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
            supabase.from('order_statuses').upsert(updated).then();
        },
        addProductWithRecipe: (p: Product) => {
            const newState = { ...globalState, products: [...globalState.products, p] };
            commitState(newState);
            supabase.from('products').upsert(p).then();
        },
        editProduct: (id: string, updates: any) => {
            const target = globalState.products.find(p => p.id === id);
            if (!target) return;
            const updated = { ...target, ...updates };
            const newState = { ...globalState, products: globalState.products.map(p => p.id === id ? updated : p) };
            commitState(newState);
            supabase.from('products').upsert(updated).then();
        },
        addIngredient: (i: Ingredient) => {
            const newState = { ...globalState, ingredients: [...globalState.ingredients, i] };
            commitState(newState);
            supabase.from('ingredients').upsert(i).then();
        },
        editIngredient: (id: string, updates: any) => {
            const target = globalState.ingredients.find(i => i.id === id);
            if (!target) return;
            const updated = { ...target, ...updates };
            const newState = { ...globalState, ingredients: globalState.ingredients.map(i => i.id === id ? updated : i) };
            commitState(newState);
            supabase.from('ingredients').upsert(updated).then();
        },
        removeIngredient: (id: string) => {
            const newState = { ...globalState, ingredients: globalState.ingredients.filter(i => i.id !== id) };
            commitState(newState);
            supabase.from('ingredients').delete().match({ id }).then();
        }
    };
}
