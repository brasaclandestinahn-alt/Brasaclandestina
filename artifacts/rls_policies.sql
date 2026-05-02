-- ==========================================
-- ESTRATEGIA DE SEGURIDAD RLS - BRASA CLANDESTINA (CORREGIDA V2)
-- ==========================================

-- 0. Asegurar que las columnas críticas existan en la base de datos
DO $$ 
BEGIN 
    -- Verificar en 'employees'
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='user_id') THEN
        ALTER TABLE employees ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
    
    -- Verificar en 'orders'
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='user_id') THEN
        ALTER TABLE orders ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
    
    -- Añadir seller_id si falta (usado para vincular ventas con empleados)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='seller_id') THEN
        ALTER TABLE orders ADD COLUMN seller_id TEXT;
    END IF;
    
    -- Añadir payment_status si falta (mencionado en requerimientos previos)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='payment_status') THEN
        ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'pending';
    END IF;
END $$;

-- 1. Habilitar RLS en todas las tablas críticas
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;

-- 2. Función auxiliar para verificar el rol de 'admin'
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM employees
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. POLÍTICAS PARA LA TABLA 'employees'
DROP POLICY IF EXISTS "Admins can manage employees" ON employees;
CREATE POLICY "Admins can manage employees" ON employees
FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Users can read their own employee profile" ON employees;
CREATE POLICY "Users can read their own employee profile" ON employees
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- 4. POLÍTICAS PARA 'products' (Inventario)
DROP POLICY IF EXISTS "Public can read products" ON products;
CREATE POLICY "Public can read products" ON products
FOR SELECT TO public
USING (true);

DROP POLICY IF EXISTS "Admins can manage products" ON products;
CREATE POLICY "Admins can manage products" ON products
FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- 5. POLÍTICAS PARA 'ingredients' e 'inventory_logs' (Inventario)
DROP POLICY IF EXISTS "Admins can manage ingredients" ON ingredients;
CREATE POLICY "Admins can manage ingredients" ON ingredients
FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can manage inventory_logs" ON inventory_logs;
CREATE POLICY "Admins can manage inventory_logs" ON inventory_logs
FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- 6. POLÍTICAS PARA 'orders' (Finanzas/Ventas)
DROP POLICY IF EXISTS "Public can insert orders" ON orders;
CREATE POLICY "Public can insert orders" ON orders
FOR INSERT TO anon
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can create orders" ON orders;
CREATE POLICY "Authenticated users can create orders" ON orders
FOR INSERT TO authenticated
WITH CHECK (true);

-- Usuarios ven sus propias órdenes (por user_id o por ser el vendedor), admins ven todas
DROP POLICY IF EXISTS "Users can read their own orders or admins all" ON orders;
CREATE POLICY "Users can read their own orders or admins all" ON orders
FOR SELECT TO authenticated
USING (
    is_admin() OR 
    user_id = auth.uid() OR 
    (seller_id IS NOT NULL AND seller_id IN (SELECT id FROM employees WHERE user_id = auth.uid()))
);

DROP POLICY IF EXISTS "Admins can manage orders" ON orders;
CREATE POLICY "Admins can manage orders" ON orders
FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- 6.1 AUTOMATIZACIÓN DE INVENTARIO (TRIGGER)
-- Esta función descuenta automáticamente el stock cuando se inserta un pedido
CREATE OR REPLACE FUNCTION handle_order_inventory_deduction()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $body$
DECLARE
    item_record RECORD;
    product_recipe JSONB;
    recipe_item JSONB;
    deduction_qty NUMERIC;
    ing_name TEXT;
BEGIN
    -- Recorrer los items del pedido (formato esperado: product_id, quantity)
    FOR item_record IN SELECT * FROM jsonb_to_recordset(NEW.items) AS x(product_id TEXT, quantity NUMERIC)
    LOOP
        -- Obtener la receta del producto
        SELECT recipe INTO product_recipe FROM products WHERE id = item_record.product_id;
        
        IF product_recipe IS NOT NULL AND jsonb_array_length(product_recipe) > 0 THEN
            -- Recorrer cada ingrediente de la receta
            FOR recipe_item IN SELECT * FROM jsonb_array_elements(product_recipe)
            LOOP
                deduction_qty := (recipe_item->>'quantity')::NUMERIC * item_record.quantity;
                
                -- Obtener nombre del ingrediente para el log
                SELECT name INTO ing_name FROM ingredients WHERE id = recipe_item->>'ingredient_id';
                
                -- 1. Descontar de la tabla ingredients
                UPDATE ingredients 
                SET stock = stock - deduction_qty
                WHERE id = recipe_item->>'ingredient_id';
                
                -- 2. Registrar en inventory_logs
                INSERT INTO inventory_logs (id, ingredient_id, ingredient_name, type, quantity, reason, "user", date)
                VALUES (
                    'log_auto_' || encode(gen_random_bytes(4), 'hex') || '_' || to_char(NOW(), 'SSMI'),
                    recipe_item->>'ingredient_id',
                    ing_name,
                    'out',
                    deduction_qty,
                    'Venta TKT-' || UPPER(RIGHT(NEW.id, 4)),
                    'Sistema (Auto)',
                    NOW()
                );
            END LOOP;
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$body$;

DROP TRIGGER IF EXISTS trg_deduct_inventory_on_order ON orders;
CREATE TRIGGER trg_deduct_inventory_on_order
AFTER INSERT ON orders
FOR EACH ROW EXECUTE FUNCTION handle_order_inventory_deduction();

-- 7. POLÍTICAS PARA 'expenses' (Finanzas)
DROP POLICY IF EXISTS "Admins can manage expenses" ON expenses;
CREATE POLICY "Admins can manage expenses" ON expenses
FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- 8. POLÍTICAS PARA CONFIGURACIÓN Y TABLAS MAESTRAS
DROP POLICY IF EXISTS "Public can read config" ON config;
CREATE POLICY "Public can read config" ON config FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can read order_statuses" ON order_statuses;
CREATE POLICY "Public can read order_statuses" ON order_statuses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can read order_statuses_anon" ON order_statuses;
CREATE POLICY "Public can read order_statuses_anon" ON order_statuses FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Public can read payment_methods" ON payment_methods;
CREATE POLICY "Public can read payment_methods" ON payment_methods FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can read discounts" ON discounts;
CREATE POLICY "Public can read discounts" ON discounts FOR SELECT USING (true);

-- Escritura restringida a admins
DROP POLICY IF EXISTS "Admins can manage config" ON config;
CREATE POLICY "Admins can manage config" ON config FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can manage order_statuses" ON order_statuses;
CREATE POLICY "Admins can manage order_statuses" ON order_statuses FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can manage payment_methods" ON payment_methods;
CREATE POLICY "Admins can manage payment_methods" ON payment_methods FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can manage discounts" ON discounts;
CREATE POLICY "Admins can manage discounts" ON discounts FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
