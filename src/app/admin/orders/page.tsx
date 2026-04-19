"use client";
import Link from "next/link";
import { useState } from "react";
import { useAppState } from "@/lib/useStore";

export default function OrdersDashboard() {
  const { state, hydrated, updateOrderStatus } = useAppState();
  const [filterStatus, setFilterStatus] = useState("all");

  if (!hydrated) return null;

  const filteredOrders = filterStatus === "all" 
    ? state.orders 
    : state.orders.filter(o => o.status === filterStatus);

  const stats = {
    todos: state.orders.length,
    pendiente: state.orders.filter(o => o.status === "pending").length,
    en_camino: state.orders.filter(o => o.status === "cooking").length,
    entregado: state.orders.filter(o => o.status === "ready").length
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f3f4f6" }}>
      {/* Sidebar - Imagen 2 Style */}
      <aside style={{ width: "260px", backgroundColor: "white", padding: "1.5rem", display: "flex", flexDirection: "column", borderRight: "1px solid #e5e7eb" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "3rem" }}>
            <div style={{ color: "#f97316", fontSize: "2rem" }}>🍴</div>
            <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 900, color: "#f97316", lineHeight: 1 }}>Brasa</h2>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 900, color: "#1f2937", lineHeight: 1 }}>Clandestina</h2>
            </div>
        </div>
        
        <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {[
            { label: "Menu BC", icon: "📖", href: "/admin" },
            { label: "Control de pedidos", icon: "📋", href: "/admin/orders", active: true },
            { label: "Gestión de Precios", icon: "💰", href: "/admin/pricing" },
            { label: "Inventario", icon: "🍴", href: "/admin/inventory" },
            { label: "Ventas", icon: "📈", href: "/admin/finances" },
            { label: "Envíos", icon: "🛵", href: "/admin/orders" },
            { label: "Configuración", icon: "⚙️", href: "/admin/settings" }
          ].map((item, idx) => (
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

      {/* Main Content Area */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Top Header - Imagen 2 Style */}
        <header style={{ height: "70px", backgroundColor: "white", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#1f2937", fontWeight: 700 }}>
                <span>📍</span> ENVÍOS
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <span>🌙</span>
                <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#111827" }}>jhonsroksg</div>
                    <div style={{ fontSize: "0.65rem", fontWeight: 800, backgroundColor: "#fff7ed", color: "#f97316", padding: "2px 6px", borderRadius: "4px", display: "inline-block" }}>ADMIN</div>
                </div>
                <div style={{ width: "40px", height: "40px", backgroundColor: "#f3f4f6", borderRadius: "8px" }}></div>
            </div>
        </header>

        <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                 <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#111827" }}>Envíos</h1>
                 <button style={{ backgroundColor: "#f97316", color: "white", padding: "0.75rem 1.5rem", borderRadius: "12px", fontWeight: 700, border: "none", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span>👤</span> Gestionar Repartidores
                 </button>
            </div>

            {/* Status Tabs - Imagen 2 Style */}
            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "2.5rem" }}>
                {[
                    { label: "Todos", id: "all" },
                    { label: "Pendiente", id: "pending" },
                    { label: "En Camino", id: "cooking" },
                    { label: "Entregado", id: "ready" }
                ].map((tab) => (
                    <button 
                        key={tab.id}
                        onClick={() => setFilterStatus(tab.id)}
                        style={{ 
                            padding: "0.6rem 1.5rem", borderRadius: "100px", fontWeight: 700, border: "none", transition: "0.2s",
                            backgroundColor: filterStatus === tab.id ? "#f97316" : "#e5e7eb",
                            color: filterStatus === tab.id ? "white" : "#4b5563"
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Orders Feed - Imagen 2 Style */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {filteredOrders.map((order) => (
                    <div key={order.id} style={{ backgroundColor: "white", borderRadius: "20px", padding: "1.5rem", border: "1px solid #e5e7eb", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                            <div>
                                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#111827" }}>Pedido #{order.id.slice(0,4)}</h3>
                                <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>{new Date(order.created_at).toLocaleString()}</p>
                            </div>
                            <select 
                                value={order.status} 
                                onChange={(e) => updateOrderStatus(order.id, e.target.value as any)}
                                style={{ backgroundColor: "#f3f4f6", border: "none", padding: "0.5rem 1rem", borderRadius: "10px", fontWeight: 700, color: "#374151" }}
                            >
                                <option value="pending">Pendiente</option>
                                <option value="cooking">En Camino</option>
                                <option value="ready">Entregado</option>
                            </select>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", padding: "1.5rem", backgroundColor: "#f9fafb", borderRadius: "15px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <span style={{ fontSize: "1.25rem" }}>👤</span>
                                <div>
                                    <div style={{ fontWeight: 700, color: "#111827" }}>{order.customer_name || "Cliente Regular"}</div>
                                    <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>📞 {order.customer_phone || "N/A"}</div>
                                </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, backgroundColor: "white", padding: "0.5rem 1rem", borderRadius: "10px", border: "1px solid #e5e7eb" }}>
                                    <span>📦</span>
                                    <div>
                                        <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>Repartidor</div>
                                        <div style={{ fontWeight: 700 }}>Carlos Lopez</div>
                                    </div>
                                </div>
                                <span>💬</span>
                            </div>
                        </div>

                        <div style={{ marginTop: "1.5rem" }}>
                            <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "#374151", marginBottom: "0.5rem" }}>Items:</div>
                            <ul style={{ listStyle: "none", padding: 0 }}>
                                {order.items.map((item, idx) => (
                                    <li key={idx} style={{ fontSize: "0.875rem", color: "#4b5563", padding: "0.25rem 0" }}>
                                        • {item.quantity}x {state.products.find(p => p.id === item.product_id)?.name}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </main>
    </div>
  );
}
