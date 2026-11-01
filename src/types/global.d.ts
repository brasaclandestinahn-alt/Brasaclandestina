// ── Entornos del Sistema ──────────────────────────────────────────
declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_GA_ID?: string;
    NEXT_PUBLIC_WA_NUMBER?: string;
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY?: string;
    [key: string]: string | undefined;
  }
}

// ── Modelos de Base de Datos (Supabase Schema) ──────────────────────

export type Role = "admin" | "cocinero" | "vendedor" | "repartidor";

export interface DatabaseEmployee {
  id: string;
  name: string;
  role: Role;
  pin: string;
  user_id?: string | null;
  phone?: string | null;
  created_at?: string;
}

export interface DatabaseProduct {
  id: string;
  name: string;
  price: number;
  cost: number;
  category: string;
  description?: string | null;
  image_url?: string | null;
  recipe: Array<{
    ingredient_id: string;
    quantity: number;
  }>;
  available: boolean;
  is_active?: boolean;
}

export interface DatabaseIngredient {
  id: string;
  name: string;
  unit: string;
  stock: number;
  min_stock: number;
  cost: number;
  group?: string;
  created_at?: string;
}

export type PaymentMethodType = "efectivo" | "tarjeta" | "transferencia" | "paypal" | "otro";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type OrderType = "mesa" | "delivery" | "llevar";

export interface DatabaseOrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  subtotal: number;
  notes?: string;
}

export interface DatabaseOrder {
  id: string;
  customer_name: string;
  customer_phone?: string;
  customer_address?: string;
  type: OrderType;
  status: string;
  payment_method: PaymentMethodType;
  payment_status: PaymentStatus;
  payment_details?: Record<string, unknown>;
  items: DatabaseOrderItem[];
  subtotal: number;
  total: number;
  discount_id?: string | null;
  discount_amount?: number;
  discount_code?: string | null;
  user_id?: string | null;
  seller_id?: string | null;
  table_number?: string | null;
  scheduled_time?: string | null;
  created_at: string;
}

export interface DatabaseExpense {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: "Insumos" | "Operativo" | "Servicios" | "Personal" | "Otros";
  provider?: string | null;
  invoice_num?: string | null;
  status: "paid" | "pending";
  created_at?: string;
}

export interface DatabaseInventoryLog {
  id: string;
  ingredient_id: string;
  ingredient_name: string;
  type: "in" | "out" | "adjust";
  quantity: number;
  reason: string;
  user: string;
  date: string;
}
