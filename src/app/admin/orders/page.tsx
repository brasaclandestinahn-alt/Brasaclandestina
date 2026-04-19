"use client";
import Link from "next/link";
import { useState, useMemo } from "react";
import { useAppState } from "@/lib/useStore";

export default function OrdersDashboard() {
  const { state, hydrated, updateOrderStatus, appendItemToOrder } = useAppState();
  
  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "mesa" | "delivery" | "pickup">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "cooking" | "ready" | "out_for_delivery" | "delivered">("all");
  const [filterDateStart, setFilterDateStart] = useState<string>("");
  const [filterDateEnd, setFilterDateEnd] = useState<string>("");

  // Modal Detail State
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedProductIdToAdd, setSelectedProductIdToAdd] = useState<string>("");
  const [quantityToAdd, setQuantityToAdd] = useState(1);

  if (!hydrated) return null;

  const filteredOrders = state.orders.filter(order => {
    // 1. Text Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchId = order.id.toLowerCase().includes(term);
      const matchName = (order.customer_name || "").toLowerCase().includes(term);
      const matchPhone = (order.customer_phone || "").toLowerCase().includes(term);
      if (!matchId && !matchName && !matchPhone) return false;
    }

    // 2. Type Filter
    if (filterType !== "all") {
      if (order.type !== filterType) return false;
    }

    // 3. Status Filter
    if (filterStatus !== "all") {
      if (order.status !== filterStatus) return false;
    }

    // 4. Date Range Filter
    const orderDateStr = new Date(order.created_at).toISOString().split('T')[0];
    if (filterDateStart && orderDateStr < filterDateStart) {
      return false;
    }
    if (filterDateEnd && orderDateStr > filterDateEnd) {
      return false;
    }

    return true;
  });

  // Sort by date (newest first)
  const sortedOrders = [...filteredOrders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const getStatusBadge = (statusId: string) => {
    const statusObj = (state.orderStatuses || []).find(s => s.id === statusId);
    if (!statusObj) return <span>{statusId}</span>;
    return (
      <span style={{ 
        padding: "0.25rem 0.75rem", 
        borderRadius: "100px", 
        fontSize: "0.75rem", 
        fontWeight: 700, 
        backgroundColor: statusObj.color.startsWith('var(') ? statusObj.color : `${statusObj.color}20`, 
        color: statusObj.color.startsWith('var(') ? 'white' : statusObj.color, 
        border: statusObj.color.startsWith('var(') ? 'none' : `1px solid ${statusObj.color}` 
      }}>
        {statusObj.label}
      </span>
    );
  };

  const getPaymentName = (method?: string) => {
    if (method === "efectivo") return "💵 Efectivo";
    if (method === "tarjeta") return "💳 Tarjeta";
    if (method === "transferencia") return "📲 Transf.";
    return "No esp.";
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg-primary)" }}>
      {/* Sidebar Admin */}
      <aside style={{ width: "250px", backgroundColor: "var(--bg-secondary)", borderRight: "1px solid var(--border-color)", padding: "1.5rem", display: "flex", flexDirection: "column" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "2rem", color: "var(--accent-color)" }}>Admin Panel</h2>
        <nav style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Link href="/admin" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>Dashboard Central</Link>
          <Link href="/admin/orders" style={{ padding: "0.75rem", backgroundColor: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", fontWeight: 600 }}>Historial de Pedidos</Link>
          <Link href="/admin/inventory" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>Inventario (Insumos)</Link>
          <Link href="/admin/pricing" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>Catálogo y Precios</Link>
          <Link href="/admin/finances" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>Finanzas</Link>
          <Link href="/admin/settings" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>Configuración</Link>
          
          <div style={{ marginTop: "1rem", borderTop: "1px solid var(--border-color)", paddingTop: "1rem", color: "var(--text-muted)", fontSize: "0.875rem", fontWeight: 700 }}>Módulos Operativos</div>
          <Link href="/pos" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>Terminal de Ventas (POS)</Link>
          <Link href="/kds" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>Pantalla de Cocina (KDS)</Link>
          <Link href="/delivery" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>App Repartidores</Link>
          
          <Link href="/" target="_blank" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)", marginTop: "auto", border: "1px dashed var(--border-color)" }}>Ver Menú Digital (PWA)</Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: "2rem", overflowY: "auto" }}>
        <header style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h1 style={{ fontSize: "2rem", fontWeight: 700 }}>Historial de Pedidos</h1>
            <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>
              Registro centralizado de todas las operaciones y canal de venta.
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
             <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", fontWeight: 700 }}>TOTAL ORDENES</p>
             <p style={{ fontSize: "1.5rem", fontWeight: 800 }}>{filteredOrders.length}</p>
          </div>
        </header>

        {/* Filters Bar */}
        <div className="glass-panel" style={{ display: "flex", gap: "1rem", padding: "1rem 1.5rem", borderRadius: "var(--radius-lg)", marginBottom: "2rem", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: 2, minWidth: "200px" }}>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.25rem" }}>BUSCAR PEDIDO O CLIENTE</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Buscar por ID, Teléfono o Nombre..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ fontSize: "0.875rem", padding: "0.5rem" }}
            />
          </div>

          <div style={{ flex: 1, minWidth: "150px" }}>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.25rem" }}>CANAL / TIPO</label>
            <select className="input-field" value={filterType} onChange={(e) => setFilterType(e.target.value as any)} style={{ fontSize: "0.875rem", padding: "0.5rem" }}>
              <option value="all">Ver Todos</option>
              <option value="mesa">🍽️ Mesa Local</option>
              <option value="pickup">🛍️ Pick Up (Llevar)</option>
              <option value="delivery">🛵 Delivery</option>
            </select>
          </div>

          <div style={{ flex: 1, minWidth: "150px" }}>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.25rem" }}>ESTADO DE ORDEN</label>
            <select className="input-field" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} style={{ fontSize: "0.875rem", padding: "0.5rem" }}>
              <option value="all">Ver Todos</option>
              {[...(state.orderStatuses || [])].sort((a,b) => a.order - b.order).map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: "150px" }}>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.25rem" }}>FILTRAR ENTRE FECHAS</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input 
                type="date" 
                className="input-field" 
                value={filterDateStart}
                onChange={(e) => setFilterDateStart(e.target.value)}
                style={{ fontSize: "0.875rem", padding: "0.5rem", flex: 1 }}
                title="Fecha Inicio"
              />
              <span style={{ display: "flex", alignItems: "center", color: "var(--text-muted)", fontWeight: 700 }}>a</span>
              <input 
                type="date" 
                className="input-field" 
                value={filterDateEnd}
                onChange={(e) => setFilterDateEnd(e.target.value)}
                style={{ fontSize: "0.875rem", padding: "0.5rem", flex: 1 }}
                title="Fecha Fin"
              />
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="glass-panel" style={{ backgroundColor: "var(--bg-secondary)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                <th style={{ padding: "1rem", fontWeight: 600 }}>TKT #</th>
                <th style={{ padding: "1rem", fontWeight: 600 }}>Fecha y Hora</th>
                <th style={{ padding: "1rem", fontWeight: 600 }}>Cliente / Referencia</th>
                <th style={{ padding: "1rem", fontWeight: 600 }}>Tipo Operación</th>
                <th style={{ padding: "1rem", fontWeight: 600 }}>Estado</th>
                <th style={{ padding: "1rem", fontWeight: 600 }}>Pago</th>
                <th style={{ padding: "1rem", fontWeight: 600, textAlign: "right" }}>Total (L)</th>
              </tr>
            </thead>
            <tbody>
              {sortedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                    No se encontraron órdenes con estos filtros.
                  </td>
                </tr>
              ) : (
                sortedOrders.map((order, idx) => (
                  <tr 
                    key={`${order.id}-${idx}`} 
                    onClick={() => setSelectedOrderId(order.id)}
                    style={{ borderBottom: "1px solid var(--border-color)", transition: "background-color 0.2s", cursor: "pointer" }} 
                    onMouseOver={e => e.currentTarget.style.backgroundColor = "var(--bg-tertiary)"} 
                    onMouseOut={e => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <td style={{ padding: "1rem", fontWeight: 700, fontFamily: "monospace", color: "var(--text-secondary)" }}>
                      #{order.id.slice(0,6).toUpperCase()}
                    </td>
                    <td style={{ padding: "1rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                      {new Date(order.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ fontWeight: 600 }}>{order.customer_name || 'Walk-in / Mesa'}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{order.customer_phone || order.table_number || 'N/A'}</div>
                    </td>
                    <td style={{ padding: "1rem", fontSize: "0.875rem", fontWeight: 600 }}>
                      <span style={{ color: order.type === 'delivery' ? 'var(--warning)' : 'var(--text-primary)' }}>
                        {order.type.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      {getStatusBadge(order.status)}
                    </td>
                    <td style={{ padding: "1rem", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                      {getPaymentName(order.payment_method)}
                    </td>
                    <td style={{ padding: "1rem", fontWeight: 800, textAlign: "right", color: "var(--accent-color)" }}>
                      L {order.total.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Order Details Modal */}
      {selectedOrderId && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="glass-panel" style={{ width: "90%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto", padding: "2rem", display: "flex", flexDirection: "column" }}>
            {(() => {
              const activeOrder = state.orders.find(o => o.id === selectedOrderId);
              if (!activeOrder) return <p>Orden no encontrada.</p>;
              
              return (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                    <div>
                      <h2 style={{ fontSize: "1.5rem", fontWeight: 800 }}>TKT #{activeOrder.id.toUpperCase()}</h2>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>{activeOrder.customer_name || activeOrder.table_number}</p>
                    </div>
                    <button onClick={() => setSelectedOrderId(null)} style={{ fontSize: "1.5rem", color: "var(--text-muted)", cursor: "pointer" }}>&times;</button>
                  </div>

                  {/* Status Editor */}
                  <div style={{ marginBottom: "1.5rem", backgroundColor: "var(--bg-secondary)", padding: "1rem", borderRadius: "var(--radius-md)" }}>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.5rem" }}>ESTADO OPERATIVO (LOGÍSTICA)</label>
                    <select 
                      className="input-field" 
                      value={activeOrder.status}
                      onChange={(e) => updateOrderStatus(activeOrder.id, e.target.value as any)}
                      style={{ fontWeight: 600 }}
                    >
                      {[...(state.orderStatuses || [])].sort((a,b) => a.order - b.order).map(s => (
                         <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Order Items Detail */}
                  <div style={{ marginBottom: "1.5rem" }}>
                    <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.5rem" }}>Composición de la Orden</h3>
                    <ul style={{ listStyle: "none", padding: 0 }}>
                      {activeOrder.items.map((item, idx) => {
                         const product = state.products.find(p => p.id === item.product_id);
                         return (
                           <li key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--border-color)" }}>
                             <div>
                               <span style={{ fontWeight: 800, color: "var(--accent-color)", marginRight: "1rem" }}>x{item.quantity}</span>
                               <span style={{ fontWeight: 600 }}>{product ? product.name : `Producto ${item.product_id}`}</span>
                             </div>
                             <span style={{ color: "var(--text-secondary)" }}>L {item.subtotal.toFixed(2)}</span>
                           </li>
                         )
                      })}
                    </ul>
                    <div style={{ textAlign: "right", marginTop: "1rem", fontSize: "1.25rem", fontWeight: 800 }}>
                      Total: <span style={{ color: "var(--accent-color)" }}>L {activeOrder.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Add Product / Edit Order */}
                  <div style={{ borderTop: "2px dashed var(--border-color)", paddingTop: "1.5rem" }}>
                    <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "1rem", color: "var(--text-primary)" }}>Agregar un Plato a la Orden</h3>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <select 
                        className="input-field" 
                        style={{ flex: 1 }} 
                        value={selectedProductIdToAdd}
                        onChange={e => setSelectedProductIdToAdd(e.target.value)}
                      >
                        <option value="">Seleccione un Platillo...</option>
                        {state.products.map(p => (
                           <option key={p.id} value={p.id}>{p.name} - L {p.price}</option>
                        ))}
                      </select>
                      
                      <input 
                        type="number" 
                        className="input-field" 
                        style={{ width: "80px", textAlign: "center" }} 
                        min={1} 
                        value={quantityToAdd} 
                        onChange={e => setQuantityToAdd(Number(e.target.value))} 
                      />

                      <button 
                        className="btn-primary"
                        onClick={() => {
                          if (!selectedProductIdToAdd || quantityToAdd < 1) return;
                          
                          appendItemToOrder(activeOrder.id, {
                            product_id: selectedProductIdToAdd,
                            quantity: quantityToAdd,
                            subtotal: 0 // Will be recalculated by store logic securely
                          });

                          setSelectedProductIdToAdd("");
                          setQuantityToAdd(1);
                        }}
                      >
                        + Agregar
                      </button>
                    </div>
                    <p style={{ fontSize: "0.75rem", color: "var(--warning)", marginTop: "0.5rem" }}>* Al agregar el sistema rebajará los ingredientes del Inventario (Kardex) de forma automática.</p>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
