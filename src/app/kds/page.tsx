"use client";
import { useState, useEffect } from "react";
import { Order } from "@/lib/mockDB";
import { useAppState } from "@/lib/useStore";
import AuthGuard from "@/components/Auth/AuthGuard";

export default function KitchenDisplaySystem() {
  const { state, updateOrderStatus, signOut } = useAppState();
  
  // Wait for hydration
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const handleStatusChange = (id: string, newStatus: string) => {
    updateOrderStatus(id, newStatus);
  };

  if (!hydrated) return null;

  // Filter orders dynamically based on whether their status is assigned to 'initial' or 'kitchen' category
  const activeOrders = state.orders.filter(order => {
    const statusObj = (state.orderStatuses || []).find(s => s.id === order.status);
    return statusObj && (statusObj.category === "initial" || statusObj.category === "kitchen");
  });

  return (
    <AuthGuard allowedRoles={["admin", "cocinero"]}>
      <div style={{ padding: "clamp(1rem, 3vw, 1.5rem)", minHeight: "100vh", backgroundColor: "var(--bg-primary)" }}>
      <header style={{ display: "flex", justifyContent: "space-between", marginBottom: "2rem", alignItems: "flex-start", flexWrap: "wrap", gap: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "clamp(1.5rem, 5vw, 2.25rem)", fontWeight: 800, color: "var(--accent-color)" }}>Gestión de Cocina</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>{activeOrders.length} ordenes activas en preparación</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          {[...(state.orderStatuses || [])].filter(s => s.category === "initial" || s.category === "kitchen").sort((a,b) => a.order - b.order).map(statusObj => {
            const count = state.orders.filter(o => o.status === statusObj.id).length;
            if (count === 0) return null;
            return (
              <span key={statusObj.id} style={{ 
                padding: "0.4rem 0.8rem", 
                backgroundColor: statusObj.color.startsWith('var(') ? statusObj.color : `${statusObj.color}20`, 
                color: statusObj.color.startsWith('var(') ? 'white' : statusObj.color, 
                border: statusObj.color.startsWith('var(') ? 'none' : `1px solid ${statusObj.color}`,
                borderRadius: "100px", fontWeight: 700, fontSize: "0.75rem"
              }}>
                {statusObj.label}: {count}
              </span>
            );
          })}
          <button 
            onClick={() => { if(confirm("¿Cerrar sesión?")) signOut(); }}
            style={{ 
              padding: "0.5rem 1.25rem", borderRadius: "100px", 
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              color: "var(--danger)",
              border: "1px solid rgba(239, 68, 68, 0.2)", fontWeight: 800, cursor: "pointer", fontSize: "0.85rem"
            }}
          >Salir</button>
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
        {activeOrders.map((order, idx) => {
          const statusObj = (state.orderStatuses || []).find(s => s.id === order.status);
          const color = statusObj?.color || "var(--border-color)";

          return (
            <div key={`${order.id}-${idx}`} className="glass-panel" style={{ display: "flex", flexDirection: "column", height: "100%", borderLeft: `4px solid ${color}` }}>
              <div style={{ padding: "1rem", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", backgroundColor: "var(--bg-secondary)" }}>
                <div style={{ fontWeight: 800, fontSize: "1.25rem" }}>#{order.id.toUpperCase()} <span style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginLeft: "0.5rem" }}>({order.type === "mesa" ? order.table_number : "Delivery"})</span></div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                   {order.scheduled_time ? (
                     <span style={{ backgroundColor: "#8b5cf6", color: "white", padding: "0.2rem 0.6rem", borderRadius: "8px", fontWeight: 800, animation: "pulseBox 2s infinite" }}>
                       🕒 {order.scheduled_time}
                     </span>
                   ) : (
                     hydrated ? new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ""
                   )}
                </div>
              </div>

              <div style={{ padding: "1rem", flex: 1 }}>
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {order.items.map((item, idx) => {
                    const product = state.products.find(p => p.id === item.product_id);
                    return (
                      <li key={idx} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem", fontSize: "1.125rem" }}>
                        <span style={{ fontWeight: 800, color: "var(--accent-color)", marginRight: "1rem" }}>{item.quantity}x</span>
                        <span style={{ flex: 1 }}>{product ? product.name : `Producto ${item.product_id}`}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div style={{ padding: "1rem", borderTop: "1px solid var(--border-color)", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                <select 
                  value={order.status} 
                  onChange={e => handleStatusChange(order.id, e.target.value)}
                  style={{ flex: 1, padding: "0.5rem", borderRadius: "var(--radius-md)", fontWeight: 700, backgroundColor: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }}
                >
                  <optgroup label="Fase Actual (Cocina / Inicio)">
                    {[...(state.orderStatuses || [])].filter(s => s.category === "initial" || s.category === "kitchen").sort((a,b) => a.order - b.order).map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Mover a Siguiente Fase">
                    {[...(state.orderStatuses || [])].filter(s => s.category === "transit").sort((a,b) => a.order - b.order).map(s => (
                      <option key={s.id} value={s.id}>Mover a: {s.label}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>
          );
        })}
      </div>
    </div>
    </AuthGuard>
  );
}
