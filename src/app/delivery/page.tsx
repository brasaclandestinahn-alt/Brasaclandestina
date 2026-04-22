"use client";
import { useState, useEffect } from "react";
import { useAppState } from "@/lib/useStore";
import AuthGuard from "@/components/Auth/AuthGuard";

export default function DeliveryDashboard() {
  const { state, updateOrderStatus, hydrated, signOut } = useAppState();
  const [activeDriver, setActiveDriver] = useState<string>("");

  useEffect(() => {
    if (state.currentEmployee?.role === "repartidor") {
      setActiveDriver(state.currentEmployee.id);
    }
  }, [state.currentEmployee]);

  if (!hydrated) return null;

  // Filter orders dynamically based on transit category
  const deliveryOrders = state.orders.filter(o => {
    if (o.type !== "delivery") return false;
    const statusObj = (state.orderStatuses || []).find(s => s.id === o.status);
    return statusObj && statusObj.category === "transit";
  });

  return (
    <AuthGuard allowedRoles={["admin", "repartidor"]}>
    <div style={{ padding: "clamp(1rem, 3vw, 1.5rem)", minHeight: "100vh", backgroundColor: "var(--bg-primary)" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "clamp(1.5rem, 5vw, 2.25rem)", fontWeight: 700, color: "var(--accent-color)" }}>App Repartidor</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Control Logístico y Entregas a Domicilio</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          <select 
            className="input-field" 
            value={activeDriver} 
            onChange={e => setActiveDriver(e.target.value)}
            style={{ padding: "0.6rem", fontWeight: 600, fontSize: "0.85rem", minWidth: "180px" }}
          >
            <option value="">Selecciona Perfil...</option>
              {state.employees.filter(e => e.role === "repartidor").map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
            <button 
                onClick={() => { if(confirm("¿Cerrar sesión?")) signOut(); }}
                style={{ 
                  padding: "0.6rem 1.25rem", borderRadius: "100px", 
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  color: "var(--danger)",
                  border: "1px solid rgba(239, 68, 68, 0.2)", fontWeight: 800, cursor: "pointer", fontSize: "0.85rem"
                }}
              >Salir</button>
          </div>
      </header>

      {!activeDriver ? (
        <div className="glass-panel" style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
          <h2 style={{ fontSize: "1.125rem", color: "var(--warning)", fontWeight: 700 }}>⚠️ Selecciona tu perfil de repartidor arriba para comenzar tu turno.</h2>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
          {deliveryOrders.length === 0 ? (
            <p style={{ color: "var(--text-muted)" }}>No hay envíos pendientes. Buen trabajo.</p>
          ) : (
            deliveryOrders.map((order, idx) => {
              const statusObj = (state.orderStatuses || []).find(s => s.id === order.status);
              const color = statusObj?.color || "var(--accent-color)";

              return (
                <div key={`${order.id}-${idx}`} className="glass-panel" style={{ display: "flex", flexDirection: "column", height: "100%", borderLeft: `4px solid ${color}` }}>
                  <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between" }}>
                    <h3 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Orden #{order.id}</h3>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
                      <span style={{ 
                        padding: "0.25rem 0.75rem", borderRadius: "1rem", fontSize: "0.75rem", fontWeight: 700,
                        backgroundColor: `${color}20`,
                        color: color
                      }}>
                        {statusObj?.label || "En Tránsito"}
                      </span>
                      {order.scheduled_time && (
                        <span style={{ backgroundColor: "#8b5cf6", color: "white", padding: "0.1rem 0.5rem", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 800 }}>
                          🕒 {order.scheduled_time}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ padding: "1.5rem", flex: 1 }}>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "1rem", fontWeight: 600 }}>
                      Items a entregar:
                    </p>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, color: "var(--text-primary)" }}>
                      {order.items.map((item, idx) => {
                        const product = state.products.find(p => p.id === item.product_id);
                        return (
                          <li key={idx} style={{ marginBottom: "0.5rem" }}>
                            <span style={{ fontWeight: 600 }}>{item.quantity}x</span> {product?.name}
                          </li>
                        );
                      })}
                    </ul>
                    <p style={{ marginTop: "1rem", fontWeight: 700, color: "var(--accent-color)", fontSize: "1.25rem" }}>Cobrar: L {order.total.toFixed(2)}</p>
                  </div>
                  
                  <div style={{ padding: "1.5rem", borderTop: "1px solid var(--border-color)", display: "flex", gap: "1rem" }}>
                    <select 
                      value={order.status} 
                      onChange={e => {
                        // En un ambiente real, consideraríamos inyectar el driver_id a la orden
                        updateOrderStatus(order.id, e.target.value);
                      }}
                      style={{ flex: 1, padding: "0.75rem", borderRadius: "var(--radius-md)", fontWeight: 700, backgroundColor: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }}
                    >
                      <optgroup label="Fase Transit">
                        {[...(state.orderStatuses || [])].filter(s => s.category === "transit").sort((a,b) => a.order - b.order).map(s => (
                          <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Marcar Entregado (Cerrar Ticket)">
                        {[...(state.orderStatuses || [])].filter(s => s.category === "done").sort((a,b) => a.order - b.order).map(s => (
                          <option key={s.id} value={s.id}>Mover a: {s.label}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
    </AuthGuard>
  );
}
