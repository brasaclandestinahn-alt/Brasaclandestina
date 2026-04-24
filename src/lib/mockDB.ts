export type Role = "admin" | "vendedor" | "repartidor" | "cocinero";

export interface Employee {
  id: string;
  name: string;
  role: Role;
  pin: string;
  email?: string;
  user_id?: string; // UUID from Supabase Auth
}
export interface Ingredient {
  id: string;
  name: string;
  stock: number;
  unit: "g" | "ml" | "u";
  cost_per_unit: number;
  group?: string;
}

export interface RecipeItem {
  ingredient_id: string;
  quantity: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image_url: string;
  is_active: boolean;
  recipe: RecipeItem[];
}

export interface OrderItem {
  product_id: string;
  product_name: string; // Captura el nombre en el momento de la venta para inmutabilidad
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  user_id?: string;
  seller_id?: string; // Vendedor o Mesero
  driver_id?: string; // Repartidor (Delivery)
  table_number?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  type: "mesa" | "delivery" | "pickup";
  status: string; // Dynamically generated IDs now
  payment_method?: string;
  payment_details?: string; // Ej: Nombre del banco para transferencias
  items: OrderItem[];
  total: number;
  created_at: string;
  scheduled_time?: string; // Hora programada (ej: 12:30 PM)
  is_refunded?: boolean;
}

export const MOCK_EMPLOYEES: Employee[] = [
  { id: "e1", name: "Ana Martínez", role: "vendedor", pin: "1111" },
  { id: "e2", name: "Carlos López", role: "vendedor", pin: "2222" },
  { id: "e3", name: "Luis Repartidor", role: "repartidor", pin: "3333" },
  { id: "e4", name: "Jefe Admin", role: "admin", pin: "0000" },
];

export const MOCK_INGREDIENTS: Ingredient[] = [
  { id: "i1", name: "Pan de Hamburguesa", stock: 100, unit: "u", cost_per_unit: 5.00 },
  { id: "i2", name: "Carne de Res (Molida)", stock: 15000, unit: "g", cost_per_unit: 0.15 },
  { id: "i3", name: "Queso Cheddar", stock: 200, unit: "u", cost_per_unit: 3.00 },
  { id: "i4", name: "Alitas de Pollo", stock: 300, unit: "u", cost_per_unit: 8.00 },
  { id: "i5", name: "Papas", stock: 50000, unit: "g", cost_per_unit: 0.05 },
  { id: "i6", name: "Salsa BBQ", stock: 5000, unit: "ml", cost_per_unit: 0.10 },
];

// NEW: Dynamic Order Status Database
export type OrderStatusCategory = "initial" | "kitchen" | "transit" | "done" | "cancelled";

export interface OrderStatusConfig {
  id: string; // Internal id e.g. "cooking" or "custom_1"
  label: string; // Visible label e.g. "En Preparación"
  color: string; // e.g. "var(--accent-color)" or valid hex
  category: OrderStatusCategory; // Used to route to the correct Screen Module (KDS vs Delivery vs Finished)
  order: number; // For sorting
}

export const MOCK_ORDER_STATUSES: OrderStatusConfig[] = [
  { id: "pending", label: "Pendiente de Aprob/Pago", color: "var(--warning)", category: "initial", order: 1 },
  { id: "cooking", label: "En Preparación / Cocina", color: "var(--accent-color)", category: "kitchen", order: 2 },
  { id: "ready", label: "Listo / Por Entregar", color: "var(--success)", category: "transit", order: 3 },
  { id: "out_for_delivery", label: "En Camino", color: "#3b82f6", category: "transit", order: 4 },
  { id: "delivered", label: "Entregado/Completado", color: "var(--text-muted)", category: "done", order: 5 },
  { id: "cancelled", label: "Cancelado / Anulado", color: "#ef4444", category: "cancelled", order: 6 },
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Hamburguesa Clásica",
    description: "Carne de res 200g, queso cheddar, tomate y lechuga",
    category: "Hamburguesas",
    price: 150.00,
    image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800",
    is_active: true,
    recipe: [
      { ingredient_id: "i1", quantity: 1 },    // 1 Pan
      { ingredient_id: "i2", quantity: 200 },  // 200g Carne
      { ingredient_id: "i3", quantity: 2 }     // 2 Quesos
    ]
  },
  {
    id: "p2",
    name: "Alitas BBQ (6 piezas)",
    description: "6 piezas bañadas en salsa BBQ de la casa",
    category: "Entradas",
    price: 120.00,
    image_url: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&q=80&w=800",
    is_active: true,
    recipe: [
      { ingredient_id: "i4", quantity: 6 },    // 6 Alitas
      { ingredient_id: "i6", quantity: 150 }   // 150ml BBQ
    ]
  },
  {
    id: "p3",
    name: "Papas Fritas Grandes",
    description: "Papas crujientes con especias",
    category: "Acompañantes",
    price: 60.00,
    image_url: "https://images.unsplash.com/photo-1573015084185-7205ba359395?auto=format&fit=crop&q=80&w=800",
    is_active: true,
    recipe: [
      { ingredient_id: "i5", quantity: 350 }   // 350g Papas
    ]
  }
];

export const MOCK_CATEGORIES: string[] = ["Hamburguesas", "Entradas", "Acompañantes", "Bebidas"];
export const MOCK_INGREDIENT_GROUPS: string[] = ["Carne", "Empaque", "Costo Empaque", "Costo Operativo", "Acompañantes"];

export const MOCK_ORDERS: Order[] = [];

export interface InventoryLog {
  id: string;
  ingredient_id: string;
  ingredient_name?: string;
  type: "in" | "out";
  quantity: number;
  reason: string;
  user: string;
  date: string;
}


export interface PaymentMethod {
  id: string;
  label: string;
  is_active: boolean;
  icon?: string;
  options?: { label: string, is_active: boolean }[]; // Para bancos o billeteras dinámicas
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  status: "paid" | "pending";
  category: string;
  provider?: string;
}

export const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
  { id: "efectivo", label: "Efectivo", is_active: true, icon: "💵" },
  { id: "tarjeta", label: "Tarjeta de Crédito/Débito", is_active: true, icon: "💳" },
  { id: "transferencia", label: "Transferencia Bancaria", is_active: true, icon: "📲", options: [
      { label: "Bac", is_active: true },
      { label: "Banpais", is_active: true },
      { label: "Davivienda", is_active: true },
      { label: "Atlantida", is_active: true }
  ] },
];

export interface AppConfig {
  id?: number;
  is_schedule_enabled: boolean;
  categories: string[];
  ingredient_groups: string[];
  whatsapp_number: string;
  whatsapp_message: string;
  rappi_link: string;
  ubereats_link: string;
  pedidosya_link: string;
  instagram_link: string;
}

export const MOCK_CONFIG: AppConfig = {
  is_schedule_enabled: true,
  categories: MOCK_CATEGORIES,
  ingredient_groups: MOCK_INGREDIENT_GROUPS,
  whatsapp_number: "+504 9999-9999",
  whatsapp_message: "Hola, quiero hacer un pedido de Brasa Clandestina",
  rappi_link: "https://www.rappi.com.hn/",
  ubereats_link: "https://www.ubereats.com/",
  pedidosya_link: "https://www.pedidosya.com.hn/",
  instagram_link: "https://www.instagram.com/brasaclandestina"
};

export const MOCK_INVENTORY_LOGS: InventoryLog[] = [];

// Los gastos de ejemplo han sido removidos. Los datos reales se cargan desde Supabase.
export const MOCK_EXPENSES: Expense[] = [];
