"use client";
import React from "react";
import Link from "next/link";
import { useState, useMemo } from "react";
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

  const total = items.reduce((acc: number, i: OrderItem) => acc + i.subtotal, 0);

  const handleAddItem = () => {
    if (!selectedProductId || qty < 1) return;
    const product = state.products.find(p => p.id === selectedProductId);
    if (!product) return;
    setItems(prev => {
      const existing = prev.find((i: OrderItem) => i.product_id === selectedProductId);
      if (existing) {
        return prev.map((i: OrderItem) => i.product_id === selectedProductId
          ? { ...i, quantity: i.quantity + qty, subtotal: (i.quantity + qty) * product.price }
          : i
        );
      }
      return [...prev, { product_id: product.id, product_name: product.name, quantity: qty, subtotal: qty * product.price }];
    });
    setSelectedProductId("");
    setQty(1);
  };

  const handleRemoveItem = (product_id: string) => setItems(prev => prev.filter((i: OrderItem) => i.product_id !== product_id));

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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSaleDate(e.target.value)}
                style={{ fontWeight: 700, fontSize: "0.85rem" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.4rem" }}>Estado Final</label>
              <select className="input-field" value={saleStatus} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSaleStatus(e.target.value)} style={{ fontSize: "0.85rem" }}>
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
            <div style={{ marginTop: "0.5rem" }}>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.4rem" }}>Dirección *</label>
              <input type="text" className="input-field" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="Referencia..." style={{ fontSize: "0.85rem" }} />
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
  const { state, hydrated, updateOrderStatus, updatePaymentStatus, 
    appendItemToOrder, removeItemFromOrder, updateItemQuantity,
    updateOrderDetails, appendCustomItemToOrder, removeOrder } = useAppState();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "mesa" | "delivery" | "pickup">("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDateStart, setFilterDateStart] = useState<string>("");
  const [filterDateEnd, setFilterDateEnd] = useState<string>("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedProductIdToAdd, setSelectedProductIdToAdd] = useState<string>("");
  const [quantityToAdd, setQuantityToAdd] = useState(1);
  const [currentTab, setCurrentTab] = useState<"active" | "cancelled">("active");
  const [showManualSaleModal, setShowManualSaleModal] = useState(false);
  const [addingItemToOrder, setAddingItemToOrder] = useState<string>("");
  const [newItemProductId, setNewItemProductId] = useState<string>("");
  const [newItemQty, setNewItemQty] = useState<number>(1);

  // Edición de items
  const [addMode, setAddMode] = useState<"" | "menu" | "insumo" | "custom">("");
  const [customItemName, setCustomItemName] = useState("");
  const [customItemPrice, setCustomItemPrice] = useState("");
  const [customItemQty, setCustomItemQty] = useState(1);

  // Edición de datos del cliente
  const [editingOrderData, setEditingOrderData] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editTable, setEditTable] = useState("");
  const [editType, setEditType] = useState("");
  const [editPaymentMethod, setEditPaymentMethod] = useState("");
  const [editPaymentDetails, setEditPaymentDetails] = useState("");

  const filteredOrders = useMemo(() => {
    if (!hydrated) return [];
    return state.orders.filter(order => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (!order.id.toLowerCase().includes(term) && !(order.customer_name || "").toLowerCase().includes(term) && !(order.customer_phone || "").toLowerCase().includes(term)) return false;
      }
      if (filterType !== "all" && order.type !== filterType) return false;
      if (filterStatus !== "all" && order.status !== filterStatus) return false;
      const orderDateStr = new Date(order.created_at).toISOString().split('T')[0];
      if (filterDateStart && orderDateStr < filterDateStart) return false;
      if (filterDateEnd && orderDateStr > filterDateEnd) return false;
      if (currentTab === "active") { if (order.status === "cancelled") return false; }
      else { if (order.status !== "cancelled") return false; }
      return true;
    });
  }, [state.orders, searchTerm, filterType, filterStatus, filterDateStart, filterDateEnd, currentTab, hydrated]);

  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [filteredOrders]);

  const summaryMetrics = useMemo(() => {
    const active = sortedOrders.filter(o => o.status !== "cancelled");
    const totalCollected = active.reduce((acc, o) => acc + o.total, 0);
    const deliveryCount = sortedOrders.filter(o => o.type === "delivery").length;
    const pickupMesaCount = sortedOrders.filter(o => o.type !== "delivery").length;
    return {
      totalCollected,
      activeCount: active.length,
      deliveryCount,
      pickupMesaCount
    };
  }, [sortedOrders]);

  if (!hydrated) return null;

  const getPaymentName = (method?: string, details?: string) => {
    const pm = (state.paymentMethods || []).find(p => p.id === method);
    return (pm ? `${pm.icon} ${pm.label}` : (method || "No esp.")) + (details ? ` (${details})` : "");
  };

  const metricCardStyle = {
    backgroundColor: "var(--bg-secondary)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius-md)",
    padding: "1rem",
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.25rem"
  };

  const metricLabelStyle = {
    fontSize: "0.65rem",
    fontWeight: 700,
    color: "var(--text-muted)",
    textTransform: "uppercase" as const
  };

  const metricValueStyle = {
    fontSize: "1.5rem",
    fontWeight: 900,
    color: "var(--accent-color)"
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
                <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700 }}>RESULTADOS: {sortedOrders.length}</p>
              </div>
            </div>
          </header>

          {/* Metrics Panel */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
            <div style={{ ...metricCardStyle, borderLeft: "3px solid var(--accent-color)" }}>
              <div style={metricValueStyle}>{formatCurrency(summaryMetrics.totalCollected)}</div>
              <div style={metricLabelStyle}>Total Recaudado</div>
            </div>
            <div style={metricCardStyle}>
              <div style={metricValueStyle}>{summaryMetrics.activeCount}</div>
              <div style={metricLabelStyle}>Pedidos Activos</div>
            </div>
            <div style={metricCardStyle}>
              <div style={metricValueStyle}>{summaryMetrics.deliveryCount}</div>
              <div style={metricLabelStyle}>Delivery</div>
            </div>
            <div style={metricCardStyle}>
              <div style={metricValueStyle}>{summaryMetrics.pickupMesaCount}</div>
              <div style={metricLabelStyle}>Pickup / Mesa</div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
            <button onClick={() => setCurrentTab("active")} style={{ flex: 1, padding: "0.6rem", borderRadius: "var(--radius-md)", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", backgroundColor: currentTab === "active" ? "var(--accent-color)" : "var(--bg-secondary)", color: currentTab === "active" ? "white" : "var(--text-muted)", border: "1px solid var(--border-color)" }}>Activas</button>
            <button onClick={() => setCurrentTab("cancelled")} style={{ flex: 1, padding: "0.6rem", borderRadius: "var(--radius-md)", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", backgroundColor: currentTab === "cancelled" ? "#ef4444" : "var(--bg-secondary)", color: currentTab === "cancelled" ? "white" : "var(--text-muted)", border: "1px solid var(--border-color)" }}>Canceladas</button>
          </div>

          {/* Filters */}
          <div className="glass-panel" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", padding: "1.25rem", borderRadius: "var(--radius-lg)", marginBottom: "2rem" }}>
            <div style={{ gridColumn: "span 2" }}>
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
            <div>
              <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.25rem" }}>DESDE</label>
              <input type="date" className="input-field" value={filterDateStart} onChange={e => setFilterDateStart(e.target.value)} style={{ fontSize: "0.85rem" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.25rem" }}>HASTA</label>
              <input type="date" className="input-field" value={filterDateEnd} onChange={e => setFilterDateEnd(e.target.value)} style={{ fontSize: "0.85rem" }} />
            </div>
          </div>

          {/* Table Container */}
          <div className="glass-panel scrollable-x" style={{ borderRadius: "var(--radius-lg)" }}>
            <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse", minWidth: "900px" }}>
              <thead>
                <tr style={{ 
                  backgroundColor: "var(--bg-tertiary)", 
                  color: "var(--text-muted)", 
                  fontSize: "0.7rem", 
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  verticalAlign: "middle"
                }}>
                  <th style={{ padding: "0.75rem 1rem" }}>TKT #</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Fecha y Hora</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Cliente / Referencia</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Pago</th>
                  <th style={{ 
                    padding: "0.75rem 1rem", 
                    fontWeight: 700,
                    fontSize: "0.7rem",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    textAlign: "center",
                    width: "130px"
                  }}>
                    Estado Pago
                  </th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Total (L)</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "center" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedOrders.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>No se encontraron registros de ventas con estos filtros.</td></tr>
                ) : (
                  sortedOrders.map((order, idx) => (
                    <tr 
                      key={`${order.id}-${idx}`} 
                      onClick={() => setSelectedOrderId(order.id)} 
                      style={{ borderBottom: "1px solid var(--border-color)", transition: "background-color 0.2s", cursor: "pointer", verticalAlign: "middle" }} 
                      onMouseOver={e => e.currentTarget.style.backgroundColor = "var(--bg-tertiary)"} 
                      onMouseOut={e => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <td style={{ padding: "0.75rem 1rem", fontWeight: 700, fontFamily: "monospace", color: "var(--text-secondary)" }}>
                        #{order.id.slice(0, 8).toUpperCase()}
                        {order.id.startsWith("man_") ? (
                          <span style={{ display: "inline-block", fontSize: "0.6rem", color: "var(--accent-color)", fontWeight: 800, marginTop: "2px", padding: "1px 6px", borderRadius: "4px", border: "1px solid var(--accent-color)", background: "rgba(232,96,60,0.05)" }}>MANUAL</span>
                        ) : (
                          <span style={{ display: "inline-block", fontSize: "0.6rem", color: "#22c55e", fontWeight: 800, marginTop: "2px", padding: "1px 6px", borderRadius: "4px", border: "1px solid rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.15)" }}>ONLINE</span>
                        )}
                      </td>
                      <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                        <div>{new Date(order.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</div>
                        {order.scheduled_time && <div style={{ marginTop: "0.25rem" }}><span style={{ backgroundColor: "#8b5cf6", color: "white", padding: "0.1rem 0.4rem", borderRadius: "4px", fontSize: "0.65rem", fontWeight: 800 }}>📅 PROG. {order.scheduled_time}</span></div>}
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{order.customer_name || 'Walk-in / Mesa'}</div>
                        {/* CAMBIO 3: Badge de tipo unificado */}
                        <span style={{
                          display: "inline-block", marginTop: "4px",
                          fontSize: "0.6rem", fontWeight: 800,
                          padding: "2px 8px", borderRadius: "100px",
                          backgroundColor: order.type === "delivery" 
                            ? "rgba(251,146,60,0.15)" 
                            : "rgba(148,163,184,0.15)",
                          color: order.type === "delivery" 
                            ? "#fb923c" 
                            : "var(--text-muted)",
                          border: order.type === "delivery"
                            ? "1px solid rgba(251,146,60,0.3)"
                            : "1px solid rgba(148,163,184,0.2)",
                          letterSpacing: "0.05em"
                        }}>
                          {order.type === "delivery" ? "🛵 DELIVERY" 
                            : order.type === "pickup" ? "🛍️ PICKUP" 
                            : "🍽️ MESA"}
                        </span>
                        <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "0.25rem", display: "flex", flexDirection: "column", gap: "2px" }}>
                          {order.customer_phone && <span>📞 {order.customer_phone}</span>}
                          {order.type === 'mesa' && order.table_number && <span>🪑 Mesa: {order.table_number}</span>}
                          {order.type === 'delivery' && order.customer_address && <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontStyle: "italic" }}>🏠 {order.customer_address}</span>}
                        </div>
                      </td>
                      <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", color: "var(--text-secondary)" }}>{getPaymentName(order.payment_method, order.payment_details)}</td>
                      <td 
                        style={{ 
                          padding: "0.75rem 1rem", 
                          textAlign: "center",
                          verticalAlign: "middle"
                        }}
                        onClick={e => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            const newStatus = (order.payment_status || "pending") === "paid" 
                              ? "pending" 
                              : "paid";
                            updatePaymentStatus(order.id, newStatus);
                          }}
                          style={{
                            padding: "5px 12px",
                            borderRadius: "100px",
                            border: "none",
                            cursor: "pointer",
                            fontWeight: 800,
                            fontSize: "11px",
                            letterSpacing: "0.04em",
                            transition: "all 200ms ease",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            backgroundColor: (order.payment_status || "pending") === "paid" 
                              ? "rgba(34,197,94,0.12)" 
                              : "rgba(232,89,60,0.10)",
                            color: (order.payment_status || "pending") === "paid" 
                              ? "#16a34a" 
                              : "#E8593C",
                            boxShadow: (order.payment_status || "pending") === "paid"
                              ? "0 0 0 1px rgba(34,197,94,0.3)"
                              : "0 0 0 1px rgba(232,89,60,0.3)"
                          }}
                          title={
                            (order.payment_status || "pending") === "paid" 
                              ? "Click para marcar como pendiente" 
                              : "Click para marcar como pagado"
                          }
                        >
                          {(order.payment_status || "pending") === "paid" 
                            ? <><span>✓</span> Pagado</> 
                            : <><span>●</span> Pendiente</>
                          }
                        </button>
                      </td>
                      <td style={{ padding: "0.75rem 1rem", fontWeight: 800, textAlign: "right", color: "var(--accent-color)", whiteSpace: "nowrap" }}>{formatCurrency(order.total)}</td>
                      
                      {/* CAMBIO 1: Acciones Unificadas */}
                      <td style={{ padding: "0.75rem 1rem", textAlign: "center", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                          <select
                            onClick={e => e.stopPropagation()}
                            onChange={e => { e.stopPropagation(); updateOrderStatus(order.id, e.target.value); }}
                            value={order.status}
                            style={{
                              fontSize: "0.72rem", fontWeight: 700,
                              padding: "4px 8px", borderRadius: "100px",
                              border: "1px solid var(--border-color)",
                              background: "var(--bg-secondary)",
                              color: "var(--text-primary)",
                              cursor: "pointer", maxWidth: "140px",
                              appearance: "auto"
                            }}
                          >
                            {[...(state.orderStatuses || [])]
                              .sort((a, b) => a.order - b.order)
                              .map(s => (
                                <option key={s.id} value={s.id}>{s.label}</option>
                              ))}
                          </select>

                          <button
                            onClick={e => { e.stopPropagation(); 
                              if (order.status !== "cancelled") { 
                                alert("⚠️ Solo puedes eliminar ventas con estado CANCELADO."); 
                              } else if (confirm(`¿Eliminar #${order.id.slice(0,6).toUpperCase()}?`)) { 
                                removeOrder(order.id); 
                              }
                            }}
                            style={{ background: "transparent", border: "none", 
                              cursor: "pointer", fontSize: "1rem", 
                              opacity: order.status === "cancelled" ? 1 : 0.25,
                              flexShrink: 0 }}
                            title={order.status === "cancelled" ? "Eliminar" : "Cancela primero"}
                          >
                            🗑️
                          </button>
                        </div>
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
          <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => { setSelectedOrderId(null); setEditingOrderData(false); setAddMode(""); }}
          >
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }} />
            <div 
              style={{ position: "relative", background: "var(--bg-primary)", borderRadius: "var(--radius-lg)", width: "95%", maxWidth: "640px", maxHeight: "90vh", overflow: "auto", padding: "2rem" }}
              onClick={e => e.stopPropagation()}
            >
              {(() => {
                const activeOrder = state.orders.find(o => o.id === selectedOrderId);
                if (!activeOrder) return <p>Orden no encontrada.</p>;
                return (
                  <>
                    {/* Header del modal */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                      <div>
                        <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0 }}>
                          TKT #{activeOrder.id.slice(-5).toUpperCase()}
                        </h2>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "4px 0 0" }}>
                          {new Date(activeOrder.created_at).toLocaleString("es-HN")}
                        </p>
                      </div>
                      <button onClick={() => { setSelectedOrderId(null); setEditingOrderData(false); setAddMode(""); }}
                        style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--text-muted)" }}>✕</button>
                    </div>

                    {/* ── Datos del cliente ── */}
                    <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "var(--bg-secondary)", borderRadius: "var(--radius-md)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                        <label style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          Datos del cliente
                        </label>
                        <button
                          onClick={() => {
                            if (!editingOrderData) {
                              setEditName(activeOrder.customer_name || "");
                              setEditPhone(activeOrder.customer_phone || "");
                              setEditAddress(activeOrder.customer_address || "");
                              setEditTable(activeOrder.table_number || "");
                              setEditType(activeOrder.type || "pickup");
                              setEditPaymentMethod(activeOrder.payment_method || "");
                              setEditPaymentDetails(activeOrder.payment_details || "");
                            } else {
                              updateOrderDetails(activeOrder.id, {
                                customer_name: editName,
                                customer_phone: editPhone,
                                customer_address: editAddress,
                                table_number: editTable,
                                type: editType,
                                payment_method: editPaymentMethod,
                                payment_details: editPaymentDetails
                              });
                            }
                            setEditingOrderData(!editingOrderData);
                          }}
                          style={{
                            padding: "4px 12px", borderRadius: "100px",
                            fontSize: "11px", fontWeight: 800, cursor: "pointer",
                            border: editingOrderData ? "none" : "1px solid var(--border-color)",
                            background: editingOrderData ? "#E8603C" : "transparent",
                            color: editingOrderData ? "white" : "var(--text-muted)",
                            transition: "all 150ms"
                          }}
                        >
                          {editingOrderData ? "💾 Guardar" : "✏️ Editar"}
                        </button>
                      </div>

                      {editingOrderData ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                            <div style={{ flex: 1, minWidth: "140px" }}>
                              <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "3px" }}>NOMBRE</label>
                              <input className="input-field" value={editName} onChange={e => setEditName(e.target.value)} style={{ width: "100%", fontSize: "0.85rem" }} />
                            </div>
                            <div style={{ flex: 1, minWidth: "140px" }}>
                              <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "3px" }}>TELÉFONO</label>
                              <input className="input-field" value={editPhone} onChange={e => setEditPhone(e.target.value)} style={{ width: "100%", fontSize: "0.85rem" }} />
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                            <div style={{ flex: 1, minWidth: "140px" }}>
                              <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "3px" }}>TIPO</label>
                              <select className="input-field" value={editType} onChange={e => setEditType(e.target.value)} style={{ width: "100%", fontSize: "0.85rem" }}>
                                <option value="pickup">🛍️ Pickup</option>
                                <option value="delivery">🛵 Delivery</option>
                                <option value="mesa">📍 Mesa</option>
                              </select>
                            </div>
                            <div style={{ flex: 1, minWidth: "140px" }}>
                              <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "3px" }}>
                                {editType === "mesa" ? "MESA" : "DIRECCIÓN"}
                              </label>
                              <input className="input-field" 
                                value={editType === "mesa" ? editTable : editAddress} 
                                onChange={e => editType === "mesa" ? setEditTable(e.target.value) : setEditAddress(e.target.value)} 
                                style={{ width: "100%", fontSize: "0.85rem" }} 
                                placeholder={editType === "mesa" ? "Ej: Mesa 3" : "Dirección completa"}
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}>
                          <div>
                            <p style={{ fontWeight: 700, fontSize: "1rem", margin: 0 }}>{activeOrder.customer_name || "Sin nombre"}</p>
                            {activeOrder.customer_phone && <p style={{ fontSize: "0.85rem", color: "var(--accent-color)", margin: "2px 0 0" }}>📞 {activeOrder.customer_phone}</p>}
                          </div>
                          <span style={{ padding: "4px 10px", borderRadius: "100px", fontSize: "11px", fontWeight: 700, background: "var(--bg-tertiary)", border: "1px solid var(--border-color)" }}>
                            {activeOrder.type === "mesa" ? `📍 Mesa ${activeOrder.table_number}` : activeOrder.type === "delivery" ? `🛵 ${activeOrder.customer_address || "Delivery"}` : "🛍️ Pickup"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* ── Pago y estado ── */}
                    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
                      <div style={{ flex: 1, minWidth: "180px", padding: "0.75rem", background: "var(--bg-secondary)", borderRadius: "var(--radius-md)" }}>
                        <label style={{ fontSize: "0.65rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>Método de Pago</label>
                        {editingOrderData ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <select 
                              className="input-field" 
                              value={editPaymentMethod} 
                              onChange={e => {
                                setEditPaymentMethod(e.target.value);
                                // Si cambia a transferencia y no tiene detalles, poner el primer banco
                                if (e.target.value === "transferencia" && !editPaymentDetails) {
                                  const banks = (state.paymentMethods || []).find(p => p.id === "transferencia")?.options;
                                  if (banks && banks.length > 0) setEditPaymentDetails(banks[0].label);
                                }
                              }}
                              style={{ width: "100%", fontSize: "0.85rem" }}
                            >
                              <option value="">Seleccionar...</option>
                              {(state.paymentMethods || []).map(pm => (
                                <option key={pm.id} value={pm.id}>{pm.icon} {pm.label}</option>
                              ))}
                            </select>

                            {editPaymentMethod === "transferencia" ? (
                              <select
                                className="input-field"
                                value={editPaymentDetails}
                                onChange={e => setEditPaymentDetails(e.target.value)}
                                style={{ width: "100%", fontSize: "0.85rem" }}
                              >
                                <option value="">Seleccionar banco...</option>
                                {(state.paymentMethods || [])
                                  .find(p => p.id === "transferencia")
                                  ?.options?.filter(opt => opt.is_active !== false)
                                  .map(opt => (
                                    <option key={opt.label} value={opt.label}>{opt.label}</option>
                                  ))
                                }
                              </select>
                            ) : (
                              <input 
                                className="input-field" 
                                value={editPaymentDetails} 
                                onChange={e => setEditPaymentDetails(e.target.value)}
                                placeholder="Detalles (ej: # de transferencia)"
                                style={{ width: "100%", fontSize: "0.85rem" }}
                              />
                            )}
                          </div>
                        ) : (
                          <p style={{ fontWeight: 600, fontSize: "0.875rem", margin: 0 }}>{getPaymentName(activeOrder.payment_method, activeOrder.payment_details)}</p>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: "180px", padding: "0.75rem", background: "var(--bg-secondary)", borderRadius: "var(--radius-md)" }}>
                        <label style={{ fontSize: "0.65rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>Estado de Pago</label>
                        <button onClick={() => { const s = (activeOrder.payment_status || "pending") === "paid" ? "pending" : "paid"; updatePaymentStatus(activeOrder.id, s); }}
                          style={{ padding: "5px 12px", borderRadius: "100px", border: "none", cursor: "pointer", fontWeight: 800, fontSize: "11px",
                            backgroundColor: (activeOrder.payment_status || "pending") === "paid" ? "rgba(34,197,94,0.12)" : "rgba(232,89,60,0.10)",
                            color: (activeOrder.payment_status || "pending") === "paid" ? "#16a34a" : "#E8593C",
                            boxShadow: (activeOrder.payment_status || "pending") === "paid" ? "0 0 0 1px rgba(34,197,94,0.3)" : "0 0 0 1px rgba(232,89,60,0.3)" }}>
                          {(activeOrder.payment_status || "pending") === "paid" ? "✓ Pagado" : "● Pendiente"}
                        </button>
                      </div>
                    </div>

                    {/* ── Estado operativo ── */}
                    <div style={{ marginBottom: "1.5rem", padding: "0.75rem", background: "var(--bg-secondary)", borderRadius: "var(--radius-md)" }}>
                      <label style={{ fontSize: "0.65rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>Estado Operativo</label>
                      <select className="input-field" value={activeOrder.status} onChange={e => updateOrderStatus(activeOrder.id, e.target.value)} style={{ fontWeight: 600 }}>
                        {[...(state.orderStatuses || [])].sort((a, b) => a.order - b.order).map(s => (
                          <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* ── Composición de la Venta ── */}
                    <div style={{ marginBottom: "1.5rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                        <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>Composición de la Venta</h3>
                        <div style={{ display: "flex", gap: "4px" }}>
                          <button onClick={() => setAddMode(addMode === "menu" ? "" : "menu")}
                            style={{ padding: "4px 10px", borderRadius: "100px", fontSize: "10px", fontWeight: 800, cursor: "pointer",
                              border: addMode === "menu" ? "none" : "1px solid var(--border-color)",
                              background: addMode === "menu" ? "var(--accent-color)" : "transparent",
                              color: addMode === "menu" ? "white" : "var(--text-muted)" }}>
                            {addMode === "menu" ? "✕" : "+ Platillo"}
                          </button>
                          <button onClick={() => setAddMode(addMode === "insumo" ? "" : "insumo")}
                            style={{ padding: "4px 10px", borderRadius: "100px", fontSize: "10px", fontWeight: 800, cursor: "pointer",
                              border: addMode === "insumo" ? "none" : "1px solid var(--border-color)",
                              background: addMode === "insumo" ? "#7c3aed" : "transparent",
                              color: addMode === "insumo" ? "white" : "var(--text-muted)" }}>
                            {addMode === "insumo" ? "✕" : "+ Insumo"}
                          </button>
                          <button onClick={() => setAddMode(addMode === "custom" ? "" : "custom")}
                            style={{ padding: "4px 10px", borderRadius: "100px", fontSize: "10px", fontWeight: 800, cursor: "pointer",
                              border: addMode === "custom" ? "none" : "1px solid var(--border-color)",
                              background: addMode === "custom" ? "#f59e0b" : "transparent",
                              color: addMode === "custom" ? "white" : "var(--text-muted)" }}>
                            {addMode === "custom" ? "✕" : "+ Otro"}
                          </button>
                        </div>
                      </div>

                      {/* Form: Agregar platillo del menú */}
                      {addMode === "menu" && (
                        <div style={{ display: "flex", gap: "8px", alignItems: "flex-end", flexWrap: "wrap", padding: "10px", background: "var(--bg-secondary)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", marginBottom: "0.75rem" }}>
                          <div style={{ flex: 2, minWidth: "140px" }}>
                            <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "3px" }}>PLATILLO DEL MENÚ</label>
                            <select className="input-field" value={newItemProductId} onChange={e => setNewItemProductId(e.target.value)} style={{ width: "100%", fontSize: "0.85rem" }}>
                              <option value="">Seleccionar...</option>
                              {state.products.filter(p => p.is_active !== false).map(p => (
                                <option key={p.id} value={p.id}>{p.name} — L. {p.price}</option>
                              ))}
                            </select>
                          </div>
                          <div style={{ flex: "0 0 60px" }}>
                            <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "3px" }}>CANT.</label>
                            <input type="number" className="input-field" value={newItemQty} onChange={e => setNewItemQty(Math.max(1, Number(e.target.value)))} min="1" style={{ width: "100%", textAlign: "center" }} />
                          </div>
                          <button onClick={() => { if (!newItemProductId) return; appendItemToOrder(activeOrder.id, { product_id: newItemProductId, quantity: newItemQty }); setNewItemProductId(""); setNewItemQty(1); setAddMode(""); }}
                            disabled={!newItemProductId}
                            style={{ padding: "8px 14px", background: newItemProductId ? "#E8603C" : "#ccc", color: "white", border: "none", borderRadius: "var(--radius-sm)", fontWeight: 800, fontSize: "0.85rem", cursor: newItemProductId ? "pointer" : "not-allowed" }}>
                            Agregar
                          </button>
                        </div>
                      )}

                      {/* Form: Agregar insumo del inventario */}
                      {addMode === "insumo" && (
                        <div style={{ display: "flex", gap: "8px", alignItems: "flex-end", flexWrap: "wrap", padding: "10px", background: "rgba(124,58,237,0.05)", borderRadius: "var(--radius-md)", border: "1px solid rgba(124,58,237,0.2)", marginBottom: "0.75rem" }}>
                          <div style={{ flex: 2, minWidth: "140px" }}>
                            <label style={{ fontSize: "10px", fontWeight: 700, color: "#7c3aed", display: "block", marginBottom: "3px" }}>INSUMO DEL INVENTARIO</label>
                            <select className="input-field" value={newItemProductId} onChange={e => setNewItemProductId(e.target.value)} style={{ width: "100%", fontSize: "0.85rem" }}>
                              <option value="">Seleccionar insumo...</option>
                              {state.ingredients.map(ing => (
                                <option key={ing.id} value={`ing_${ing.id}`}>{ing.name} ({ing.unit}) — L. {ing.cost_per_unit}</option>
                              ))}
                            </select>
                          </div>
                          <div style={{ flex: "0 0 60px" }}>
                            <label style={{ fontSize: "10px", fontWeight: 700, color: "#7c3aed", display: "block", marginBottom: "3px" }}>CANT.</label>
                            <input type="number" className="input-field" value={newItemQty} onChange={e => setNewItemQty(Math.max(1, Number(e.target.value)))} min="1" style={{ width: "100%", textAlign: "center" }} />
                          </div>
                          <button onClick={() => {
                              if (!newItemProductId) return;
                              const ingId = newItemProductId.replace("ing_", "");
                              const ing = state.ingredients.find(i => i.id === ingId);
                              if (!ing) return;
                              appendCustomItemToOrder(activeOrder.id, `${ing.name} (extra)`, ing.cost_per_unit, newItemQty);
                              setNewItemProductId(""); setNewItemQty(1); setAddMode("");
                            }}
                            disabled={!newItemProductId}
                            style={{ padding: "8px 14px", background: newItemProductId ? "#7c3aed" : "#ccc", color: "white", border: "none", borderRadius: "var(--radius-sm)", fontWeight: 800, fontSize: "0.85rem", cursor: newItemProductId ? "pointer" : "not-allowed" }}>
                            Agregar
                          </button>
                        </div>
                      )}

                      {/* Form: Agregar item personalizado */}
                      {addMode === "custom" && (
                        <div style={{ display: "flex", gap: "8px", alignItems: "flex-end", flexWrap: "wrap", padding: "10px", background: "rgba(245,158,11,0.05)", borderRadius: "var(--radius-md)", border: "1px solid rgba(245,158,11,0.2)", marginBottom: "0.75rem" }}>
                          <div style={{ flex: 2, minWidth: "120px" }}>
                            <label style={{ fontSize: "10px", fontWeight: 700, color: "#f59e0b", display: "block", marginBottom: "3px" }}>DESCRIPCIÓN</label>
                            <input className="input-field" value={customItemName} onChange={e => setCustomItemName(e.target.value)} placeholder="Ej: Extra de queso" style={{ width: "100%", fontSize: "0.85rem" }} />
                          </div>
                          <div style={{ flex: "0 0 80px" }}>
                            <label style={{ fontSize: "10px", fontWeight: 700, color: "#f59e0b", display: "block", marginBottom: "3px" }}>PRECIO (L)</label>
                            <input type="number" className="input-field" value={customItemPrice} onChange={e => setCustomItemPrice(e.target.value)} step="0.01" min="0" style={{ width: "100%", textAlign: "center" }} />
                          </div>
                          <div style={{ flex: "0 0 60px" }}>
                            <label style={{ fontSize: "10px", fontWeight: 700, color: "#f59e0b", display: "block", marginBottom: "3px" }}>CANT.</label>
                            <input type="number" className="input-field" value={customItemQty} onChange={e => setCustomItemQty(Math.max(1, Number(e.target.value)))} min="1" style={{ width: "100%", textAlign: "center" }} />
                          </div>
                          <button onClick={() => {
                              if (!customItemName || !customItemPrice) return;
                              appendCustomItemToOrder(activeOrder.id, customItemName, Number(customItemPrice), customItemQty);
                              setCustomItemName(""); setCustomItemPrice(""); setCustomItemQty(1); setAddMode("");
                            }}
                            disabled={!customItemName || !customItemPrice}
                            style={{ padding: "8px 14px", background: customItemName && customItemPrice ? "#f59e0b" : "#ccc", color: "white", border: "none", borderRadius: "var(--radius-sm)", fontWeight: 800, fontSize: "0.85rem", cursor: customItemName && customItemPrice ? "pointer" : "not-allowed" }}>
                            Agregar
                          </button>
                        </div>
                      )}

                      {/* Lista de items */}
                      <div style={{ border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
                        {activeOrder.items.map((item, idx) => {
                          const unitPrice = item.quantity > 0 ? item.subtotal / item.quantity : 0;
                          const isCustom = item.product_id?.startsWith("custom_");
                          return (
                            <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.65rem 0.75rem", borderBottom: idx < activeOrder.items.length - 1 ? "1px solid var(--border-color)" : "none", gap: "0.5rem" }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                                  {isCustom && <span style={{ fontSize: "0.65rem", color: "#f59e0b", marginRight: "4px" }}>★</span>}
                                  {item.product_name}
                                </span>
                                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginLeft: "6px" }}>
                                  @ {formatCurrency(unitPrice)}/u
                                </span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "3px", flexShrink: 0 }}>
                                <button onClick={() => { if (item.quantity <= 1) { if (window.confirm(`¿Eliminar "${item.product_name}"?`)) removeItemFromOrder(activeOrder.id, idx); } else updateItemQuantity(activeOrder.id, idx, item.quantity - 1); }}
                                  style={{ width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", fontWeight: 700, color: item.quantity <= 1 ? "#dc2626" : "var(--text-primary)" }}>
                                  {item.quantity <= 1 ? "🗑" : "−"}
                                </button>
                                <span style={{ fontWeight: 800, fontSize: "0.85rem", minWidth: "22px", textAlign: "center" }}>{item.quantity}</span>
                                <button onClick={() => updateItemQuantity(activeOrder.id, idx, item.quantity + 1)}
                                  style={{ width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", fontWeight: 700 }}>
                                  +
                                </button>
                              </div>
                              <span style={{ fontWeight: 700, color: "var(--accent-color)", whiteSpace: "nowrap", flexShrink: 0, minWidth: "75px", textAlign: "right", fontSize: "0.85rem" }}>
                                {formatCurrency(item.subtotal)}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Total */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.75rem", padding: "0.75rem 1rem", background: "var(--bg-tertiary)", borderRadius: "var(--radius-md)" }}>
                        <span style={{ fontWeight: 700, fontSize: "1rem" }}>Total</span>
                        <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--accent-color)", whiteSpace: "nowrap" }}>{formatCurrency(activeOrder.total)}</span>
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
