-- ==========================================
-- ESTRATEGIA DE SEGURIDAD RLS - BRASA CLANDESTINA (CORREGIDA V2)
-- ==========================================

-- 0. Asegurar que las tablas maestras existan en la base de datos
CREATE TABLE IF NOT EXISTS public.ingredients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    stock NUMERIC NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'u',
    cost_per_unit NUMERIC NOT NULL DEFAULT 0,
    "group" TEXT
);

CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    recipe JSONB DEFAULT '[]'::jsonb,
    inventory_tracking TEXT DEFAULT 'recipe',
    direct_ingredient_id TEXT
);

CREATE TABLE IF NOT EXISTS public.inventory_logs (
    id TEXT PRIMARY KEY,
    ingredient_id TEXT,
    ingredient_name TEXT,
    type TEXT NOT NULL,
    quantity NUMERIC NOT NULL,
    reason TEXT,
    "user" TEXT,
    date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    user_id UUID,
    seller_id TEXT,
    driver_id TEXT,
    table_number TEXT,
    customer_name TEXT,
    customer_phone TEXT,
    customer_address TEXT,
    type TEXT NOT NULL DEFAULT 'mesa',
    status TEXT NOT NULL DEFAULT 'pending',
    payment_method TEXT,
    payment_details TEXT,
    payment_status TEXT DEFAULT 'pending',
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC NOT NULL DEFAULT 0,
    discount_id TEXT,
    discount_amount NUMERIC DEFAULT 0,
    discount_code TEXT,
    total NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    scheduled_time TEXT,
    is_refunded BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.employees (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'vendedor',
    pin TEXT NOT NULL DEFAULT '0000',
    email TEXT,
    user_id UUID
);

CREATE TABLE IF NOT EXISTS public.config (
    id INT PRIMARY KEY DEFAULT 1,
    business_name TEXT DEFAULT 'Brasa Clandestina',
    currency TEXT DEFAULT 'L.',
    tax_rate NUMERIC DEFAULT 0.15,
    categories JSONB DEFAULT '[]'::jsonb,
    ingredient_groups JSONB DEFAULT '[]'::jsonb,
    custom_units JSONB DEFAULT '[]'::jsonb,
    food_cost_target NUMERIC DEFAULT 35
);

CREATE TABLE IF NOT EXISTS public.order_statuses (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    color TEXT NOT NULL,
    category TEXT NOT NULL,
    "order" INT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.payment_methods (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    options JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS public.discounts (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    type TEXT NOT NULL,
    value NUMERIC NOT NULL,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.expenses (
    id TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    category TEXT NOT NULL,
    date TIMESTAMPTZ DEFAULT NOW()
);

-- 0.1 Asegurar que las columnas críticas existan en tablas preexistentes
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
    
    -- Añadir campos de descuento si faltan
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='discount_id') THEN
        ALTER TABLE orders ADD COLUMN discount_id TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='discount_amount') THEN
        ALTER TABLE orders ADD COLUMN discount_amount NUMERIC DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='discount_code') THEN
        ALTER TABLE orders ADD COLUMN discount_code TEXT;
    END IF;

    -- Añadir campos de financieros si faltan
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='subtotal') THEN
        ALTER TABLE orders ADD COLUMN subtotal NUMERIC DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='total') THEN
        ALTER TABLE orders ADD COLUMN total NUMERIC DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='items') THEN
        ALTER TABLE orders ADD COLUMN items JSONB DEFAULT '[]'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='payment_status') THEN
        ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'pending';
    END IF;

    -- Campos operativos adicionales de orders
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='table_number') THEN
        ALTER TABLE orders ADD COLUMN table_number TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='driver_id') THEN
        ALTER TABLE orders ADD COLUMN driver_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='customer_phone') THEN
        ALTER TABLE orders ADD COLUMN customer_phone TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='customer_address') THEN
        ALTER TABLE orders ADD COLUMN customer_address TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='scheduled_time') THEN
        ALTER TABLE orders ADD COLUMN scheduled_time TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='is_refunded') THEN
        ALTER TABLE orders ADD COLUMN is_refunded BOOLEAN DEFAULT false;
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
  RETURN (
    (auth.jwt() ->> 'email') IN ('jhonsroks@icloud.com', 'jhonsroksg@gmail.com')
    OR EXISTS (
      SELECT 1 FROM employees
      WHERE (user_id = auth.uid() OR email = (auth.jwt() ->> 'email'))
      AND role = 'admin'
    )
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
DROP POLICY IF EXISTS "Authenticated users can create orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can insert orders" ON orders;
DROP POLICY IF EXISTS "Users can read their own orders or admins all" ON orders;
DROP POLICY IF EXISTS "Users can view own orders or admins all" ON orders;
DROP POLICY IF EXISTS "Admins can manage orders" ON orders;
DROP POLICY IF EXISTS "Admins have full access" ON orders;

-- Clientes públicos (invitados)
CREATE POLICY "Public can insert orders" 
ON orders FOR INSERT 
TO anon 
WITH CHECK (true);

-- Usuarios registrados (empleados/clientes logueados)
CREATE POLICY "Authenticated users can insert orders" 
ON orders FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Administradores (Acceso total)
CREATE POLICY "Admins have full access" 
ON orders FOR ALL 
TO authenticated 
USING (is_admin()) 
WITH CHECK (is_admin());

-- Lectura (Propios pedidos o admin)
CREATE POLICY "Users can view own orders or admins all" 
ON orders FOR SELECT 
TO authenticated 
USING (
    is_admin() OR 
    user_id = auth.uid() OR 
    (seller_id IS NOT NULL AND seller_id IN (SELECT id FROM employees WHERE user_id = auth.uid()))
);

-- 6.1 AUTOMATIZACIÓN DE INVENTARIO (TRIGGER)
-- Asegurar columnas de tracking directo y receta en productos
ALTER TABLE products ADD COLUMN IF NOT EXISTS recipe JSONB DEFAULT '[]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS inventory_tracking TEXT DEFAULT 'recipe';
ALTER TABLE products ADD COLUMN IF NOT EXISTS direct_ingredient_id TEXT;

-- Constraint de integridad para evitar stock negativo a nivel de motor relacional
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_stock_non_negative'
    ) THEN
        ALTER TABLE ingredients ADD CONSTRAINT check_stock_non_negative CHECK (stock >= 0);
    END IF;
END $$;

-- Esta función descuenta automáticamente el stock cuando se inserta un pedido
-- Incluye bloqueo de fila atómico (FOR UPDATE) y validación estricta anti-sobreventa
CREATE OR REPLACE FUNCTION handle_order_inventory_deduction()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $body$
DECLARE
    item_record RECORD;
    prod_rec RECORD;
    recipe_item JSONB;
    deduction_qty NUMERIC;
    current_stock NUMERIC;
    ing_name TEXT;
    target_ing_id TEXT;
BEGIN
    -- Recorrer los items del pedido (formato esperado: product_id, quantity)
    FOR item_record IN SELECT * FROM jsonb_to_recordset(NEW.items) AS x(product_id TEXT, quantity NUMERIC)
    LOOP
        -- Obtener receta y tracking directo del producto
        SELECT recipe, direct_ingredient_id, inventory_tracking INTO prod_rec FROM products WHERE id = item_record.product_id;
        
        -- Caso A: Insumo directo (bebidas, botellas, latas)
        IF prod_rec.direct_ingredient_id IS NOT NULL THEN
            target_ing_id := prod_rec.direct_ingredient_id;
            deduction_qty := item_record.quantity;
            
            -- Bloqueo atómico de fila para prevenir carreras concurrentes
            SELECT name, stock INTO ing_name, current_stock 
            FROM ingredients WHERE id = target_ing_id FOR UPDATE;
            
            -- Rechazo estricto si el stock es insuficiente (evita stock negativo y sobreventa)
            IF current_stock IS NULL OR current_stock < deduction_qty THEN
                RAISE EXCEPTION 'STOCK_INSUFICIENTE: No hay suficiente stock de "%" (Disponible: %, Requerido: %)',
                    COALESCE(ing_name, target_ing_id), COALESCE(current_stock, 0), deduction_qty;
            END IF;
            
            UPDATE ingredients 
            SET stock = stock - deduction_qty
            WHERE id = target_ing_id;
            
            INSERT INTO inventory_logs (id, ingredient_id, ingredient_name, type, quantity, reason, "user", date)
            VALUES (
                'log_auto_' || encode(gen_random_bytes(4), 'hex') || '_' || to_char(NOW(), 'SSMI'),
                target_ing_id,
                ing_name,
                'out',
                deduction_qty,
                'Venta TKT-' || UPPER(RIGHT(NEW.id, 4)),
                'Sistema (Auto)',
                NOW()
            );
        -- Caso B: Receta compuesta
        ELSIF prod_rec.recipe IS NOT NULL AND jsonb_array_length(prod_rec.recipe) > 0 THEN
            -- Recorrer cada ingrediente de la receta
            FOR recipe_item IN SELECT * FROM jsonb_array_elements(prod_rec.recipe)
            LOOP
                target_ing_id := recipe_item->>'ingredient_id';
                deduction_qty := (recipe_item->>'quantity')::NUMERIC * item_record.quantity;
                
                -- Bloqueo atómico de fila para prevenir carreras concurrentes
                SELECT name, stock INTO ing_name, current_stock 
                FROM ingredients WHERE id = target_ing_id FOR UPDATE;
                
                -- Rechazo estricto si el stock es insuficiente (evita stock negativo y sobreventa)
                IF current_stock IS NULL OR current_stock < deduction_qty THEN
                    RAISE EXCEPTION 'STOCK_INSUFICIENTE: No hay suficiente stock de "%" (Disponible: %, Requerido: %)',
                        COALESCE(ing_name, target_ing_id), COALESCE(current_stock, 0), deduction_qty;
                END IF;
                
                -- 1. Descontar de la tabla ingredients
                UPDATE ingredients 
                SET stock = stock - deduction_qty
                WHERE id = target_ing_id;
                
                -- 2. Registrar en inventory_logs
                INSERT INTO inventory_logs (id, ingredient_id, ingredient_name, type, quantity, reason, "user", date)
                VALUES (
                    'log_auto_' || encode(gen_random_bytes(4), 'hex') || '_' || to_char(NOW(), 'SSMI'),
                    target_ing_id,
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

-- 6.2 REVERSIÓN DE INVENTARIO POR CANCELACIÓN / REACTIVACIÓN
CREATE OR REPLACE FUNCTION handle_order_inventory_reversal()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $body$
DECLARE
    item_record RECORD;
    prod_rec RECORD;
    recipe_item JSONB;
    adjust_qty NUMERIC;
    ing_name TEXT;
    is_cancelling BOOLEAN;
    is_restoring BOOLEAN;
BEGIN
    is_cancelling := (OLD.status != 'cancelled' AND NEW.status = 'cancelled');
    is_restoring := (OLD.status = 'cancelled' AND NEW.status != 'cancelled');

    IF NOT (is_cancelling OR is_restoring) THEN
        RETURN NEW;
    END IF;

    FOR item_record IN SELECT * FROM jsonb_to_recordset(NEW.items) AS x(product_id TEXT, quantity NUMERIC)
    LOOP
        SELECT recipe, direct_ingredient_id INTO prod_rec FROM products WHERE id = item_record.product_id;
        
        -- Insumo directo
        IF prod_rec.direct_ingredient_id IS NOT NULL THEN
            adjust_qty := item_record.quantity;
            SELECT name INTO ing_name FROM ingredients WHERE id = prod_rec.direct_ingredient_id;
            
            IF is_cancelling THEN
                UPDATE ingredients SET stock = stock + adjust_qty WHERE id = prod_rec.direct_ingredient_id;
                INSERT INTO inventory_logs (id, ingredient_id, ingredient_name, type, quantity, reason, "user", date)
                VALUES ('log_rev_' || encode(gen_random_bytes(4), 'hex'), prod_rec.direct_ingredient_id, ing_name, 'in', adjust_qty, 'Cancelación TKT-' || UPPER(RIGHT(NEW.id, 4)), 'Sistema (Auto)', NOW());
            ELSIF is_restoring THEN
                UPDATE ingredients SET stock = stock - adjust_qty WHERE id = prod_rec.direct_ingredient_id;
                INSERT INTO inventory_logs (id, ingredient_id, ingredient_name, type, quantity, reason, "user", date)
                VALUES ('log_rev_' || encode(gen_random_bytes(4), 'hex'), prod_rec.direct_ingredient_id, ing_name, 'out', adjust_qty, 'Reversión Cancelación TKT-' || UPPER(RIGHT(NEW.id, 4)), 'Sistema (Auto)', NOW());
            END IF;
        -- Receta compuesta
        ELSIF prod_rec.recipe IS NOT NULL AND jsonb_array_length(prod_rec.recipe) > 0 THEN
            FOR recipe_item IN SELECT * FROM jsonb_array_elements(prod_rec.recipe)
            LOOP
                adjust_qty := (recipe_item->>'quantity')::NUMERIC * item_record.quantity;
                SELECT name INTO ing_name FROM ingredients WHERE id = recipe_item->>'ingredient_id';
                
                IF is_cancelling THEN
                    UPDATE ingredients SET stock = stock + adjust_qty WHERE id = recipe_item->>'ingredient_id';
                    INSERT INTO inventory_logs (id, ingredient_id, ingredient_name, type, quantity, reason, "user", date)
                    VALUES ('log_rev_' || encode(gen_random_bytes(4), 'hex'), recipe_item->>'ingredient_id', ing_name, 'in', adjust_qty, 'Cancelación TKT-' || UPPER(RIGHT(NEW.id, 4)), 'Sistema (Auto)', NOW());
                ELSIF is_restoring THEN
                    UPDATE ingredients SET stock = stock - adjust_qty WHERE id = recipe_item->>'ingredient_id';
                    INSERT INTO inventory_logs (id, ingredient_id, ingredient_name, type, quantity, reason, "user", date)
                    VALUES ('log_rev_' || encode(gen_random_bytes(4), 'hex'), recipe_item->>'ingredient_id', ing_name, 'out', adjust_qty, 'Reversión Cancelación TKT-' || UPPER(RIGHT(NEW.id, 4)), 'Sistema (Auto)', NOW());
                END IF;
            END LOOP;
        END IF;
    END LOOP;

    RETURN NEW;
END;
$body$;

DROP TRIGGER IF EXISTS trg_revert_inventory_on_order_cancel ON orders;
CREATE TRIGGER trg_revert_inventory_on_order_cancel
AFTER UPDATE OF status ON orders
FOR EACH ROW EXECUTE FUNCTION handle_order_inventory_reversal();

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
