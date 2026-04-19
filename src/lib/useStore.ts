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

const persistToSupabase = async (table: string, data: any) => {
    try {
        await supabase.from(table).upsert(data);
    } catch (err) {
        console.error("Error Supabase:", err);
    }
};

export function useAppState() {
  const [state, setState] = useState<AppState>(globalState);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false); // Iniciar en false para evitar bloqueos visuales
  const isSubscribed = useRef(false);

  useEffect(() => {
    setHydrated(true);
    
    // 1. CARGA DE DATOS BÁSICA
    const loadInitialData = async () => {
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
        } catch (err) {
            console.error("Error de sincronización inicial:", err);
        }
    };

    loadInitialData();

    // 2. REALTIME (CORREGIDO: Orden estricto y blindaje de instancia)
    const orderChannel = supabase.channel('realtime_orders');
    
    if (!isSubscribed.current) {
        console.log("📡 Iniciando canal Realtime...");
        
        orderChannel
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async () => {
                console.log("🔔 Cambio detectado en órdenes!");
                const { data } = await supabase.from('orders').select('*');
                if (data) {
                    globalState = { ...globalState, orders: data };
                    commitState(globalState);
                    setState(globalState);
                }
            })
            .subscribe((status) => {
                console.log("✅ Estado de suscripción Realtime:", status);
            });
        
        isSubscribed.current = true;
    }

    listeners.add(setState);
    
    return () => { 
        console.log("🧹 Limpiando conexiones...");
        listeners.delete(setState); 
        if (orderChannel) {
            supabase.removeChannel(orderChannel);
            isSubscribed.current = false;
        }
    };

  }, []);

  const addOrder = useCallback((order: Order) => {
    const newState = { ...globalState, orders: [...globalState.orders, order] };
    commitState(newState);
    persistToSupabase('orders', order);
  }, []);

  const updateOrderStatus = useCallback((orderId: string, status: string) => {
    const newState = { 
        ...globalState, 
        orders: globalState.orders.map(o => o.id === orderId ? { ...o, status } : o) 
    };
    commitState(newState);
    const updated = newState.orders.find(o => o.id === orderId);
    if (updated) persistToSupabase('orders', updated);
  }, []);

  const addEmployee = useCallback((employee: Employee) => {
    const newState = { ...globalState, employees: [...globalState.employees, employee] };
    commitState(newState);
    persistToSupabase('employees', employee);
  }, []);

  const addOrderStatus = useCallback((status: OrderStatusConfig) => {
    const newState = { ...globalState, orderStatuses: [...globalState.orderStatuses, status] };
    commitState(newState);
    persistToSupabase('order_statuses', status);
  }, []);

  const removeOrderStatus = useCallback((id: string) => {
    const newState = { ...globalState, orderStatuses: globalState.orderStatuses.filter(s => s.id !== id) };
    commitState(newState);
    supabase.from('order_statuses').delete().match({ id });
  }, []);

  const getProductAvailability = useCallback((product: Product) => {
    return 99; // Mock de disponibilidad
  }, []);

  return { 
    state, hydrated, loading, 
    addOrder, updateOrderStatus, addEmployee, 
    addOrderStatus, removeOrderStatus, getProductAvailability,
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
