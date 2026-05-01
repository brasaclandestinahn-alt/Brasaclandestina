import { createBrowserClient } from '@supabase/ssr';
import { Order, Product, Ingredient } from './mockDB';

const supabaseUrl = 'https://dttzcmwxtdxmnttituov.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0dHpjbXd4dGR4bW50dGl0dW92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MTUwODYsImV4cCI6MjA5MjE5MTA4Nn0.em8ani9304qw1QQJxgcQE7-AQnFglXtpbvEOEDCKdaA';

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

/**
 * Crea una orden y descuenta automáticamente los ingredientes del inventario.
 */
export const createOrderWithInventory = async (
    order: Order, 
    products: Product[], 
    ingredients: Ingredient[]
) => {
    try {
        // 1. Insertar la orden
        const { error: orderError } = await supabase.from('orders').insert(order);
        if (orderError) throw orderError;

        // 2. Calcular deducciones de ingredientes
        const deductions: { [id: string]: { amount: number, name: string } } = {};
        
        order.items.forEach(item => {
            const product = products.find(p => p.id === item.product_id);
            if (product && product.recipe) {
                product.recipe.forEach(rec => {
                    const ing = ingredients.find(i => i.id === rec.ingredient_id);
                    if (ing) {
                        if (!deductions[ing.id]) {
                            deductions[ing.id] = { amount: 0, name: ing.name };
                        }
                        deductions[ing.id].amount += (item.quantity * rec.quantity);
                    }
                });
            }
        });

        // 3. Actualizar stock y crear logs
        const updatePromises = Object.entries(deductions).map(async ([id, data]) => {
            const ingredient = ingredients.find(i => i.id === id);
            if (!ingredient) return;

            const newStock = ingredient.stock - data.amount;
            
            // Actualizar tabla de ingredientes
            const { error: ingError } = await supabase
                .from('ingredients')
                .update({ stock: newStock })
                .eq('id', id);
            
            if (ingError) throw ingError;

            // Insertar log de inventario
            const log = {
                id: `log_${Date.now()}_${id.slice(-4)}`,
                ingredient_id: id,
                ingredient_name: data.name,
                type: 'out',
                quantity: data.amount,
                reason: `Venta Online #${order.id.slice(-6).toUpperCase()}`,
                user: 'Sistema (Auto)',
                date: new Date().toISOString()
            };
            
            const { error: logError } = await supabase.from('inventory_logs').insert(log);
            if (logError) throw logError;
        });

        await Promise.all(updatePromises);
        return { success: true };
    } catch (err) {
        console.error("Error en createOrderWithInventory:", err);
        return { success: false, error: err };
    }
};
