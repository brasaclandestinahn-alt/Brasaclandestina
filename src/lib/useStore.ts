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

        // 1. Cargar datos en background
        const syncData = async () => {
            try {
                const { data: products } = await supabase.from('products').select('*');
                const { data: orders } = await supabase.from('orders').select('*');
                const { data: ingredients } = await supabase.from('ingredients').select('*');
                const { data: employees } = await supabase.from('employees').select('*');
                const { data: statuses } = await supabase.from('order_statuses').select('*');

                if (products && products.length > 0) {
                    globalState = {
                        ...globalState,
                        products: products || globalState.products,
                        orders: orders || globalState.orders,
                        ingredients: ingredients || globalState.ingredients,
                        employees: employees || globalState.employees,
                        orderStatuses: (statuses && statuses.length > 0) ? statuses : globalState.orderStatuses
                    };
                    commitState(globalState);
                    setState(globalState);
                }
            } catch (e) {
                console.warn("Sincronización silenciosa fallida, usando local.");
            }
        };

        syncData();

        // 2. Realtime Seguro: Solo si no hay uno activo
        if (!channelRef.current) {
            const channel = supabase.channel('brasa_realtime')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async () => {
                    const { data } = await supabase.from('orders').select('*');
                    if (data) {
                        globalState = { ...globalState, orders: data };
                        setState({ ...globalState });
                    }
                });
            
            // Suscripción con delay para evitar colapso de arranque
            setTimeout(() => {
                channel.subscribe((status) => {
                    console.log("Realtime Status:", status);
                });
                channelRef.current = channel;
            }, 1000);
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

    // Helpers
    const getProductAvailability = useCallback((product: Product) => 99, []);
    const addOrder = useCallback((order: Order) => {
        const newState = { ...globalState, orders: [...globalState.orders, order] };
        commitState(newState);
        supabase.from('orders').upsert(order).then();
    }, []);

    return { 
        state, hydrated, loading,
        addOrder,
        getProductAvailability,
        updateOrderStatus: (id: string, s: string) => {
            const newState = { ...globalState, orders: globalState.orders.map(o => o.id === id ? { ...o, status: s } : o) };
            commitState(newState);
            const up = newState.orders.find(o => o.id === id);
            if (up) supabase.from('orders').upsert(up).then();
        },
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
        // Placeholders para evitar errores de compilacion
        editOrderStatus: (id: string, updates: any) => {},
        appendItemToOrder: (id: string, item: any) => {},
        updateIngredientStock: (id: string, amt: any) => {},
        addProductWithRecipe: (p: any) => {},
        editProduct: (id: string, u: any) => {},
        addIngredient: (i: any) => {},
        editIngredient: (id: string, u: any) => {},
        removeIngredient: (id: string) => {}
    };
}
