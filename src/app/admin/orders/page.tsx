"use client";
import React from "react";
import Link from "next/link";
import { useState, useMemo } from "react";
import { useAppState } from "@/lib/useStore";
import AuthGuard from "@/components/Auth/AuthGuard";
import { OrderItem, Order, Discount } from "@/lib/mockDB";
import { formatCurrency } from "@/lib/utils";
import Sidebar from "@/components/Admin/Sidebar";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

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
  const [discountId, setDiscountId] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");

  const [items, setItems] = useState<OrderItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [qty, setQty] = useState(1);
  const subtotal = items.reduce((acc, i) => acc + i.subtotal, 0);

  const activeDiscount = discountId ? state.discounts.find(d => d.id === discountId) : null;
  const appliedCoupon = couponCode.trim() 
    ? state.discounts.find(d => d.type === "coupon" && d.code === couponCode.trim() && d.is_active) 
    : null;

  const currentDiscount = appliedCoupon || activeDiscount;
  let discountAmount = 0;
  if (currentDiscount) {
    if (currentDiscount.type === "percent") discountAmount = subtotal * (currentDiscount.value / 100);
    else discountAmount = currentDiscount.value;
  }
  const total = Math.max(0, subtotal - discountAmount);

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

  const handleSubmit = async () => {
    if (items.length === 0) return alert("⚠️ Agrega al menos un producto.");
    if (orderType === "delivery" && !customerAddress) return alert("⚠️ La dirección es obligatoria para Delivery.");
    
    try {
      await addOrder({
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
        subtotal,
        discount_id: currentDiscount?.id,
        discount_amount: discountAmount,
        discount_code: appliedCoupon?.code,
        total,
        created_at: new Date(saleDate).toISOString(),
      });
      alert("✅ Venta registrada correctamente.");
      onClose();
    } catch (e: any) {
      alert("❌ Error al registrar la venta: " + (e.message || "Error desconocido"));
    }
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
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
            <span>Subtotal:</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {discountAmount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--danger)" }}>
              <span>Descuento ({currentDiscount?.name}):</span>
              <span>-{formatCurrency(discountAmount)}</span>
            </div>
          )}
          <div style={{ textAlign: "right", marginTop: "0.5rem", fontWeight: 800, color: "var(--accent-color)", fontSize: "1.2rem" }}>
            TOTAL: {formatCurrency(total)}
          </div>
        </div>

        {/* Descuentos */}
        <div style={{ backgroundColor: "var(--bg-secondary)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.5rem" }}>🏷️ Aplicar Descuento</label>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <select 
              className="input-field" 
              style={{ flex: 1, minWidth: "150px", fontSize: "0.85rem" }} 
              value={discountId || ""} 
              onChange={e => {
                setDiscountId(e.target.value || null);
                if (e.target.value) setCouponCode("");
              }}
            >
              <option value="">Sin descuento</option>
              {state.discounts.filter(d => d.is_active && d.type !== "coupon").map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.type === "percent" ? `${d.value}%` : `L. ${d.value}`})</option>
              ))}
            </select>
            <input 
              type="text" 
              className="input-field" 
              style={{ flex: 1, minWidth: "120px", fontSize: "0.85rem", textTransform: "uppercase" }} 
              placeholder="Código de Cupón" 
              value={couponCode} 
              onChange={e => {
                setCouponCode(e.target.value.toUpperCase());
                if (e.target.value) setDiscountId(null);
              }}
            />
          </div>
          {couponCode && !appliedCoupon && (
            <p style={{ color: "var(--danger)", fontSize: "0.7rem", marginTop: "0.4rem" }}>⚠️ Cupón inválido o inactivo</p>
          )}
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

// ─── Edit Order Modal ────────────────────────────────────────────────────────
function EditOrderModal({ 
  order, 
  onClose, 
  state, 
  updateOrderDetails, 
  updateOrderStatus, 
  updatePaymentStatus,
  appendItemToOrder,
  removeItemFromOrder,
  updateItemQuantity,
  appendCustomItemToOrder
}: { 
  order: Order, 
  onClose: () => void, 
  state: any,
  updateOrderDetails: (orderId: string, updates: Partial<Order>) => void,
  updateOrderStatus: (id: string, status: string) => void,
  updatePaymentStatus: (id: string, status: "pending" | "paid") => void,
  appendItemToOrder: (orderId: string, item: any) => void,
  removeItemFromOrder: (orderId: string, itemIndex: number) => void,
  updateItemQuantity: (orderId: string, itemIndex: number, newQty: number) => void,
  appendCustomItemToOrder: (orderId: string, name: string, price: number, qty: number) => void
}) {
  const [saleDate, setSaleDate] = useState(order.created_at ? new Date(order.created_at).toISOString().slice(0, 16) : "");
  const [orderType, setOrderType] = useState<"mesa" | "delivery" | "pickup">(order.type);
  const [tableRef, setTableRef] = useState(order.table_number || "");
  const [customerName, setCustomerName] = useState(order.customer_name || "");
  const [customerPhone, setCustomerPhone] = useState(order.customer_phone || "");
  const [customerAddress, setCustomerAddress] = useState(order.customer_address || "");
  const [paymentMethod, setPaymentMethod] = useState(order.payment_method || "");
  const [paymentDetails, setPaymentDetails] = useState(order.payment_details || "");
  const [paymentStatus, setPaymentStatus] = useState(order.payment_status || "pending");
  const [saleStatus, setSaleStatus] = useState(order.status);
  
  const [items, setItems] = useState<OrderItem[]>([...order.items]);
  const [discountId, setDiscountId] = useState<string | null>(order.discount_id || null);
  const [couponCode, setCouponCode] = useState(order.discount_code || "");

  const [addMode, setAddMode] = useState<"" | "menu" | "insumo" | "custom">("");
  const [newItemProductId, setNewItemProductId] = useState("");
  const [newItemQty, setNewItemQty] = useState(1);
  const [customItemName, setCustomItemName] = useState("");
  const [customItemPrice, setCustomItemPrice] = useState("");
  const [customItemQty, setCustomItemQty] = useState(1);

  const subtotal = items.reduce((acc, i) => acc + i.subtotal, 0);
  const activeDiscount = discountId ? state.discounts.find((d: any) => d.id === discountId) : null;
  const appliedCoupon = couponCode.trim() 
    ? state.discounts.find((d: any) => d.type === "coupon" && d.code === couponCode.trim() && d.is_active) 
    : null;

  const currentDiscount = appliedCoupon || activeDiscount;
  let discountAmount = 0;
  if (currentDiscount) {
    if (currentDiscount.type === "percent") discountAmount = subtotal * (currentDiscount.value / 100);
    else discountAmount = currentDiscount.value;
  }
  const newSubtotal = items.reduce((acc, i) => acc + i.subtotal, 0);
  const newTotal = Math.max(0, newSubtotal - discountAmount);
  const total = newTotal; // keeping for backward ref if needed but total is now calculated correctly

  const handleUpdateQuantity = (idx: number, newQty: number) => {
    if (newQty < 1) return;
    setItems(prev => {
      const next = [...prev];
      const item = next[idx];
      const unitPrice = item.quantity > 0 ? item.subtotal / item.quantity : item.subtotal;
      next[idx] = { ...item, quantity: newQty, subtotal: newQty * unitPrice };
      return next;
    });
  };

  const handleRemoveItem = (idx: number) => {
    if (window.confirm("¿Eliminar este item del pedido?")) {
      setItems(prev => prev.filter((_, i) => i !== idx));
    }
  };

  const handleAddProduct = () => {
    if (!newItemProductId) return;
    const product = state.products.find((p: any) => p.id === newItemProductId);
    if (!product) return;
    setItems(prev => [...prev, { 
      product_id: product.id, 
      product_name: product.name, 
      quantity: newItemQty, 
      subtotal: newItemQty * product.price 
    }]);
    setNewItemProductId("");
    setNewItemQty(1);
    setAddMode("");
  };

  const handleAddInsumo = () => {
    if (!newItemProductId) return;
    const ingId = newItemProductId.replace("ing_", "");
    const ing = state.ingredients.find((i: any) => i.id === ingId);
    if (!ing) return;
    setItems(prev => [...prev, { 
      product_id: `custom_ing_${ing.id}_${Date.now()}`, 
      product_name: `${ing.name} (extra)`, 
      quantity: newItemQty, 
      subtotal: newItemQty * ing.cost_per_unit 
    }]);
    setNewItemProductId("");
    setNewItemQty(1);
    setAddMode("");
  };

  const handleAddCustom = () => {
    if (!customItemName || !customItemPrice) return;
    setItems(prev => [...prev, { 
      product_id: `custom_${Date.now()}`, 
      product_name: customItemName, 
      quantity: customItemQty, 
      subtotal: customItemQty * Number(customItemPrice) 
    }]);
    setCustomItemName("");
    setCustomItemPrice("");
    setCustomItemQty(1);
    setAddMode("");
  };

  const handleSave = async () => {
    try {
      updateOrderDetails(order.id, {
        customer_name: customerName || undefined,
        customer_phone: customerPhone || undefined,
        customer_address: orderType === "delivery" ? customerAddress : undefined,
        table_number: orderType === "mesa" ? tableRef : undefined,
        type: orderType as any,
        payment_method: paymentMethod,
        payment_details: paymentDetails || undefined,
        created_at: saleDate ? new Date(saleDate).toISOString() : order.created_at,
        items: items,
        subtotal: newSubtotal,
        total: newTotal,
        discount_id: currentDiscount?.id || null,
        discount_amount: discountAmount,
      });

      if (saleStatus !== order.status) updateOrderStatus(order.id, saleStatus);
      if (paymentStatus !== order.payment_status) updatePaymentStatus(order.id, paymentStatus);

      alert("✅ Pedido actualizado correctamente.");
      onClose();
    } catch (e: any) {
      alert("❌ Error al actualizar: " + (e.message || "Error desconocido"));
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.75)",
      backdropFilter: "blur(6px)", display: "flex", alignItems: "center",
      justifyContent: "center", zIndex: 1200, padding: "1rem"
    }}>
      <div className="glass-panel" style={{
        width: "100%", maxWidth: "750px", maxHeight: "95vh", overflowY: "auto",
        padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem",
        border: "1px solid var(--accent-color)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--accent-color)" }}>✏️ Editar Pedido #{order.id.slice(-5).toUpperCase()}</h2>
          </div>
          <button onClick={onClose} style={{ fontSize: "1.5rem", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ backgroundColor: "var(--bg-secondary)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
          <h3 style={{ fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>📦 Datos del Pedido</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 600, marginBottom: "0.4rem" }}>Fecha y Hora</label>
              <input type="datetime-local" className="input-field" value={saleDate} onChange={e => setSaleDate(e.target.value)} style={{ fontSize: "0.85rem" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 600, marginBottom: "0.4rem" }}>Tipo Operación</label>
              <select className="input-field" value={orderType} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setOrderType(e.target.value as any)} style={{ fontSize: "0.85rem" }}>
                <option value="mesa">🍽️ Mesa Local</option>
                <option value="pickup">🛍️ Pick Up</option>
                <option value="delivery">🛵 Delivery</option>
              </select>
            </div>
            {orderType === "mesa" && (
              <div>
                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 600, marginBottom: "0.4rem" }}>Ref. Mesa</label>
                <input type="text" className="input-field" value={tableRef} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTableRef(e.target.value)} placeholder="Ej. Mesa 3" style={{ fontSize: "0.85rem" }} />
              </div>
            )}
            <div>
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 600, marginBottom: "0.4rem" }}>Estado Operativo</label>
              <select className="input-field" value={saleStatus} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSaleStatus(e.target.value)} style={{ fontSize: "0.85rem" }}>
                {[...(state.orderStatuses || [])].sort((a, b) => a.order - b.order).map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: "var(--bg-secondary)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
          <h3 style={{ fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>👤 Datos del Cliente</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 600, marginBottom: "0.4rem" }}>Nombre</label>
              <input type="text" className="input-field" value={customerName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomerName(e.target.value)} placeholder="Nombre del cliente" style={{ fontSize: "0.85rem" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 600, marginBottom: "0.4rem" }}>Teléfono</label>
              <input type="text" className="input-field" value={customerPhone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomerPhone(e.target.value)} placeholder="Ej: 9988-7766" style={{ fontSize: "0.85rem" }} />
            </div>
          </div>
          {orderType === "delivery" && (
            <div style={{ marginTop: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 600, marginBottom: "0.4rem" }}>Dirección *</label>
              <input type="text" className="input-field" value={customerAddress} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomerAddress(e.target.value)} placeholder="Dirección..." style={{ fontSize: "0.85rem" }} />
            </div>
          )}
        </div>

        <div style={{ backgroundColor: "var(--bg-secondary)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>🛒 Productos</h3>
            <div style={{ display: "flex", gap: "4px" }}>
              <button onClick={() => setAddMode(addMode === "menu" ? "" : "menu")} className="btn-primary" style={{ padding: "4px 10px", fontSize: "10px", backgroundColor: addMode === "menu" ? "var(--text-muted)" : "" }}>+ Platillo</button>
              <button onClick={() => setAddMode(addMode === "insumo" ? "" : "insumo")} className="btn-primary" style={{ padding: "4px 10px", fontSize: "10px", backgroundColor: addMode === "insumo" ? "var(--text-muted)" : "#7c3aed" }}>+ Insumo</button>
              <button onClick={() => setAddMode(addMode === "custom" ? "" : "custom")} className="btn-primary" style={{ padding: "4px 10px", fontSize: "10px", backgroundColor: addMode === "custom" ? "var(--text-muted)" : "#f59e0b" }}>+ Otro</button>
            </div>
          </div>

          {addMode === "menu" && (
            <div style={{ display: "flex", gap: "8px", marginBottom: "1rem", padding: "10px", background: "var(--bg-tertiary)", borderRadius: "var(--radius-md)" }}>
              <select className="input-field" style={{ flex: 1, fontSize: "0.85rem" }} value={newItemProductId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewItemProductId(e.target.value)}>
                <option value="">Seleccionar...</option>
                {state.products.map((p: any) => <option key={p.id} value={p.id}>{p.name} (L. {p.price})</option>)}
              </select>
              <input type="number" className="input-field" style={{ width: "60px", textAlign: "center" }} value={newItemQty} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewItemQty(Number(e.target.value))} />
              <button onClick={handleAddProduct} className="btn-primary">+</button>
            </div>
          )}
          {addMode === "insumo" && (
            <div style={{ display: "flex", gap: "8px", marginBottom: "1rem", padding: "10px", background: "var(--bg-tertiary)", borderRadius: "var(--radius-md)" }}>
              <select className="input-field" style={{ flex: 1, fontSize: "0.85rem" }} value={newItemProductId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewItemProductId(e.target.value)}>
                <option value="">Seleccionar insumo...</option>
                {state.ingredients.map((ing: any) => <option key={ing.id} value={`ing_${ing.id}`}>{ing.name} (L. {ing.cost_per_unit})</option>)}
              </select>
              <input type="number" className="input-field" style={{ width: "60px", textAlign: "center" }} value={newItemQty} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewItemQty(Number(e.target.value))} />
              <button onClick={handleAddInsumo} className="btn-primary" style={{ backgroundColor: "#7c3aed" }}>+</button>
            </div>
          )}
          {addMode === "custom" && (
            <div style={{ display: "flex", gap: "8px", marginBottom: "1rem", padding: "10px", background: "var(--bg-tertiary)", borderRadius: "var(--radius-md)" }}>
              <input className="input-field" style={{ flex: 2, fontSize: "0.85rem" }} placeholder="Descripción" value={customItemName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomItemName(e.target.value)} />
              <input type="number" className="input-field" style={{ flex: 1, fontSize: "0.85rem" }} placeholder="Precio" value={customItemPrice} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomItemPrice(e.target.value)} />
              <input type="number" className="input-field" style={{ width: "60px", textAlign: "center" }} value={customItemQty} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomItemQty(Number(e.target.value))} />
              <button onClick={handleAddCustom} className="btn-primary" style={{ backgroundColor: "#f59e0b" }}>+</button>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "200px", overflowY: "auto", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "0.5rem" }}>
            {items.map((item, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem", backgroundColor: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{item.product_name}</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{formatCurrency(item.quantity > 0 ? item.subtotal / item.quantity : 0)}/u</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <button onClick={() => handleUpdateQuantity(idx, item.quantity - 1)} style={{ background: "none", border: "1px solid var(--border-color)", color: "var(--text-primary)", width: "24px", borderRadius: "4px", cursor: "pointer" }}>-</button>
                  <span style={{ fontSize: "0.85rem", fontWeight: 800, minWidth: "20px", textAlign: "center" }}>{item.quantity}</span>
                  <button onClick={() => handleUpdateQuantity(idx, item.quantity + 1)} style={{ background: "none", border: "1px solid var(--border-color)", color: "var(--text-primary)", width: "24px", borderRadius: "4px", cursor: "pointer" }}>+</button>
                  <button onClick={() => handleRemoveItem(idx)} style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", marginLeft: "0.5rem" }}>🗑️</button>
                </div>
                <div style={{ width: "90px", textAlign: "right", fontWeight: 700, fontSize: "0.85rem", color: "var(--accent-color)" }}>{formatCurrency(item.subtotal)}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "right", marginTop: "0.8rem", fontWeight: 700, fontSize: "0.9rem", color: "var(--text-muted)" }}>Subtotal: {formatCurrency(subtotal)}</div>
        </div>

        <div style={{ backgroundColor: "var(--bg-secondary)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
          <h3 style={{ fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>🏷️ Descuentos</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 600, marginBottom: "0.4rem" }}>Descuento Directo</label>
              <select className="input-field" value={discountId || ""} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setDiscountId(e.target.value || null); if (e.target.value) setCouponCode(""); }} style={{ fontSize: "0.85rem" }}>
                <option value="">Sin descuento</option>
                {state.discounts.filter((d: any) => d.is_active && d.type !== "coupon").map((d: any) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.type === "percent" ? `${d.value}%` : `L. ${d.value}`})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 600, marginBottom: "0.4rem" }}>Código Cupón</label>
              <input type="text" className="input-field" value={couponCode} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setCouponCode(e.target.value.toUpperCase()); if (e.target.value) setDiscountId(null); }} placeholder="CUPON10" style={{ fontSize: "0.85rem" }} />
            </div>
          </div>
          {discountAmount > 0 && <div style={{ textAlign: "right", marginTop: "0.5rem", color: "#ef4444", fontWeight: 700, fontSize: "0.8rem" }}>Descuento: -{formatCurrency(discountAmount)}</div>}
        </div>

        <div style={{ backgroundColor: "var(--bg-secondary)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
          <h3 style={{ fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>💳 Pago</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", alignItems: "flex-end" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 600, marginBottom: "0.4rem" }}>Método</label>
              <select className="input-field" value={paymentMethod} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPaymentMethod(e.target.value)} style={{ fontSize: "0.85rem" }}>
                {state.paymentMethods.map((pm: any) => <option key={pm.id} value={pm.id}>{pm.icon} {pm.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 600, marginBottom: "0.4rem" }}>Referencia</label>
              <input type="text" className="input-field" value={paymentDetails} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPaymentDetails(e.target.value)} placeholder="Detalles de pago" style={{ fontSize: "0.85rem" }} />
            </div>
            <button 
              onClick={() => setPaymentStatus(paymentStatus === "paid" ? "pending" : "paid")}
              style={{
                padding: "5px 14px",
                borderRadius: "100px",
                border: "none",
                cursor: "pointer",
                fontWeight: 800,
                fontSize: "12px",
                backgroundColor: paymentStatus === "paid" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.1)",
                color: paymentStatus === "paid" ? "#16a34a" : "#ef4444",
                boxShadow: paymentStatus === "paid" ? "0 0 0 1px rgba(34,197,94,0.3)" : "0 0 0 1px rgba(239,68,68,0.3)"
              }}
            >
              {paymentStatus === "paid" ? "✅ PAGADO" : "● PENDIENTE"}
            </button>
          </div>
        </div>

        <div style={{ marginTop: "auto", borderTop: "2px solid var(--border-color)", paddingTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Total Final:</div>
            <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--accent-color)" }}>{formatCurrency(total)}</div>
          </div>
          <div style={{ display: "flex", gap: "0.8rem" }}>
            <button onClick={onClose} className="btn-secondary" style={{ padding: "0.7rem 1.2rem" }}>Cancelar</button>
            <button onClick={handleSave} className="btn-primary" style={{ padding: "0.7rem 2rem", fontSize: "0.95rem", fontWeight: 900 }}>💾 Guardar Cambios</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OrdersDashboard() {
  const { state, hydrated, updateOrderStatus, updatePaymentStatus, 
    appendItemToOrder, removeItemFromOrder, updateItemQuantity,
    updateOrderDetails, appendCustomItemToOrder, removeOrder, signOut } = useAppState();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "mesa" | "delivery" | "pickup">("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDateStart, setFilterDateStart] = useState<string>("");
  const [filterDateEnd, setFilterDateEnd] = useState<string>("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [showManualSaleModal, setShowManualSaleModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [currentTab, setCurrentTab] = useState<"active" | "completed" | "cancelled">("active");

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
      if (currentTab === "active") { 
        const isDone = state.orderStatuses.find(s => s.id === order.status)?.category === "done";
        const isCancelled = state.orderStatuses.find(s => s.id === order.status)?.category === "cancelled" || order.status === "cancelled";
        if (isDone || isCancelled) return false;
      } else if (currentTab === "completed") {
        const isDone = state.orderStatuses.find(s => s.id === order.status)?.category === "done";
        if (!isDone) return false;
      } else if (currentTab === "cancelled") {
        const isCancelled = state.orderStatuses.find(s => s.id === order.status)?.category === "cancelled" || order.status === "cancelled";
        if (!isCancelled) return false;
      }
      return true;
    });
  }, [state.orders, searchTerm, filterType, filterStatus, filterDateStart, filterDateEnd, currentTab, hydrated]);

  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [filteredOrders]);

  const summaryMetrics = useMemo(() => {
    const currentOrders = sortedOrders;
    const totalCollected = currentOrders.reduce((acc, o) => acc + o.total, 0);
    const deliveryCount = currentOrders.filter(o => o.type === "delivery").length;
    const pickupMesaCount = currentOrders.filter(o => o.type !== "delivery").length;
    return {
      totalCollected,
      count: currentOrders.length,
      deliveryCount,
      pickupMesaCount
    };
  }, [sortedOrders]);


  const getStatusBadge = (statusId: string) => {
    const s = (state.orderStatuses || []).find(s => s.id === statusId);
    if (!s) return <span>{statusId}</span>;
    return <span style={{ padding: "0.25rem 0.75rem", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 700, backgroundColor: s.color.startsWith('var(') ? s.color : `${s.color}20`, color: s.color.startsWith('var(') ? 'white' : s.color, border: s.color.startsWith('var(') ? 'none' : `1px solid ${s.color}` }}>{s.label}</span>;
  };

  const getPaymentName = (method?: string, details?: string) => {
    const pm = (state.paymentMethods || []).find(p => p.id === method);
    return (pm ? `${pm.icon} ${pm.label}` : (method || "No esp.")) + (details ? ` (${details})` : "");
  };

  const generateWhatsAppLink = (order: any) => {
    const cleanPhone = order.customer_phone ? order.customer_phone.replace(/[^\d]/g, "") : "";
    const date = new Date(order.created_at).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const itemsText = order.items
      .map((item: any) => `• x${item.quantity} ${item.product_name} ........... L. ${item.subtotal.toFixed(2)}`)
      .join("\n");

    const paymentMethodName = getPaymentName(order.payment_method, order.payment_details);
    const paymentStatusText = (order.payment_status || "pending") === "paid" ? "PAGADO" : "PENDIENTE";

    let message = `🔥 *BRASA CLANDESTINA*\n`;
    message += `📋 Factura TKT #${order.id.slice(-5).toUpperCase()}\n`;
    message += `📅 ${date}\n`;
    message += `━━━━━━━━━━━━━━━━━━━\n`;
    message += `👤 Cliente: ${order.customer_name || "Walk-in"}\n`;
    message += `📞 Tel: ${order.customer_phone || "—"}\n`;
    message += `📍 Tipo: ${order.type.toUpperCase()}\n`;
    if (order.type === "delivery" && order.customer_address) {
      message += `🏠 Dirección: ${order.customer_address}\n`;
    }
    message += `━━━━━━━━━━━━━━━━━━━\n`;
    message += `🛒 *DETALLE DEL PEDIDO:*\n`;
    message += `${itemsText}\n`;
    message += `━━━━━━━━━━━━━━━━━━━\n`;
    if (order.discount_amount > 0) {
      message += `🏷️ Descuento: -L. ${order.discount_amount.toFixed(2)}\n`;
    }
    message += `💰 *TOTAL: L. ${order.total.toFixed(2)}*\n`;
    message += `━━━━━━━━━━━━━━━━━━━\n`;
    message += `💳 Pago: ${paymentMethodName}\n`;
    message += `✅ Estado: ${paymentStatusText}\n`;
    message += `━━━━━━━━━━━━━━━━━━━\n`;
    message += `¡Gracias por tu pedido! 🙌🔥`;

    const encodedMessage = encodeURIComponent(message);
    return cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encodedMessage}` 
      : `https://wa.me/?text=${encodedMessage}`;
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

  const exportToExcel = () => {
    const data = sortedOrders.map(o => ({
      "TKT #": "#" + o.id.slice(-5).toUpperCase(),
      "Fecha": new Date(o.created_at).toLocaleString("es-HN"),
      "Cliente": o.customer_name || "Sin nombre",
      "Teléfono": o.customer_phone || "",
      "Tipo": o.type === "delivery" ? "Delivery" : o.type === "mesa" ? "Mesa" : "Pickup",
      "Método de Pago": getPaymentName(o.payment_method, o.payment_details),
      "Estado Pago": (o.payment_status || "pending") === "paid" ? "Pagado" : "Pendiente",
      "Estado": (state.orderStatuses || []).find(s => s.id === o.status)?.label || o.status,
      "Items": o.items.map(i => `x${i.quantity} ${i.product_name}`).join(", "),
      "Total (L)": o.total.toFixed(2)
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ventas");
    const colWidths = [12, 18, 20, 14, 10, 18, 12, 20, 40, 12];
    ws["!cols"] = colWidths.map(w => ({ wch: w }));
    XLSX.writeFile(wb, `ventas_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const exportToPDF = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    const rows = sortedOrders.map(o => `
      <tr>
        <td>#${o.id.slice(-5).toUpperCase()}</td>
        <td>${new Date(o.created_at).toLocaleString("es-HN")}</td>
        <td>${o.customer_name || "—"}</td>
        <td>${o.type === "delivery" ? "Delivery" : o.type === "mesa" ? "Mesa" : "Pickup"}</td>
        <td>${getPaymentName(o.payment_method, o.payment_details)}</td>
        <td style="color:${(o.payment_status||"pending")==="paid"?"green":"red"}">${(o.payment_status||"pending")==="paid"?"✓ Pagado":"● Pendiente"}</td>
        <td style="font-weight:bold;color:#E8603C">L. ${o.total.toFixed(2)}</td>
      </tr>
    `).join("");
    const total = sortedOrders.reduce((a, o) => a + o.total, 0);
    win.document.write(`
      <!DOCTYPE html><html><head>
      <meta charset="utf-8">
      <title>Reporte de Ventas — Brasa Clandestina</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; font-size: 12px; }
        h1 { font-size: 20px; color: #E8603C; margin-bottom: 4px; }
        p { color: #666; margin: 0 0 16px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #E8603C; color: white; padding: 8px 6px; text-align: left; font-size: 10px; text-transform: uppercase; }
        td { padding: 7px 6px; border-bottom: 1px solid #eee; }
        tr:nth-child(even) td { background: #fafafa; }
        .total { text-align: right; font-size: 14px; font-weight: bold; margin-top: 12px; color: #E8603C; }
        @media print { body { padding: 0; } }
      </style></head><body>
      <h1>Brasa Clandestina — Reporte de Ventas</h1>
      <p>Generado: ${new Date().toLocaleString("es-HN")} · ${sortedOrders.length} órdenes</p>
      <table>
        <thead><tr>
          <th>TKT</th><th>Fecha</th><th>Cliente</th><th>Tipo</th>
          <th>Pago</th><th>Estado Pago</th><th>Total</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="total">Total: L. ${total.toFixed(2)}</div>
      <script>window.onload=()=>{window.print();}</script>
      </body></html>
    `);
    win.document.close();
  };

  const exportToWord = () => {
    const rows = sortedOrders.map(o => `
      <tr>
        <td>#${o.id.slice(-5).toUpperCase()}</td>
        <td>${new Date(o.created_at).toLocaleString("es-HN")}</td>
        <td>${o.customer_name || "—"}</td>
        <td>${o.type === "delivery" ? "Delivery" : o.type === "mesa" ? "Mesa" : "Pickup"}</td>
        <td>${getPaymentName(o.payment_method, o.payment_details)}</td>
        <td>${(o.payment_status||"pending")==="paid"?"Pagado":"Pendiente"}</td>
        <td>L. ${o.total.toFixed(2)}</td>
      </tr>
    `).join("");
    const total = sortedOrders.reduce((a, o) => a + o.total, 0);
    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" 
            xmlns:w="urn:schemas-microsoft-com:office:word">
      <head><meta charset="utf-8">
      <style>
        body { font-family: Arial; font-size: 11pt; }
        h1 { font-size: 16pt; color: #E8603C; }
        table { border-collapse: collapse; width: 100%; }
        th { background: #E8603C; color: white; padding: 6px; font-size: 9pt; }
        td { padding: 5px; border: 1px solid #ddd; font-size: 9pt; }
        .total { font-weight: bold; font-size: 12pt; color: #E8603C; text-align: right; }
      </style></head><body>
      <h1>Brasa Clandestina — Reporte de Ventas</h1>
      <p>Generado: ${new Date().toLocaleString("es-HN")} · ${sortedOrders.length} órdenes</p>
      <table>
        <thead><tr>
          <th>TKT</th><th>Fecha</th><th>Cliente</th><th>Tipo</th>
          <th>Pago</th><th>Estado Pago</th><th>Total</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p class="total">Total recaudado: L. ${total.toFixed(2)}</p>
      </body></html>
    `;
    const blob = new Blob(["\ufeff", html], { type: "application/msword" });
    saveAs(blob, `ventas_${new Date().toISOString().split("T")[0]}.doc`);

  };

  return (
    <AuthGuard allowedRoles={["admin"]}>
      {showManualSaleModal && <ManualSaleModal onClose={() => setShowManualSaleModal(false)} />}
      {editingOrder && (
        <EditOrderModal
          order={editingOrder}
          onClose={() => setEditingOrder(null)}
          state={state}
          updateOrderDetails={updateOrderDetails}
          updateOrderStatus={updateOrderStatus}
          updatePaymentStatus={updatePaymentStatus}
          appendItemToOrder={appendItemToOrder}
          removeItemFromOrder={removeItemFromOrder}
          updateItemQuantity={updateItemQuantity}
          appendCustomItemToOrder={appendCustomItemToOrder}
        />
      )}

      <div className="admin-layout">
        <Sidebar />

        <main className="main-content-responsive">
          <header style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h1 style={{ fontSize: "clamp(1.5rem, 5vw, 2rem)", fontWeight: 700 }}>Ventas</h1>
              <p style={{ color: "var(--text-muted)", marginTop: "0.5rem", fontSize: "0.9rem" }}>Registro centralizado de operaciones.</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                <button onClick={exportToPDF}
                  style={{ padding: "0.5rem 0.875rem", background: "#dc2626", color: "white", 
                    border: "none", borderRadius: "var(--radius-sm)", fontWeight: 700, 
                    fontSize: "0.78rem", cursor: "pointer" }}
                  title="Exportar a PDF">
                  📄 PDF
                </button>
                <button onClick={exportToExcel}
                  style={{ padding: "0.5rem 0.875rem", background: "#16a34a", color: "white", 
                    border: "none", borderRadius: "var(--radius-sm)", fontWeight: 700, 
                    fontSize: "0.78rem", cursor: "pointer" }}
                  title="Exportar a Excel">
                  📊 Excel
                </button>
                <button onClick={exportToWord}
                  style={{ padding: "0.5rem 0.875rem", background: "#2563eb", color: "white", 
                    border: "none", borderRadius: "var(--radius-sm)", fontWeight: 700, 
                    fontSize: "0.78rem", cursor: "pointer" }}
                  title="Exportar a Word">
                  📝 Word
                </button>
              </div>
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
              <div style={metricValueStyle}>{summaryMetrics.count}</div>
              <div style={metricLabelStyle}>
                {currentTab === "active" ? "Pedidos Activos" : 
                 currentTab === "completed" ? "Pedidos Completos" : 
                 "Pedidos Cancelados"}
              </div>
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
            <button 
              onClick={() => setCurrentTab("completed")}
              style={{
                flex: 1, padding: "0.875rem",
                fontWeight: currentTab === "completed" ? 800 : 600,
                fontSize: "0.9rem", cursor: "pointer", border: "none",
                borderRadius: "var(--radius-md)",
                background: currentTab === "completed" 
                  ? "linear-gradient(135deg, #22c55e, #16a34a)" 
                  : "transparent",
                color: currentTab === "completed" ? "white" : "var(--text-muted)",
                transition: "all 200ms"
              }}
            >
              ✅ Completadas
            </button>
            <button onClick={() => setCurrentTab("cancelled")} style={{ flex: 1, padding: "0.6rem", borderRadius: "var(--radius-md)", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", backgroundColor: currentTab === "cancelled" ? "#ef4444" : "var(--bg-secondary)", color: currentTab === "cancelled" ? "white" : "var(--text-muted)", border: "1px solid var(--border-color)" }}>Canceladas</button>
          </div>

          {/* Filters Section (Pill Style) */}
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "2rem", flexWrap: "wrap", alignItems: "center" }}>
            {/* Search Pill */}
            <div style={{ position: "relative", flex: "1 1 240px", minWidth: "200px" }}>
              <span style={{ position: "absolute", left: "1.1rem", top: "50%", transform: "translateY(-50%)", fontSize: "1rem", pointerEvents: "none" }}>🔍</span>
              <input 
                type="text" 
                placeholder="Buscar por ID, cliente o teléfono..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem 0.75rem 2.8rem",
                  borderRadius: "100px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-secondary)",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  outline: "none",
                  transition: "all 0.2s",
                  boxShadow: searchTerm ? "0 0 0 2px rgba(232,96,60,0.15)" : "none",
                  borderColor: searchTerm ? "var(--accent-color)" : "var(--border-color)"
                }}
              />
            </div>

            {/* Type Pill */}
            <div style={{ position: "relative" }}>
              <select 
                value={filterType} 
                onChange={e => setFilterType(e.target.value as any)}
                style={{
                  padding: "0.75rem 2rem 0.75rem 1.25rem",
                  borderRadius: "100px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: filterType !== "all" ? "var(--accent-color)" : "var(--bg-secondary)",
                  color: filterType !== "all" ? "white" : "var(--text-primary)",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  outline: "none",
                  appearance: "none",
                  minWidth: "130px",
                  transition: "all 0.2s"
                }}
              >
                <option value="all">🏷️ Tipo: Todos</option>
                <option value="mesa">🍽️ Mesa</option>
                <option value="pickup">🛍️ Pick Up</option>
                <option value="delivery">🛵 Delivery</option>
              </select>
              <span style={{ position: "absolute", right: "0.8rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: "0.6rem", color: filterType !== "all" ? "white" : "var(--text-muted)" }}>▼</span>
            </div>

            {/* Status Pill */}
            <div style={{ position: "relative" }}>
              <select 
                value={filterStatus} 
                onChange={e => setFilterStatus(e.target.value)}
                style={{
                  padding: "0.75rem 2rem 0.75rem 1.25rem",
                  borderRadius: "100px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: filterStatus !== "all" ? "var(--accent-color)" : "var(--bg-secondary)",
                  color: filterStatus !== "all" ? "white" : "var(--text-primary)",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  outline: "none",
                  appearance: "none",
                  minWidth: "150px",
                  transition: "all 0.2s"
                }}
              >
                <option value="all">⚙️ Estado: Todos</option>
                {[...(state.orderStatuses || [])].sort((a, b) => a.order - b.order).map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
              <span style={{ position: "absolute", right: "0.8rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: "0.6rem", color: filterStatus !== "all" ? "white" : "var(--text-muted)" }}>▼</span>
            </div>

            {/* Date Start Pill */}
            <div style={{ position: "relative" }}>
              <input 
                type="date" 
                value={filterDateStart} 
                onChange={e => setFilterDateStart(e.target.value)}
                style={{
                  padding: "0.75rem 1.25rem",
                  borderRadius: "100px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: filterDateStart ? "var(--accent-color)" : "var(--bg-secondary)",
                  color: filterDateStart ? "white" : "var(--text-primary)",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  outline: "none",
                  transition: "all 0.2s"
                }}
              />
              {!filterDateStart && <span style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: "0.6rem", color: "var(--text-muted)", fontWeight: 800 }}>DESDE</span>}
            </div>

            {/* Date End Pill */}
            <div style={{ position: "relative" }}>
              <input 
                type="date" 
                value={filterDateEnd} 
                onChange={e => setFilterDateEnd(e.target.value)}
                style={{
                  padding: "0.75rem 1.25rem",
                  borderRadius: "100px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: filterDateEnd ? "var(--accent-color)" : "var(--bg-secondary)",
                  color: filterDateEnd ? "white" : "var(--text-primary)",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  outline: "none",
                  transition: "all 0.2s"
                }}
              />
              {!filterDateEnd && <span style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: "0.6rem", color: "var(--text-muted)", fontWeight: 800 }}>HASTA</span>}
            </div>
            
            {(searchTerm || filterType !== "all" || filterStatus !== "all" || filterDateStart || filterDateEnd) && (
              <button 
                onClick={() => {
                  setSearchTerm("");
                  setFilterType("all");
                  setFilterStatus("all");
                  setFilterDateStart("");
                  setFilterDateEnd("");
                }}
                style={{
                  padding: "0.6rem 1.25rem",
                  borderRadius: "100px",
                  border: "none",
                  background: "rgba(239, 68, 68, 0.12)",
                  color: "#ef4444",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseOver={e => e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)"}
                onMouseOut={e => e.currentTarget.style.background = "rgba(239, 68, 68, 0.12)"}
              >
                ✕ Limpiar Filtros
              </button>
            )}
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
                  <th style={{ padding: "0.75rem 1rem", textAlign: "center" }}>Estado</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Total (L)</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "center" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedOrders.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>No se encontraron registros de ventas con estos filtros.</td></tr>
                ) : (
                  sortedOrders.map((order, idx) => (<React.Fragment key={`${order.id}-${idx}`}>
                    <tr 
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
                      <td style={{ padding: "1rem", cursor: "pointer" }} onClick={(e) => {
                        e.stopPropagation();
                        setExpandedOrderId(expandedOrderId === order.id ? null : order.id);
                      }}>
                        <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{order.customer_name || 'Walk-in / Mesa'}</div>
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
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "center" }}>
                          {getStatusBadge(order.status)}
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
                      </div>
                    </td>
                      <td style={{ padding: "0.75rem 1rem", fontWeight: 800, textAlign: "right", color: "var(--accent-color)", whiteSpace: "nowrap" }}>{formatCurrency(order.total)}</td>
                      
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
                              onClick={e => { 
                                e.stopPropagation(); 
                                setEditingOrder(order);
                              }}
                              style={{ 
                                background: "transparent", border: "none", 
                                cursor: "pointer", fontSize: "1rem",
                                flexShrink: 0,
                                padding: "4px 8px",
                                borderRadius: "6px",
                                color: "var(--accent-color)"
                              }}
                              title="Editar pedido"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={e => { 
                                e.stopPropagation(); 
                                window.open(generateWhatsAppLink(order), "_blank");
                              }}
                              style={{ 
                                background: "transparent", border: "none", 
                                cursor: "pointer", fontSize: "1rem",
                                flexShrink: 0,
                                padding: "4px 8px",
                                borderRadius: "6px",
                                color: "#25D366"
                              }}
                              title="Enviar factura por WhatsApp"
                            >
                              📲
                            </button>
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
                    {expandedOrderId === order.id && (
                      <tr style={{ background: "var(--bg-secondary)" }}>
                        <td colSpan={8} style={{ padding: "0.75rem 1.5rem" }}>
                          <div style={{ 
                            display: "flex", flexWrap: "wrap", gap: "8px",
                            alignItems: "center"
                          }}>
                            <span style={{ 
                              fontSize: "0.7rem", fontWeight: 700, 
                              color: "var(--text-muted)", 
                              textTransform: "uppercase"
                            }}>
                              Composición:
                            </span>
                            {order.items.map((item, idx) => (
                              <span key={idx} style={{
                                padding: "3px 10px",
                                background: "var(--bg-tertiary)",
                                borderRadius: "100px",
                                fontSize: "12px",
                                fontWeight: 600,
                                border: "1px solid var(--border-color)"
                              }}>
                                x{item.quantity} {item.product_name} — {formatCurrency(item.subtotal)}
                              </span>
                            ))}
                            <span style={{ 
                              fontWeight: 800, color: "var(--accent-color)",
                              fontSize: "12px", marginLeft: "auto"
                            }}>
                              Total: {formatCurrency(order.total)}
                            </span>
                          </div>
                        </td>
                      </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>

        {/* Order Detail Modal */}
        {selectedOrderId && (
          <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => { setSelectedOrderId(null); setAddMode(""); }}
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
                  <React.Fragment>

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
                      <button onClick={() => { setSelectedOrderId(null); setAddMode(""); }}
                        style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--text-muted)" }}>✕</button>
                    </div>

                    {/* ── Datos del cliente ── */}

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
                  </React.Fragment>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
