"use client";
import Link from "next/link";
import { useState } from "react";
import { useAppState } from "@/lib/useStore";
import AuthGuard from "@/components/Auth/AuthGuard";
import { OrderItem } from "@/lib/mockDB";
import { formatCurrency } from "@/lib/utils";

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
      justifyContent: "center", zIndex: 200, padding: "1rem"
    }}>
      <div className="glass-panel" style={{
        width: "100%", maxWidth: "700px", maxHeight: "92vh", overflowY: "auto",
        padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem",
        border: "1px solid var(--accent-color)"
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--accent-color)" }}>✍️ Registrar Venta Manual</h2>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Solo visible para Administradores · Permite seleccionar fechas anteriores</p>
          </div>
          <button onClick={onClose} style={{ fontSize: "1.5rem", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>✕</button>
        </div>

        {/* Fecha y Estado */}
        <div style={{ backgroundColor: "var(--bg-secondary)", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "1rem", letterSpacing: "0.05em" }}>📅 Fecha y Estado</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.4rem" }}>Fecha y Hora de la Venta</label>
              <input
                type="datetime-local"
                className="input-field"
                value={saleDate}
                onChange={e => setSaleDate(e.target.value)}
                style={{ fontWeight: 700 }}
              />
              <p style={{ fontSize: "0.7rem", color: "var(--accent-color)", marginTop: "0.3rem", fontWeight: 600 }}>💡 Puedes seleccionar cualquier fecha pasada</p>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.4rem" }}>Estado Final de la Venta</label>
              <select className="input-field" value={saleStatus} onChange={e => setSaleStatus(e.target.value)}>
                {[...(state.orderStatuses || [])].sort((a, b) => a.order - b.order).map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tipo y Cliente */}
        <div style={{ backgroundColor: "var(--bg-secondary)", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "1rem", letterSpacing: "0.05em" }}>👤 Tipo de Venta y Cliente</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.4rem" }}>Tipo de Operación</label>
              <select className="input-field" value={orderType} onChange={e => setOrderType(e.target.value as any)}>
                <option value="mesa">🍽️ Mesa / Comedor</option>
                <option value="pickup">🛍️ Pick Up (Para Llevar)</option>
                <option value="delivery">🛵 Delivery</option>
              </select>
            </div>
            {orderType === "mesa" ? (
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.4rem" }}>Mesa / Referencia</label>
                <input type="text" className="input-field" value={tableRef} onChange={e => setTableRef(e.target.value)} placeholder="Ej. Mesa 3" />
              </div>
            ) : (
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.4rem" }}>Nombre del Cliente</label>
                <input type="text" className="input-field" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Nombre Completo" />
              </div>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {orderType !== "mesa" && (
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.4rem" }}>Teléfono (opc.)</label>
                <input type="text" className="input-field" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="9999-9999" />
              </div>
            )}
            {orderType === "delivery" && (
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.4rem" }}>Dirección de Entrega *</label>
                <input type="text" className="input-field" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="Colonia, Calle, Referencia..." />
              </div>
            )}
          </div>
        </div>

        {/* Método de Pago */}
        <div style={{ backgroundColor: "var(--bg-secondary)", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "1rem", letterSpacing: "0.05em" }}>💳 Método de Pago</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.4rem" }}>Forma de Pago</label>
              <select className="input-field" value={paymentMethod} onChange={e => { setPaymentMethod(e.target.value); setPaymentDetails(""); }}>
                {(state.paymentMethods || []).filter(p => p.is_active).map(pm => (
                  <option key={pm.id} value={pm.id}>{pm.icon} {pm.label}</option>
                ))}
              </select>
            </div>
            {selectedPayMethod?.options && selectedPayMethod.options.length > 0 && (
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.4rem" }}>Banco / Detalle</label>
                <select className="input-field" value={paymentDetails} onChange={e => setPaymentDetails(e.target.value)}>
                  <option value="">-- Seleccionar --</option>
                  {selectedPayMethod.options.filter(o => o.is_active).map((o, i) => (
                    <option key={i} value={o.label}>{o.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Productos */}
        <div style={{ backgroundColor: "var(--bg-secondary)", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "1rem", letterSpacing: "0.05em" }}>🍔 Productos de la Venta</p>

          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
            <select className="input-field" style={{ flex: 3, minWidth: "200px" }} value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)}>
              <option value="">Seleccionar producto...</option>
              {state.products.map(p => (
                <option key={p.id} value={p.id}>{p.name} — {formatCurrency(p.price)}</option>
              ))}
            </select>
            <input type="number" min={1} className="input-field" style={{ width: "80px", textAlign: "center" }} value={qty} onChange={e => setQty(Number(e.target.value))} />
            <button className="btn-primary" onClick={handleAddItem} style={{ padding: "0.6rem 1.25rem", whiteSpace: "nowrap" }}>+ Agregar</button>
          </div>

          {items.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", textAlign: "center", padding: "1rem" }}>No hay productos en la venta aún.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {items.map((item, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "0.75rem 1rem", backgroundColor: "var(--bg-tertiary)",
                  borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ backgroundColor: "var(--accent-color)", color: "white", padding: "0.2rem 0.6rem", borderRadius: "100px", fontWeight: 800, fontSize: "0.875rem" }}>x{item.quantity}</span>
                    <span style={{ fontWeight: 600 }}>{item.product_name}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <span style={{ fontWeight: 700, color: "var(--accent-color)", whiteSpace: "nowrap" }}>{formatCurrency(item.subtotal)}</span>
                    <button onClick={() => handleRemoveItem(item.product_id)} style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: "1.1rem" }}>🗑️</button>
                  </div>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "1rem", padding: "1rem", borderTop: "2px solid var(--accent-color)", marginTop: "0.5rem" }}>
                <span style={{ fontWeight: 700, color: "var(--text-muted)" }}>TOTAL:</span>
                <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--accent-color)", whiteSpace: "nowrap" }}>{formatCurrency(total)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "0.75rem 2rem", borderRadius: "var(--radius-md)", fontWeight: 700, cursor: "pointer", backgroundColor: "var(--bg-secondary)", color: "var(--text-muted)", border: "1px solid var(--border-color)" }}>
            Cancelar
          </button>
          <button className="btn-primary" onClick={handleSubmit} disabled={items.length === 0} style={{ padding: "0.75rem 2.5rem", fontWeight: 800, opacity: items.length === 0 ? 0.5 : 1 }}>
            ✅ Guardar Venta
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OrdersDashboard() {
  const { state, hydrated, updateOrderStatus, appendItemToOrder, removeOrder, signOut } = useAppState();

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

  if (!hydrated) return null;

  const filteredOrders = state.orders.filter(order => {
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

      <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg-primary)" }}>
        {/* Sidebar */}
        <aside style={{ width: "250px", backgroundColor: "var(--bg-secondary)", borderRight: "1px solid var(--border-color)", padding: "1.5rem", display: "flex", flexDirection: "column" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "2rem", color: "var(--accent-color)" }}>Admin Panel</h2>
          <nav style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <Link href="/admin" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>Dashboard Central</Link>
            <Link href="/admin/orders" style={{ padding: "0.75rem", backgroundColor: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", fontWeight: 600 }}>Ventas</Link>
            <Link href="/admin/inventory" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>Inventario (Insumos)</Link>
            <Link href="/admin/pricing" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>Catálogo y Precios</Link>
            <Link href="/admin/expenses" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>Gastos</Link>
            <Link href="/admin/finances" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>Finanzas</Link>
            <Link href="/admin/settings" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>Configuración</Link>
            <div style={{ marginTop: "1rem", borderTop: "1px solid var(--border-color)", paddingTop: "1rem", color: "var(--text-muted)", fontSize: "0.875rem", fontWeight: 700 }}>Módulos Operativos</div>
            <Link href="/pos" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>Terminal de Ventas (POS)</Link>
            <Link href="/kds" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>Pantalla de Cocina (KDS)</Link>
            <Link href="/delivery" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>App Repartidores</Link>
            <Link href="/" target="_blank" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)", border: "1px dashed var(--border-color)" }}>Ver Menú Digital (PWA)</Link>
            <button onClick={() => { if(confirm("¿Cerrar sesión?")) signOut(); }} style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--danger)", border: "none", background: "rgba(239, 68, 68, 0.05)", fontWeight: 700, cursor: "pointer", textAlign: "left", marginTop: "1rem" }}>❌ Cerrar Sesión</button>
          </nav>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, padding: "2rem", overflowY: "auto" }}>
          <header style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <h1 style={{ fontSize: "2rem", fontWeight: 700 }}>Ventas</h1>
              <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>Registro centralizado de todas las operaciones y canal de venta.</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
              <button
                className="btn-primary"
                onClick={() => setShowManualSaleModal(true)}
                style={{ padding: "0.75rem 1.5rem", fontWeight: 800, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.5rem", boxShadow: "0 4px 14px rgba(249,115,22,0.4)" }}
              >
                ✍️ Registrar Venta
              </button>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", fontWeight: 700 }}>TOTAL EN ESTA LISTA</p>
                <p style={{ fontSize: "1.5rem", fontWeight: 800 }}>{filteredOrders.length}</p>
              </div>
            </div>
          </header>

          {/* Tabs */}
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
            <button onClick={() => setCurrentTab("active")} style={{ padding: "0.75rem 1.5rem", borderRadius: "var(--radius-md)", fontWeight: 700, cursor: "pointer", backgroundColor: currentTab === "active" ? "var(--accent-color)" : "var(--bg-secondary)", color: currentTab === "active" ? "white" : "var(--text-muted)", border: "1px solid var(--border-color)", transition: "0.2s" }}>📋 Ventas Activas</button>
            <button onClick={() => setCurrentTab("cancelled")} style={{ padding: "0.75rem 1.5rem", borderRadius: "var(--radius-md)", fontWeight: 700, cursor: "pointer", backgroundColor: currentTab === "cancelled" ? "#ef4444" : "var(--bg-secondary)", color: currentTab === "cancelled" ? "white" : "var(--text-muted)", border: "1px solid var(--border-color)", transition: "0.2s" }}>🚫 Ventas Canceladas</button>
          </div>

          {/* Filters */}
          <div className="glass-panel" style={{ display: "flex", gap: "1rem", padding: "1rem 1.5rem", borderRadius: "var(--radius-lg)", marginBottom: "2rem", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ flex: 3, minWidth: "300px" }}>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.25rem" }}>BUSCAR VENTA O CLIENTE</label>
              <input type="text" className="input-field" placeholder="Buscar por ID, Teléfono o Nombre..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ fontSize: "0.875rem", padding: "0.5rem" }} />
            </div>
            <div style={{ flex: 1, minWidth: "150px" }}>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.25rem" }}>CANAL / TIPO</label>
              <select className="input-field" value={filterType} onChange={e => setFilterType(e.target.value as any)} style={{ fontSize: "0.875rem", padding: "0.5rem" }}>
                <option value="all">Ver Todos</option>
                <option value="mesa">🍽️ Mesa Local</option>
                <option value="pickup">🛍️ Pick Up (Llevar)</option>
                <option value="delivery">🛵 Delivery</option>
              </select>
            </div>
            <div style={{ flex: 1, minWidth: "150px" }}>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.25rem" }}>ESTADO DE VENTA</label>
              <select className="input-field" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ fontSize: "0.875rem", padding: "0.5rem" }}>
                <option value="all">Ver Todos</option>
                {[...(state.orderStatuses || [])].sort((a, b) => a.order - b.order).map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 2, minWidth: "300px" }}>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.25rem" }}>FILTRAR ENTRE FECHAS</label>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <input type="date" className="input-field" value={filterDateStart} onChange={e => setFilterDateStart(e.target.value)} style={{ fontSize: "0.875rem", padding: "0.5rem", flex: 1, minWidth: "120px" }} />
                <span style={{ color: "var(--text-muted)", fontWeight: 700 }}>a</span>
                <input type="date" className="input-field" value={filterDateEnd} onChange={e => setFilterDateEnd(e.target.value)} style={{ fontSize: "0.875rem", padding: "0.5rem", flex: 1, minWidth: "120px" }} />
              </div>
            </div>
          </div>

          {/* Table */}
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
                        </div>
                      </td>
                      <td style={{ padding: "1rem", fontSize: "0.875rem", fontWeight: 600 }}><span style={{ color: order.type === 'delivery' ? 'var(--warning)' : 'var(--text-primary)' }}>{order.type.toUpperCase()}</span></td>
                      <td style={{ padding: "1rem" }}>{getStatusBadge(order.status)}</td>
                      <td style={{ padding: "1rem", fontSize: "0.875rem", color: "var(--text-secondary)" }}>{getPaymentName(order.payment_method, order.payment_details)}</td>
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
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
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
                        <span style={{ padding: "0.25rem 0.75rem", backgroundColor: "var(--accent-color)", borderRadius: "100px", fontSize: "0.7rem", fontWeight: 800, color: "white", textTransform: "uppercase" }}>
                          {activeOrder.type === "mesa" ? "📍 Comedor" : activeOrder.type === "delivery" ? "🛵 Delivery" : "🛍️ Pickup"}
                        </span>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>DATOS DEL CLIENTE</span>
                      </div>
                      {activeOrder.scheduled_time && (
                        <div style={{ backgroundColor: "rgba(139, 92, 246, 0.1)", border: "1px solid #8b5cf6", padding: "0.75rem", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", gap: "0.5rem", color: "#8b5cf6" }}>
                          <span style={{ fontSize: "1.25rem" }}>🕒</span>
                          <div>
                            <p style={{ fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase", margin: 0 }}>Pedido Programado</p>
                            <p style={{ fontSize: "1rem", fontWeight: 800, margin: 0 }}>Hora de Entrega: {activeOrder.scheduled_time}</p>
                          </div>
                        </div>
                      )}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>Nombre</label>
                          <p style={{ fontWeight: 700, fontSize: "1.1rem" }}>{activeOrder.customer_name || "Sin nombre"}</p>
                        </div>
                        {activeOrder.customer_phone && (
                          <div>
                            <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>Teléfono</label>
                            <p style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--accent-color)" }}>📞 {activeOrder.customer_phone}</p>
                          </div>
                        )}
                      </div>
                      {(activeOrder.customer_address || activeOrder.table_number) && (
                        <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "0.75rem" }}>
                          <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>{activeOrder.type === "mesa" ? "Mesa Asignada" : "Dirección de Entrega"}</label>
                          <p style={{ fontWeight: 600, fontSize: "0.9375rem", marginTop: "0.25rem" }}>{activeOrder.type === "mesa" ? `🪑 ${activeOrder.table_number}` : `🏠 ${activeOrder.customer_address}`}</p>
                        </div>
                      )}
                    </div>

                    {activeOrder.payment_details && (
                      <div style={{ marginBottom: "1rem" }}>
                        <span style={{ backgroundColor: "var(--bg-tertiary)", padding: "0.5rem 1rem", borderRadius: "var(--radius-md)", fontSize: "0.875rem", fontWeight: 700, border: "1px solid var(--border-color)" }}>
                          🏦 Banco Destino: <span style={{ color: "var(--accent-color)" }}>{activeOrder.payment_details}</span>
                        </span>
                      </div>
                    )}

                    <div style={{ marginBottom: "1.5rem", backgroundColor: "var(--bg-secondary)", padding: "1rem", borderRadius: "var(--radius-md)" }}>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.5rem" }}>ESTADO OPERATIVO (LOGÍSTICA)</label>
                      <select className="input-field" value={activeOrder.status} onChange={e => updateOrderStatus(activeOrder.id, e.target.value)} style={{ fontWeight: 600 }}>
                        {[...(state.orderStatuses || [])].sort((a, b) => a.order - b.order).map(s => (
                          <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ marginBottom: "1.5rem" }}>
                      <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.5rem" }}>Composición de la Venta</h3>
                      <ul style={{ listStyle: "none", padding: 0 }}>
                        {activeOrder.items.map((item, idx) => {
                          const product = state.products.find(p => p.id === item.product_id);
                          return (
                            <li key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--border-color)" }}>
                              <div>
                                <span style={{ fontWeight: 800, color: "var(--accent-color)", marginRight: "1rem" }}>x{item.quantity}</span>
                                <span style={{ fontWeight: 600 }}>{item.product_name || (product ? product.name : `Producto ${item.product_id}`)}</span>
                              </div>
                              <span style={{ color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{formatCurrency(item.subtotal)}</span>
                            </li>
                          );
                        })}
                      </ul>
                      <div style={{ textAlign: "right", marginTop: "1rem", fontSize: "1.25rem", fontWeight: 800 }}>
                        Total: <span style={{ color: "var(--accent-color)", whiteSpace: "nowrap" }}>{formatCurrency(activeOrder.total)}</span>
                      </div>
                    </div>

                    <div style={{ borderTop: "2px dashed var(--border-color)", paddingTop: "1.5rem" }}>
                      <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "1rem" }}>Agregar un Plato a la Venta</h3>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <select className="input-field" style={{ flex: 1 }} value={selectedProductIdToAdd} onChange={e => setSelectedProductIdToAdd(e.target.value)}>
                          <option value="">Seleccione un Platillo...</option>
                          {state.products.map(p => <option key={p.id} value={p.id}>{p.name} - {formatCurrency(p.price)}</option>)}
                        </select>
                        <input type="number" className="input-field" style={{ width: "80px", textAlign: "center" }} min={1} value={quantityToAdd} onChange={e => setQuantityToAdd(Number(e.target.value))} />
                        <button className="btn-primary" onClick={() => { if (!selectedProductIdToAdd || quantityToAdd < 1) return; appendItemToOrder(activeOrder.id, { product_id: selectedProductIdToAdd, quantity: quantityToAdd, subtotal: 0 }); setSelectedProductIdToAdd(""); setQuantityToAdd(1); }}>+ Agregar</button>
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
    </AuthGuard>
  );
}
