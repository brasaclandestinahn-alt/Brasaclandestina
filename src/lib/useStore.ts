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
  const [loading, setLoading] = useState(true);
  const isSubscribed = useRef(false);

  useEffect(() => {
    setHydrated(true);
    
    // 1. CARGA DE DATOS CON TIMEOUT DE SEGURIDAD
    const loadInitialData = async () => {
        const timeout = setTimeout(() => {
            console.warn("⚠️ Timeout: Cargando modo local");
            setLoading(false);
        }, 3000);

        try {
            console.log("📡 Conectando con Supabase...");
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
            console.error("Fallo de red:", err);
        } finally {
            clearTimeout(timeout);
            setLoading(false);
        }
    };

    loadInitialData();

    // 2. REALTIME (UNA SOLA VEZ)
    if (!isSubscribed.current) {
        const channel = supabase.channel('global_refresh')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async () => {
                const { data } = await supabase.from('orders').select('*');
                if (data) {
                    globalState = { ...globalState, orders: data };
                    setState(globalState);
                }
            })
            .subscribe();
        
        isSubscribed.current = true;
        return () => {
            supabase.removeChannel(channel);
            isSubscribed.current = false;
        };
    }

    listeners.add(setState);
    return () => { listeners.delete(setState); };
  }, []);

  // FUNCIONES DE APOYO
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
    if (!product.recipe || product.recipe.length === 0) return 99;
    return 99; // Fallback simple para evitar bloqueos
  }, []);

  return { 
    state, hydrated, loading, 
    addOrder, updateOrderStatus, addEmployee, 
    addOrderStatus, removeOrderStatus, getProductAvailability,
    editOrderStatus: (id: string, up: any) => {}, // Placeholder para evitar errores de importación
    appendItemToOrder: (id: string, it: any) => {},
    updateIngredientStock: (id: string, it: any) => {},
    addProductWithRecipe: (p: any) => {},
    editProduct: (id: string, p: any) => {},
    addIngredient: (i: any) => {},
    editIngredient: (id: string, i: any) => {},
    removeIngredient: (id: string) => {}
  };
}
