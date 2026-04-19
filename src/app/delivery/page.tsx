"use client";
import { useState, useEffect } from "react";
import { useAppState } from "@/lib/useStore";

export default function DeliveryDashboard() {
  const { state, updateOrderStatus, hydrated } = useAppState();
  const [activeDriver, setActiveDriver] = useState<string>("");

  if (!hydrated) return null;

  // Filter orders dynamically based on transit category
  const deliveryOrders = state.orders.filter(o => {
    if (o.type !== "delivery") return false;
    const statusObj = (state.orderStatuses || []).find(s => s.id === o.status);
    return statusObj && statusObj.category === "transit";
  });

  return (
    <div style={{ padding: "1.5rem", minHeight: "100vh", backgroundColor: "var(--bg-primary)" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--accent-color)" }}>App Repartidor</h1>
          <p style={{ color: "var(--text-muted)" }}>Control Logístico y Entregas a Domicilio</p>
        </div>
        <div>
          <select 
            className="input-field" 
            value={activeDriver} 
            onChange={e => setActiveDriver(e.target.value)}
            style={{ padding: "0.75rem", fontWeight: 600 }}
          >
            <option value="">Cargando tu Perfil...</option>
            {state.employees.filter(e => e.role === "repartidor").map(e => (
              <option key={e.id} value={e.id}>Repartidor: {e.name}</option>
            ))}
          </select>
        </div>
      </header>

      {!activeDriver ? (
        <div className="glass-panel" style={{ textAlign: "center", padding: "4rem" }}>
          <h2 style={{ fontSize: "1.5rem", color: "var(--warning)" }}>Selecciona tu perfil de repartidor arriba para comenzar tu turno.</h2>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
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
                    <span style={{ 
                      padding: "0.25rem 0.75rem", borderRadius: "1rem", fontSize: "0.75rem", fontWeight: 700,
                      backgroundColor: `${color}20`,
                      color: color
                    }}>
                      {statusObj?.label || "En Tránsito"}
                    </span>
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
  );
}
