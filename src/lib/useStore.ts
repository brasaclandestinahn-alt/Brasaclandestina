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
    const channelRef = useRef<any>(null);

    useEffect(() => {
        setHydrated(true);

        const syncData = async () => {
            try {
                const [
                    { data: products },
                    { data: orders },
                    { data: ingredients },
                    { data: employees },
                    { data: statuses },
                    { data: logs }
                ] = await Promise.all([
                    supabase.from('products').select('*'),
                    supabase.from('orders').select('*'),
                    supabase.from('ingredients').select('*'),
                    supabase.from('employees').select('*'),
                    supabase.from('order_statuses').select('*'),
                    supabase.from('inventory_logs').select('*')
                ]);

                if (products && products.length > 0) {
                    globalState = {
                        products: products || [],
                        orders: orders || [],
                        ingredients: ingredients || [],
                        employees: employees || [],
                        inventoryLogs: logs || [],
                        orderStatuses: (statuses && statuses.length > 0) ? statuses : MOCK_ORDER_STATUSES
                    };
                    commitState(globalState);
                    setState(globalState);
                }
            } catch (e) {
                console.warn("Sync failed, using offline cache.");
            }
        };

        syncData();

        if (!channelRef.current) {
            const channel = supabase.channel('brasa_realtime_full')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async () => {
                    const { data } = await supabase.from('orders').select('*');
                    if (data) {
                        globalState = { ...globalState, orders: data };
                        setState({ ...globalState });
                    }
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'ingredients' }, async () => {
                    const { data } = await supabase.from('ingredients').select('*');
                    if (data) {
                        globalState = { ...globalState, ingredients: data };
                        setState({ ...globalState });
                    }
                });
            
            setTimeout(() => {
                channel.subscribe();
                channelRef.current = channel;
            }, 1500);
        }

        listeners.add(setState);
        return () => {
            listeners.delete(setState);
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
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
        // Mantenemos esqueletos para que no rompa nada
        editOrderStatus: (id: string, up: any) => {},
        addProductWithRecipe: (p: any) => {},
        editProduct: (id: string, u: any) => {},
        addIngredient: (i: any) => {},
        editIngredient: (id: string, u: any) => {},
        removeIngredient: (id: string) => {}
    };
}
