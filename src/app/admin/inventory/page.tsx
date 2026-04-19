"use client";
import Link from "next/link";
import { useState } from "react";
import { useAppState } from "@/lib/useStore";

export default function InventoryDashboard() {
  const { state, hydrated, updateIngredientStock, addIngredient, editIngredient } = useAppState();
  
  // Stock Form State
  const [selectedIngredient, setSelectedIngredient] = useState<string>("");
  const [addedQty, setAddedQty] = useState<number>(0);

  // Tab State
  const [activeTab, setActiveTab] = useState<"stock" | "management" | "kardex">("stock");

  if (!hydrated) return null;

  // Calculo de Stats para el Dashboard Express - Adaptado a Light Design
  const totalInventoryValue = state.ingredients.reduce((acc, ing) => acc + (ing.stock * ing.cost_per_unit), 0);
  const lowStockItems = state.ingredients.filter(ing => {
    if (ing.unit === "g" && ing.stock < 1000) return true;
    if (ing.unit === "u" && ing.stock < 20) return true;
    return false;
  }).length;

  const menuItems = [
    { label: "Menu BC", icon: "📖", href: "/admin" },
    { label: "Control de pedidos", icon: "📋", href: "/admin/orders" },
    { label: "Gestión de Precios", icon: "💰", href: "/admin/pricing" },
    { label: "Inventario", icon: "🍴", href: "/admin/inventory", active: true },
    { label: "Ventas", icon: "📈", href: "/admin/finances" },
    { label: "Envíos", icon: "🛵", href: "/admin/orders" },
    { label: "Configuración", icon: "⚙️", href: "/admin/settings" }
  ];

  const getStockStatus = (ing: any) => {
    if (ing.stock <= 0) return { label: "Agotado", color: "#ef4444", bg: "#fef2f2" };
    if ((ing.unit === "g" && ing.stock < 2000) || (ing.unit === "u" && ing.stock < 25)) return { label: "Bajo", color: "#f59e0b", bg: "#fffbeb" };
    return { label: "Saludable", color: "#10b981", bg: "#f0fdf4" };
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f3f4f6" }}>
      {/* Sidebar Unificado - Blanco */}
      <aside style={{ width: "260px", backgroundColor: "white", padding: "1.5rem", display: "flex", flexDirection: "column", borderRight: "1px solid #e5e7eb" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "3rem" }}>
            <div style={{ color: "#f97316", fontSize: "2rem" }}>🍴</div>
            <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 900, color: "#f97316", lineHeight: 1 }}>Brasa</h2>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 900, color: "#1f2937", lineHeight: 1 }}>Clandestina</h2>
            </div>
        </div>
        
        <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {menuItems.map((item, idx) => (
            <Link 
                key={idx} 
                href={item.href} 
                style={{ 
                    display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", borderRadius: "8px",
                    textDecoration: "none", color: item.active ? "#f97316" : "#6b7280", fontWeight: item.active ? 700 : 500,
                    backgroundColor: item.active ? "#fff7ed" : "transparent",
                    borderLeft: item.active ? "4px solid #f97316" : "4px solid transparent"
                }}
            >
                <span>{item.icon}</span> {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Top Header */}
        <header style={{ height: "70px", backgroundColor: "white", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#1f2937", fontWeight: 700 }}>
                <span>🍴</span> INVENTARIO
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <span>🌙</span>
                <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#111827" }}>jhonsroksg</div>
                    <div style={{ fontSize: "0.65rem", fontWeight: 800, backgroundColor: "#fff7ed", color: "#f97316", padding: "2px 6px", borderRadius: "4px", display: "inline-block" }}>ADMIN</div>
                </div>
            </div>
        </header>

        <div style={{ padding: "2.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem" }}>
                 <h1 style={{ fontSize: "2rem", fontWeight: 900, color: "#111827" }}>Gestión de Inventario</h1>
                 <div style={{ display: "flex", gap: "1rem" }}>
                    <button onClick={() => setActiveTab("management")} style={{ backgroundColor: "#f97316", color: "white", padding: "0.75rem 1.5rem", borderRadius: "12px", fontWeight: 700, border: "none" }}>+ Ingreso Logístico</button>
                 </div>
            </div>

            {/* Dashboard Express - Light Version */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2rem", marginBottom: "3rem" }}>
                <div style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "20px", border: "1px solid #e5e7eb" }}>
                    <p style={{ fontSize: "0.75rem", fontWeight: 800, color: "#6b7280", textTransform: "uppercase" }}>Valor Invertido</p>
                    <h3 style={{ fontSize: "1.75rem", fontWeight: 900, color: "#10b981", marginTop: "0.5rem" }}>L {totalInventoryValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
                </div>
                <div style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "20px", border: "1px solid #e5e7eb" }}>
                    <p style={{ fontSize: "0.75rem", fontWeight: 800, color: "#6b7280", textTransform: "uppercase" }}>Existencias Bajas</p>
                    <h3 style={{ fontSize: "1.75rem", fontWeight: 900, color: lowStockItems > 0 ? "#f97316" : "#111827", marginTop: "0.5rem" }}>{lowStockItems} Alertas</h3>
                </div>
                <div style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "20px", border: "1px solid #e5e7eb" }}>
                    <p style={{ fontSize: "0.75rem", fontWeight: 800, color: "#6b7280", textTransform: "uppercase" }}>Total de Insumos</p>
                    <h3 style={{ fontSize: "1.75rem", fontWeight: 900, color: "#111827", marginTop: "0.5rem" }}>{state.ingredients.length} SKU</h3>
                </div>
            </div>

            {/* Insumos List - Replicating Approved White Card Style */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", padding: "0 1.5rem", color: "#6b7280", fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase" }}>
                    <div>Insumo</div>
                    <div>Stock</div>
                    <div>Estado</div>
                    <div style={{ textAlign: "right" }}>Valorización</div>
                </div>
                {state.ingredients.map(ing => {
                    const status = getStockStatus(ing);
                    return (
                        <div key={ing.id} style={{ backgroundColor: "white", borderRadius: "15px", padding: "1.25rem 1.5rem", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", alignItems: "center", border: "1px solid #e5e7eb" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                <div style={{ width: "40px", height: "40px", backgroundColor: "#f9fafb", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>📦</div>
                                <div>
                                    <div style={{ fontWeight: 700, color: "#111827" }}>{ing.name}</div>
                                    <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>L {ing.cost_per_unit.toFixed(2)} / {ing.unit}</div>
                                </div>
                            </div>
                            <div style={{ fontWeight: 900, color: "#111827" }}>
                                {ing.stock.toLocaleString()} <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "#6b7280" }}>{ing.unit}</span>
                            </div>
                            <div>
                                <span style={{ backgroundColor: status.bg, color: status.color, padding: "4px 12px", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 800 }}>
                                    {status.label}
                                </span>
                            </div>
                            <div style={{ textAlign: "right", fontWeight: 900, color: "#f97316" }}>
                                L {(ing.stock * ing.cost_per_unit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      </main>
    </div>
  );
}
