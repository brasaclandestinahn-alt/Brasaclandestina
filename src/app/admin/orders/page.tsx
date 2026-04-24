"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAppState } from "@/lib/useStore";
import AuthGuard from "@/components/Auth/AuthGuard";
import { OrderItem } from "@/lib/mockDB";
import { formatCurrency } from "@/lib/utils";
import Sidebar from "@/components/Admin/Sidebar";

// ─── Manual Sale Modal ───────────────────────────────────────────────────────
function ManualSaleModal({ onClose }: { onClose: () => void }) {
  const { state, addOrder } = useAppState();

  const [saleDate, setSaleDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [orderType, setOrderType] = useState<"mesa" | "delivery" | "pickup">("mesa");
  const [tableRef, setTableRef] = useState("Mesa 1");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(state.paymentMethods[0]?.id || "efectivo");
  const [paymentDetails, setPaymentDetails] = useState("");
  const [saleStatus, setSaleStatus] = useState("delivered");

  const [items, setItems] = useState<OrderItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [qty, setQty] = useState(1);

  const total = items.reduce((acc, i) => acc + i.subtotal, 0);

  const handleAddItem = () => {
    if (!selectedProductId || qty < 1) return;
    const product = state.products.find(p => p.id === selectedProductId);
    if (!product) return;
    setItems(prev => {
      const existing = prev.find(i => i.product_id === selectedProductId);
      if (existing) {
        return prev.map(i => i.product_id === selectedProductId
          ? { ...i, quantity: i.quantity + qty, subtotal: (i.quantity + qty) * product.price }
          : i
        );
      }
      return [...prev, { product_id: product.id, product_name: product.name, quantity: qty, subtotal: qty * product.price }];
    });
    setSelectedProductId("");
    setQty(1);
  };

  const handleRemoveItem = (product_id: string) => setItems(prev => prev.filter(i => i.product_id !== product_id));

  const handleSubmit = () => {
    if (items.length === 0) return alert("⚠️ Agrega al menos un producto.");
    if (orderType === "delivery" && !customerAddress) return alert("⚠️ La dirección es obligatoria para Delivery.");
    addOrder({
      id: "man_" + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      type: orderType,
      table_number: orderType === "mesa" ? tableRef : undefined,
      customer_name: customerName || undefined,
      customer_phone: customerPhone || undefined,
      customer_address: orderType === "delivery" ? customerAddress : undefined,
      payment_method: paymentMethod,
      payment_details: paymentDetails || undefined,
      status: saleStatus,
      items,
      total,
      created_at: new Date(saleDate).toISOString(),
    });
    alert("✅ Venta registrada correctamente.");
    onClose();
  };

  const selectedPayMethod = state.paymentMethods.find(p => p.id === paymentMethod);

  return (
    <div style={{
      position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.75)",
      backdropFilter: "blur(6px)", display: "flex", alignItems: "center",
      justifyContent: "center", zIndex: 1200, padding: "1rem"
    }}>
      <div className="glass-panel" style={{
        width: "100%", maxWidth: "700px", maxHeight: "92vh", overflowY: "auto",
        padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem",
        border: "1px solid var(--accent-color)"
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: "clamp(1.2rem, 4vw, 1.5rem)", fontWeight: 800, color: "var(--accent-color)" }}>✍️ Venta Manual</h2>
          </div>
          <button onClick={onClose} style={{ fontSize: "1.5rem", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>✕</button>
        </div>

        {/* Fecha y Estado */}
        <div style={{ backgroundColor: "var(--bg-secondary)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.4rem" }}>Fecha y Hora</label>
              <input
                type="datetime-local"
                className="input-field"
                value={saleDate}
                onChange={e => setSaleDate(e.target.value)}
                style={{ fontWeight: 700, fontSize: "0.85rem" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.4rem" }}>Estado Final</label>
              <select className="input-field" value={saleStatus} onChange={e => setSaleStatus(e.target.value)} style={{ fontSize: "0.85rem" }}>
                {[...(state.orderStatuses || [])].sort((a, b) => a.order - b.order).map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tipo y Cliente */}
        <div style={{ backgroundColor: "var(--bg-secondary)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.4rem" }}>Tipo Operación</label>
              <select className="input-field" value={orderType} onChange={e => setOrderType(e.target.value as any)} style={{ fontSize: "0.85rem" }}>
                <option value="mesa">🍽️ Mesa Local</option>
                <option value="pickup">🛍️ Pick Up</option>
                <option value="delivery">🛵 Delivery</option>
              </select>
            </div>
            {orderType === "mesa" ? (
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.4rem" }}>Referencia</label>
                <input type="text" className="input-field" value={tableRef} onChange={e => setTableRef(e.target.value)} placeholder="Ej. Mesa 3" style={{ fontSize: "0.85rem" }} />
              </div>
            ) : (
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.4rem" }}>Nombre Cliente</label>
                <input type="text" className="input-field" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Nombre" style={{ fontSize: "0.85rem" }} />
              </div>
            )}
          </div>
          {orderType === "delivery" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.4rem" }}>Dirección *</label>
                <input type="text" className="input-field" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="Referencia..." style={{ fontSize: "0.85rem" }} />
              </div>
            </div>
          )}
        </div>

        {/* Productos */}
        <div style={{ backgroundColor: "var(--bg-secondary)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
            <select className="input-field" style={{ flex: 3, minWidth: "150px", fontSize: "0.85rem" }} value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)}>
              <option value="">Producto...</option>
              {state.products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <input type="number" min={1} className="input-field" style={{ width: "60px", textAlign: "center", fontSize: "0.85rem" }} value={qty} onChange={e => setQty(Number(e.target.value))} />
            <button className="btn-primary" onClick={handleAddItem} style={{ padding: "0.5rem 1rem", fontSize: "0.8rem" }}>+</button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "200px", overflowY: "auto" }}>
            {items.map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem", backgroundColor: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", fontSize: "0.85rem" }}>
                <span>x{item.quantity} {item.product_name}</span>
                <button onClick={() => handleRemoveItem(item.product_id)} style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer" }}>🗑️</button>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "right", marginTop: "1rem", fontWeight: 800, color: "var(--accent-color)" }}>
            TOTAL: {formatCurrency(total)}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "auto" }}>
          <button className="btn-primary" onClick={handleSubmit} disabled={items.length === 0} style={{ width: "100%", padding: "0.8rem" }}>
            ✅ Guardar Venta
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OrdersDashboard() {
  const { state, hydrated, updateOrderStatus, appendItemToOrder, removeOrder } = useAppState();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "mesa" | "delivery" | "pickup">("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDateStart, setFilterDateStart] = useState<string>("");
  const [filterDateEnd, setFilterDateEnd] = useState<string>("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedProductIdToAdd, setSelectedProductIdToAdd] = useState<string>("");
  const [quantityToAdd, setQuantityToAdd] = useState(1);
  const [currentTab, setCurrentTab] = useState<"active" | "online" | "cancelled">("active");
  const [showManualSaleModal, setShowManualSaleModal] = useState(false);

  // Polling logic for new orders is handled by Supabase Realtime in useStore.ts
  
  if (!hydrated) return null;

  const onlinePendingCount = state.orders.filter(o => o.is_online && o.status === 'pending').length;

  const filteredOrders = state.orders.filter(order => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!order.id.toLowerCase().includes(term) && !(order.customer_name || "").toLowerCase().includes(term) && !(order.customer_phone || "").toLowerCase().includes(term)) return false;
    }
    
    // Tab logic
    if (currentTab === "online") {
      if (!order.is_online) return false;
    } else if (currentTab === "cancelled") {
      if (order.status !== "cancelled") return false;
    } else {
      // active tab
      if (order.status === "cancelled") return false;
      if (order.is_online && order.status === 'pending') {
          // If online and pending, it stays in "online" tab unless strictly shown here?
          // User said: "NUEVO TAB PEDIDOS ONLINE". Let's keep them separate.
          return false;
      }
    }

    if (filterType !== "all" && order.type !== filterType) return false;
    if (filterStatus !== "all" && order.status !== filterStatus) return false;
    
    const orderDateStr = new Date(order.created_at).toISOString().split('T')[0];
    if (filterDateStart && orderDateStr < filterDateStart) return false;
    if (filterDateEnd && orderDateStr > filterDateEnd) return false;
    
    return true;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const getStatusBadge = (statusId: string) => {
    const s = (state.orderStatuses || []).find(s => s.id === statusId);
    if (!s) return <span>{statusId}</span>;
    return <span style={{ padding: "0.25rem 0.75rem", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 700, backgroundColor: s.color.startsWith('var(') ? s.color : `${s.color}20`, color: s.color.startsWith('var(') ? 'white' : s.color, border: s.color.startsWith('var(') ? 'none' : `1px solid ${s.color}` }}>{s.label}</span>;
  };

  const getPaymentName = (method?: string, details?: string) => {
    const pm = (state.paymentMethods || []).find(p => p.id === method);
    return (pm ? `${pm.icon} ${pm.label}` : (method || "No esp.")) + (details ? ` (${details})` : "");
  };

  return (
    <AuthGuard allowedRoles={["admin"]}>
      {showManualSaleModal && <ManualSaleModal onClose={() => setShowManualSaleModal(false)} />}

      <div className="admin-layout">
        <Sidebar />

        <main className="main-content-responsive">
          <header style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h1 style={{ fontSize: "clamp(1.5rem, 5vw, 2rem)", fontWeight: 700 }}>Ventas</h1>
              <p style={{ color: "var(--text-muted)", marginTop: "0.5rem", fontSize: "0.9rem" }}>Registro centralizado de operaciones.</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
              <button
                className="btn-primary"
                onClick={() => setShowManualSaleModal(true)}
                style={{ padding: "0.6rem 1.25rem", fontWeight: 800, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                ✍️ Nueva Venta
              </button>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700 }}>VISTOS: {filteredOrders.length}</p>
              </div>
            </div>
          </header>

          {/* Tabs */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
            <button 
              onClick={() => setCurrentTab("active")} 
              style={{ flex: 1, position: "relative", padding: "0.6rem", borderRadius: "var(--radius-md)", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", backgroundColor: currentTab === "active" ? "var(--accent-color)" : "var(--bg-secondary)", color: currentTab === "active" ? "white" : "var(--text-muted)", border: "1px solid var(--border-color)" }}
            >
              Activas
            </button>
            <button 
              onClick={() => setCurrentTab("online")} 
              style={{ flex: 1, position: "relative", padding: "0.6rem", borderRadius: "var(--radius-md)", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", backgroundColor: currentTab === "online" ? "#E8593C" : "var(--bg-secondary)", color: currentTab === "online" ? "white" : "var(--text-muted)", border: "1px solid var(--border-color)" }}
            >
              Pedidos Online
              {onlinePendingCount > 0 && (
                <span style={{ position: "absolute", top: "-8px", right: "-8px", backgroundColor: "#ef4444", color: "white", borderRadius: "50%", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", fontSize: "0.6rem", border: "2px solid var(--bg-primary)" }}>
                  {onlinePendingCount}
                </span>
              )}
            </button>
            <button 
              onClick={() => setCurrentTab("cancelled")} 
              style={{ flex: 1, padding: "0.6rem", borderRadius: "var(--radius-md)", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", backgroundColor: currentTab === "cancelled" ? "#ef4444" : "var(--bg-secondary)", color: currentTab === "cancelled" ? "white" : "var(--text-muted)", border: "1px solid var(--border-color)" }}
            >
              Canceladas
            </button>
          </div>

          {/* Filters */}
          <div className="glass-panel" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", padding: "1.25rem", borderRadius: "var(--radius-lg)", marginBottom: "2rem" }}>
            <div style={{ gridColumn: "span 1" }}>
              <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.25rem" }}>BUSCAR</label>
              <input type="text" className="input-field" placeholder="ID, Teléfono..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ fontSize: "0.85rem" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.25rem" }}>TIPO</label>
              <select className="input-field" value={filterType} onChange={e => setFilterType(e.target.value as any)} style={{ fontSize: "0.85rem" }}>
                <option value="all">Todos</option>
                <option value="mesa">🍽️ Mesa</option>
                <option value="pickup">🛍️ Pick Up</option>
                <option value="delivery">🛵 Delivery</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.25rem" }}>ESTADO</label>
              <select className="input-field" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ fontSize: "0.85rem" }}>
                <option value="all">Todos</option>
                {[...(state.orderStatuses || [])].sort((a, b) => a.order - b.order).map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table Container with scroll */}
          <div className="glass-panel scrollable-x" style={{ borderRadius: "var(--radius-lg)" }}>
            <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse", minWidth: "800px" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                  <th style={{ padding: "1rem", fontWeight: 600 }}>TKT #</th>
                  <th style={{ padding: "1rem", fontWeight: 600 }}>Fecha y Hora</th>
                  <th style={{ padding: "1rem", fontWeight: 600 }}>Cliente / Referencia</th>
                  <th style={{ padding: "1rem", fontWeight: 600 }}>Tipo Operación</th>
                  <th style={{ padding: "1rem", fontWeight: 600 }}>Estado</th>
                  <th style={{ padding: "1rem", fontWeight: 600 }}>Pago</th>
                  <th style={{ padding: "1rem", fontWeight: 600, textAlign: "right" }}>Total (L)</th>
                  <th style={{ padding: "1rem", fontWeight: 600, textAlign: "center" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedOrders.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>No se encontraron registros de ventas con estos filtros.</td></tr>
                ) : (
                  sortedOrders.map((order, idx) => (
                    <tr key={`${order.id}-${idx}`} onClick={() => setSelectedOrderId(order.id)} style={{ borderBottom: "1px solid var(--border-color)", transition: "background-color 0.2s", cursor: "pointer" }} onMouseOver={e => e.currentTarget.style.backgroundColor = "var(--bg-tertiary)"} onMouseOut={e => e.currentTarget.style.backgroundColor = "transparent"}>
                      <td style={{ padding: "1rem", fontWeight: 700, fontFamily: "monospace", color: "var(--text-secondary)" }}>
                        #{order.id.slice(0, 8).toUpperCase()}
                        {order.id.startsWith("man_") && <span style={{ display: "block", fontSize: "0.6rem", color: "var(--accent-color)", fontWeight: 800, marginTop: "2px" }}>MANUAL</span>}
                        {order.is_online && <span style={{ display: "block", fontSize: "0.6rem", color: "#E8593C", fontWeight: 800, marginTop: "2px" }}>🛒 ONLINE</span>}
                      </td>
                      <td style={{ padding: "1rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                        <div>{new Date(order.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</div>
                        {order.scheduled_time && <div style={{ marginTop: "0.25rem" }}><span style={{ backgroundColor: "#8b5cf6", color: "white", padding: "0.1rem 0.4rem", borderRadius: "4px", fontSize: "0.65rem", fontWeight: 800 }}>📅 PROG. {order.scheduled_time}</span></div>}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{order.customer_name || 'Walk-in / Mesa'}</div>
                        <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "0.25rem", display: "flex", flexDirection: "column", gap: "2px" }}>
                          {order.customer_phone && <span>📞 {order.customer_phone}</span>}
                          {order.type === 'mesa' && order.table_number && <span>🪑 Mesa: {order.table_number}</span>}
                          {order.type === 'delivery' && order.customer_address && <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontStyle: "italic" }}>🏠 {order.customer_address}</span>}
                          {order.address_reference && <span style={{ color: "#E8593C", fontSize: "0.65rem" }}>📍 {order.address_reference}</span>}
                        </div>
                      </td>
                      <td style={{ padding: "1rem", fontSize: "0.875rem", fontWeight: 600 }}><span style={{ color: order.type === 'delivery' ? 'var(--warning)' : 'var(--text-primary)' }}>{order.type.toUpperCase()}</span></td>
                      <td style={{ padding: "1rem" }}>{getStatusBadge(order.status)}</td>
                      <td style={{ padding: "1rem", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                        {order.payment_method === 'cash' ? '💵 Efectivo' : order.payment_method === 'transfer' ? '📱 Transferencia' : getPaymentName(order.payment_method, order.payment_details)}
                        {order.transfer_confirmed && <span style={{ display: "block", color: "var(--success)", fontSize: "0.6rem", fontWeight: 800 }}>✓ TRANSFER CONFIRMADA</span>}
                        {order.change_for && <span style={{ display: "block", color: "var(--text-muted)", fontSize: "0.6rem" }}>Cambio: L. {order.change_for}</span>}
                      </td>
                      <td style={{ padding: "1rem", fontWeight: 800, textAlign: "right", color: "var(--accent-color)", whiteSpace: "nowrap" }}>{formatCurrency(order.total)}</td>
                      <td style={{ padding: "1rem", textAlign: "center" }}>
                        <button onClick={e => { e.stopPropagation(); if (order.status !== "cancelled") { alert("⚠️ Solo puedes eliminar ventas con estado 'CANCELADO'."); } else if (confirm(`¿Eliminar permanentemente el ticket #${order.id.slice(0,6).toUpperCase()}?`)) { removeOrder(order.id); } }} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "1.1rem", opacity: order.status === "cancelled" ? 1 : 0.3 }} title={order.status === "cancelled" ? "Eliminar" : "Debe cancelar primero"}>🗑️</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>

        {/* Order Detail Modal */}
        {selectedOrderId && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1300 }}>
            <div className="glass-panel" style={{ width: "90%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto", padding: "2rem", display: "flex", flexDirection: "column" }}>
              {(() => {
                const activeOrder = state.orders.find(o => o.id === selectedOrderId);
                if (!activeOrder) return <p>Orden no encontrada.</p>;
                return (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                      <h2 style={{ fontSize: "1.5rem", fontWeight: 800 }}>TKT #{activeOrder.id.toUpperCase()}</h2>
                      <button onClick={() => setSelectedOrderId(null)} style={{ fontSize: "1.5rem", color: "var(--text-muted)", cursor: "pointer", background: "none", border: "none" }}>&times;</button>
                    </div>

                    <div style={{ marginBottom: "1.5rem", padding: "1rem", backgroundColor: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", border: "1px solid var(--accent-color)", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ padding: "0.25rem 0.75rem", backgroundColor: activeOrder.is_online ? "#E8593C" : "var(--accent-color)", borderRadius: "100px", fontSize: "0.7rem", fontWeight: 800, color: "white", textTransform: "uppercase" }}>
                          {activeOrder.is_online ? "🛒 Pedido Web" : activeOrder.type === "mesa" ? "📍 Comedor" : activeOrder.type === "delivery" ? "🛵 Delivery" : "🛍️ Pickup"}
                        </span>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>DATOS DEL CLIENTE</span>
                      </div>
                      
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>Nombre</label>
                          <p style={{ fontWeight: 700, fontSize: "1.1rem" }}>{activeOrder.customer_name || "Sin nombre"}</p>
                        </div>
                        {activeOrder.customer_phone && (
                          <div>
                            <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>Teléfono</label>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <p style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--accent-color)" }}>📞 {activeOrder.customer_phone}</p>
                                <a href={`https://wa.me/${activeOrder.customer_phone.replace(/\D/g, '')}`} target="_blank" className="btn-primary" style={{ padding: "0.2rem 0.5rem", fontSize: "0.6rem" }}>💬 WhatsApp</a>
                            </div>
                          </div>
                        )}
                      </div>
                      {(activeOrder.customer_address || activeOrder.table_number) && (
                        <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "0.75rem" }}>
                          <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>{activeOrder.type === "mesa" ? "Mesa Asignada" : "Dirección de Entrega"}</label>
                          <p style={{ fontWeight: 600, fontSize: "0.9375rem", marginTop: "0.25rem" }}>{activeOrder.type === "mesa" ? `🪑 ${activeOrder.table_number}` : `🏠 ${activeOrder.customer_address}`}</p>
                          {activeOrder.address_reference && (
                              <p style={{ fontSize: "0.8rem", color: "#E8593C", marginTop: "0.25rem", fontStyle: "italic" }}>📍 Ref: {activeOrder.address_reference}</p>
                          )}
                        </div>
                      )}
                      {activeOrder.notes && (
                          <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "0.75rem" }}>
                            <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>Notas del Cliente</label>
                            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>📝 {activeOrder.notes}</p>
                          </div>
                      )}
                    </div>

                    <div style={{ marginBottom: "1.5rem", padding: "1rem", backgroundColor: "var(--bg-secondary)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                             <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>INFORMACIÓN DE PAGO</label>
                        </div>
                        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                            <div className="badge-outline" style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                                <span>{activeOrder.payment_method === 'cash' ? '💵' : '📱'}</span>
                                <span style={{ fontWeight: 800 }}>{activeOrder.payment_method === 'cash' ? 'EFECTIVO' : 'TRANSFERENCIA'}</span>
                            </div>
                            {activeOrder.payment_method === 'cash' && activeOrder.change_for && (
                                <div style={{ padding: "0.5rem 1rem", borderRadius: "8px", backgroundColor: "rgba(232, 89, 60, 0.1)", border: "1px solid #E8593C" }}>
                                    <span style={{ fontSize: "0.7rem", color: "#E8593C", fontWeight: 800 }}>PAGA CON L. {activeOrder.change_for}</span>
                                </div>
                            )}
                            {activeOrder.transfer_confirmed && (
                                <div style={{ padding: "0.5rem 1rem", borderRadius: "8px", backgroundColor: "rgba(34, 197, 94, 0.1)", border: "1px solid #22c55e" }}>
                                    <span style={{ fontSize: "0.7rem", color: "#22c55e", fontWeight: 800 }}>✓ TRANSFERENCIA CONFIRMADA</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ marginBottom: "1.5rem", backgroundColor: "var(--bg-secondary)", padding: "1rem", borderRadius: "var(--radius-md)" }}>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.5rem" }}>ESTADO OPERATIVO</label>
                      <select className="input-field" value={activeOrder.status} onChange={e => updateOrderStatus(activeOrder.id, e.target.value)} style={{ fontWeight: 600 }}>
                        {[...(state.orderStatuses || [])].sort((a, b) => a.order - b.order).map(s => (
                          <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ marginBottom: "1.5rem" }}>
                      <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.5rem" }}>Composición del Pedido</h3>
                      <ul style={{ listStyle: "none", padding: 0 }}>
                        {activeOrder.items.map((item, idx) => (
                            <li key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--border-color)" }}>
                                <div>
                                <span style={{ fontWeight: 800, color: "var(--accent-color)", marginRight: "1rem" }}>x{item.quantity}</span>
                                <span style={{ fontWeight: 600 }}>{item.product_name}</span>
                                </div>
                                <span style={{ color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{formatCurrency(item.subtotal)}</span>
                            </li>
                        ))}
                      </ul>
                      <div style={{ textAlign: "right", marginTop: "1rem", fontSize: "1.25rem", fontWeight: 800 }}>
                        Total: <span style={{ color: "var(--accent-color)", whiteSpace: "nowrap" }}>{formatCurrency(activeOrder.total)}</span>
                      </div>
                    </div>

                    <div style={{ borderTop: "2px dashed var(--border-color)", paddingTop: "1.5rem" }}>
                      <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "1rem" }}>Gestionar Venta</h3>
                      <div style={{ display: "flex", gap: "1rem" }}>
                         <button className="btn-primary" style={{ flex: 1, backgroundColor: "#22c55e", color: "white" }} onClick={() => updateOrderStatus(activeOrder.id, 'ready')}>Listo para Entregar</button>
                         <button className="btn-primary" style={{ flex: 1, backgroundColor: "#ef4444", color: "white" }} onClick={() => { if(confirm('¿Cancelar pedido?')) updateOrderStatus(activeOrder.id, 'cancelled'); }}>Cancelar Pedido</button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
