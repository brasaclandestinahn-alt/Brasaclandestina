"use client";
import { useState, useEffect, useCallback } from "react";
import { MOCK_PRODUCTS, MOCK_INGREDIENTS, MOCK_ORDERS, MOCK_EMPLOYEES, MOCK_INVENTORY_LOGS, MOCK_ORDER_STATUSES, Product, Order, Ingredient, Employee, InventoryLog, OrderStatusConfig } from "./mockDB";

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
      const parsed = JSON.parse(local);
      let savedStatuses = parsed.orderStatuses || MOCK_ORDER_STATUSES;
      if (!savedStatuses.some((s: OrderStatusConfig) => s.category === "cancelled")) {
          savedStatuses = [...savedStatuses, { id: "cancelled", label: "Cancelado / Anulado", color: "#ef4444", category: "cancelled", order: savedStatuses.length + 1 }];
      }
      return { 
        ...parsed, 
        orderStatuses: savedStatuses 
      };
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

// GLOBAL SINGLETON STORE
let globalState: AppState = getInitialState();
const listeners = new Set<(state: AppState) => void>();

const notifyListeners = () => {
  listeners.forEach(listener => listener(globalState));
};

const commitState = (newState: AppState) => {
  globalState = newState;
  if (typeof window !== "undefined") {
    localStorage.setItem("brasa-state-bom-v2", JSON.stringify(newState));
    const channel = new BroadcastChannel("brasa-realtime-bom-v2");
    channel.postMessage("STATE_UPDATED");
    channel.close();
  }
  notifyListeners(); 
};

export function useAppState() {
  const [state, setState] = useState<AppState>(globalState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    
    // Resync constantly on mount
    const freshData = localStorage.getItem("brasa-state-bom-v2");
    if (freshData) {
       const parsed = JSON.parse(freshData);
       let savedStatuses = parsed.orderStatuses || MOCK_ORDER_STATUSES;
       if (!savedStatuses.some((s: OrderStatusConfig) => s.category === "cancelled")) {
           savedStatuses = [...savedStatuses, { id: "cancelled", label: "Cancelado / Anulado", color: "#ef4444", category: "cancelled", order: savedStatuses.length + 1 }];
       }
       globalState = {
         ...parsed,
         orderStatuses: savedStatuses
       };
       setState(globalState);
    }
    
    listeners.add(setState);
    
    if (!localStorage.getItem("brasa-state-bom-v2")) {
      commitState(globalState);
    }
    
    // Cross-tab fallback via Storage API
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "brasa-state-bom-v2" && e.newValue) {
        const parsed = JSON.parse(e.newValue);
        globalState = {
          ...parsed,
          orderStatuses: parsed.orderStatuses || MOCK_ORDER_STATUSES
        };
        setState(globalState);
      }
    };
    window.addEventListener("storage", handleStorage);

    // Broadcast channel for aggressive realtime updates
    const channel = new BroadcastChannel("brasa-realtime-bom-v2");
    channel.onmessage = (event) => {
      if (event.data === "STATE_UPDATED") {
        const latest = localStorage.getItem("brasa-state-bom-v2");
        if (latest) {
          const parsed = JSON.parse(latest);
          globalState = {
            ...parsed,
            orderStatuses: parsed.orderStatuses || MOCK_ORDER_STATUSES
          };
          setState(globalState);
        }
      }
    };
    
    return () => {
      listeners.delete(setState);
      window.removeEventListener("storage", handleStorage);
      channel.close();
    };
  }, []);

  const addOrder = useCallback((order: Order) => {
    // 1. Clonar estado
    let newState = { ...globalState, orders: [...globalState.orders, order] };
    
    // 2. Extraer logs e ingredientes limpios
    let newIngredients = [...newState.ingredients];
    let newLogs = [...newState.inventoryLogs];
    
    // 3. Deduct stock based on RECIPES (BOM Logic)
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
               id: "log_" + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
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
  }, []);

  const appendItemToOrder = useCallback((orderId: string, item: OrderItem) => {
    const orderIndex = globalState.orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return;

    const oldOrder = globalState.orders[orderIndex];
    let newIngredients = [...globalState.ingredients];
    let newLogs = [...globalState.inventoryLogs];

    // Compute deduction for the single newly added item
    const product = globalState.products.find(p => p.id === item.product_id);
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
              id: "log_" + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
              ingredient_id: rec.ingredient_id,
              type: "out",
              quantity: deduction,
              reason: `Adición a TKT-${orderId.slice(-4).toUpperCase()}`,
              user: "Sistema Admin",
              date: new Date().toISOString()
            });
          }
        });
    }

    // Determine subtotal for new item
    const addedSubtotal = (product?.price || 0) * item.quantity;
    
    // Check if product is already in the order to increment, otherwise push
    const existingItemIndex = oldOrder.items.findIndex(i => i.product_id === item.product_id);
    let newItemsList = [...oldOrder.items];
    
    if (existingItemIndex > -1) {
      newItemsList[existingItemIndex] = {
        ...newItemsList[existingItemIndex],
        quantity: newItemsList[existingItemIndex].quantity + item.quantity,
        subtotal: newItemsList[existingItemIndex].subtotal + addedSubtotal
      };
    } else {
      newItemsList.push({
        product_id: item.product_id,
        quantity: item.quantity,
        subtotal: addedSubtotal
      });
    }

    const updatedOrder = {
      ...oldOrder,
      items: newItemsList,
      total: oldOrder.total + addedSubtotal
    };

    const newOrders = [...globalState.orders];
    newOrders[orderIndex] = updatedOrder;

    commitState({
      ...globalState,
      orders: newOrders,
      ingredients: newIngredients,
      inventoryLogs: newLogs
    });
  }, []);

  const updateOrderStatus = useCallback((orderId: string, status: string) => {
    // 1. Encontrar la orden actual
    const oldOrder = globalState.orders.find(o => o.id === orderId);
    if (!oldOrder) return;

    // 2. Revisar si la nueva categoría es 'cancelled'
    const newStatusObj = globalState.orderStatuses.find(s => s.id === status);
    const isCancelling = newStatusObj && newStatusObj.category === "cancelled";

    let newIngredients = [...globalState.ingredients];
    let newLogs = [...globalState.inventoryLogs];
    let willRefund = false;

    // 3. Reversar Inventario si se está cancelando y nunca ha sido regresado
    if (isCancelling && !oldOrder.is_refunded) {
       willRefund = true;
       oldOrder.items.forEach(item => {
         const product = globalState.products.find(p => p.id === item.product_id);
         if (product && product.recipe) {
            product.recipe.forEach(rec => {
              const ingIdx = newIngredients.findIndex(ing => ing.id === rec.ingredient_id);
              if (ingIdx > -1) {
                 const refundAmt = item.quantity * rec.quantity;
                 newIngredients[ingIdx] = {
                   ...newIngredients[ingIdx],
                   stock: newIngredients[ingIdx].stock + refundAmt
                 };

                 newLogs.push({
                   id: "log_" + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
                   ingredient_id: rec.ingredient_id,
                   type: "in",
                   quantity: refundAmt,
                   reason: `Reversión por Ticket Cancelado TKT-${orderId.slice(-4).toUpperCase()}`,
                   user: "Sistema Admin",
                   date: new Date().toISOString()
                 });
              }
            });
         }
       });
    }

    const updatedOrder = {
       ...oldOrder,
       status,
       ...(willRefund ? { is_refunded: true } : {})
    };

    const newState = { 
      ...globalState, 
      orders: globalState.orders.map(o => o.id === orderId ? updatedOrder : o),
      ingredients: newIngredients,
      inventoryLogs: newLogs
    };
    commitState(newState);
  }, []);

  const updateIngredientStock = useCallback((ingredientId: string, addedStock: number) => {
    const newState = {
      ...globalState,
      ingredients: globalState.ingredients.map(ing => ing.id === ingredientId ? { ...ing, stock: ing.stock + addedStock } : ing)
    };
    
    newState.inventoryLogs = [...newState.inventoryLogs, {
      id: "log_" + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      ingredient_id: ingredientId,
      type: "in",
      quantity: addedStock,
      reason: "Ingreso Manual (Logística)",
      user: "Admin / Gerencia",
      date: new Date().toISOString()
    }];

    commitState(newState);
  }, []);

  const addProductWithRecipe = useCallback((product: Product) => {
    commitState({ ...globalState, products: [...globalState.products, product] });
  }, []);

  const editProduct = useCallback((id: string, updates: Partial<Product>) => {
    commitState({
      ...globalState,
      products: globalState.products.map(p => p.id === id ? { ...p, ...updates } : p)
    });
  }, []);

  const addEmployee = useCallback((employee: Employee) => {
    commitState({ ...globalState, employees: [...globalState.employees, employee] });
  }, []);

  const addIngredient = useCallback((ingredient: Ingredient) => {
    commitState({ ...globalState, ingredients: [...globalState.ingredients, ingredient] });
  }, []);

  const editIngredient = useCallback((id: string, updates: Partial<Ingredient>) => {
    commitState({
      ...globalState,
      ingredients: globalState.ingredients.map(ing => ing.id === id ? { ...ing, ...updates } : ing)
    });
  }, []);

  const removeIngredient = useCallback((id: string) => {
    commitState({
      ...globalState,
      ingredients: globalState.ingredients.filter(ing => ing.id !== id)
    });
  }, []);

  const addOrderStatus = useCallback((statusConfig: OrderStatusConfig) => {
    commitState({ ...globalState, orderStatuses: [...globalState.orderStatuses, statusConfig] });
  }, []);

  const editOrderStatus = useCallback((id: string, updates: Partial<OrderStatusConfig>) => {
    commitState({
      ...globalState,
      orderStatuses: globalState.orderStatuses.map(s => s.id === id ? { ...s, ...updates } : s)
    });
  }, []);

  const removeOrderStatus = useCallback((id: string) => {
    commitState({
      ...globalState,
      orderStatuses: globalState.orderStatuses.filter(s => s.id !== id)
    });
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

  return { state, hydrated, addOrder, appendItemToOrder, updateOrderStatus, updateIngredientStock, addProductWithRecipe, editProduct, addEmployee, addIngredient, editIngredient, removeIngredient, addOrderStatus, editOrderStatus, removeOrderStatus, getProductAvailability };
}
