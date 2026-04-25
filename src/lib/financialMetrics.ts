import { Order, Product, Ingredient } from "./mockDB";

export interface FinancialMetrics {
  totalSales: number;
  totalCost: number;
  grossProfit: number;
  marginPercent: number;
  foodCostPercent: number;
  orderCount: number;
  avgTicket: number;
}

/**
 * Calcula el costo de receta de un producto sumando insumos × cantidad.
 */
export const getProductCost = (
  product: Product | undefined,
  ingredients: Ingredient[]
): number => {
  if (!product || !product.recipe || product.recipe.length === 0) return 0;
  return product.recipe.reduce((acc, rec) => {
    const ing = ingredients.find(i => i.id === rec.ingredient_id);
    if (!ing) return acc;
    return acc + (ing.cost_per_unit * rec.quantity);
  }, 0);
};

/**
 * Calcula el costo total de los insumos consumidos por una orden.
 */
export const getOrderCost = (
  order: Order,
  products: Product[],
  ingredients: Ingredient[]
): number => {
  return order.items.reduce((acc, item) => {
    const product = products.find(p => p.id === item.product_id);
    const productCost = getProductCost(product, ingredients);
    return acc + (productCost * item.quantity);
  }, 0);
};

/**
 * Calcula métricas financieras agregadas para un grupo de órdenes.
 */
export const calculateMetrics = (
  orders: Order[],
  products: Product[],
  ingredients: Ingredient[]
): FinancialMetrics => {
  const totalSales = orders.reduce((acc, o) => acc + o.total, 0);
  const totalCost = orders.reduce(
    (acc, o) => acc + getOrderCost(o, products, ingredients), 
    0
  );
  const grossProfit = totalSales - totalCost;
  const marginPercent = totalSales > 0 
    ? (grossProfit / totalSales) * 100 
    : 0;
  const foodCostPercent = totalSales > 0 
    ? (totalCost / totalSales) * 100 
    : 0;
  
  return {
    totalSales,
    totalCost,
    grossProfit,
    marginPercent,
    foodCostPercent,
    orderCount: orders.length,
    avgTicket: orders.length > 0 ? totalSales / orders.length : 0,
  };
};

/**
 * Filtra órdenes por rango de fecha (excluye canceladas).
 */
export const filterOrdersByDateRange = (
  orders: Order[],
  orderStatuses: { id: string; category: string }[],
  startDate: Date,
  endDate: Date
): Order[] => {
  return orders.filter(o => {
    const statusObj = orderStatuses.find(s => s.id === o.status);
    if (statusObj?.category === "cancelled") return false;
    
    const orderDate = new Date(o.created_at);
    return orderDate >= startDate && orderDate <= endDate;
  });
};

/**
 * Helpers de fechas para los rangos comunes del dashboard.
 */
export const getDateRanges = () => {
  const now = new Date();
  
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const yesterdayEnd = new Date(todayEnd);
  yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
  
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);
  
  const monthStart = new Date(todayStart);
  monthStart.setDate(1);
  
  return { 
    todayStart, todayEnd, 
    yesterdayStart, yesterdayEnd,
    weekStart,
    monthStart
  };
};

/**
 * Calcula la diferencia porcentual entre dos valores.
 * Retorna null si current === 0 (sin datos comparables).
 */
export const getPercentChange = (
  current: number, 
  previous: number
): number | null => {
  if (previous === 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
};
