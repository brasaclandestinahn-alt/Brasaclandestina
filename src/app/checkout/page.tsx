"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/lib/useStore";

const C = "#E8603C";
const fmt = (n: number) => `L. ${n.toFixed(2)}`;

type Step = "form" | "confirm";
type PayMethod = "efectivo" | "tarjeta" | "transferencia";
type OrderType = "delivery" | "pickup";

export default function CheckoutPage() {
  const { state, addOrder, clearCart, getCartTotal } = useAppState();
  const router = useRouter();
  const cart = state.cart;
  const subtotal = getCartTotal();
  const isv = subtotal * 0.15;
  const total = subtotal + isv;

  const [step, setStep] = useState<Step>("form");
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState("");

  // Form fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [payMethod, setPayMethod] = useState<PayMethod>("efectivo");
  const [orderType, setOrderType] = useState<OrderType>("delivery");

  const canSubmit = name.trim().length > 1 && phone.trim().length > 7 && cart.length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    const id = "BC-" + Date.now().toString().slice(-6);
    const order = {
      id,
      customer_name: name.trim(),
      customer_phone: phone.trim(),
      customer_address: address.trim() || undefined,
      type: orderType as "delivery" | "pickup",
      status: "pending",
      payment_method: payMethod,
      payment_details: notes.trim() || undefined,
      items: cart.map(i => ({
        product_id: i.id,
        product_name: i.name,
        quantity: i.quantity,
        subtotal: i.price * i.quantity,
      })),
      total,
      created_at: new Date().toISOString(),
    };
    try {
      addOrder(order);
      setOrderId(id);
      setStep("confirm");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const sendWhatsApp = () => {
    const lines = cart.map(i => `• ${i.quantity}x ${i.name} — ${fmt(i.price * i.quantity)}`).join("\n");
    const num = (state.config?.whatsapp_number || "50499999999").replace(/\D/g, "");
    const msg = `🔥 *Pedido ${orderId}*\n👤 ${name} · ${phone}\n${address ? `📍 ${address}\n` : ""}💳 ${payMethod}\n\n${lines}\n\n💰 Total: ${fmt(total)}${notes ? `\n📝 ${notes}` : ""}`;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleDone = () => {
    clearCart();
    router.push("/menu");
  };

  const inputStyle = {
    width: "100%", boxSizing: "border-box" as const,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10, padding: "12px 16px",
    color: "#fff", fontSize: 15, outline: "none",
    fontFamily: "inherit", transition: "border-color 180ms",
  };
  const labelStyle = {
    display: "block", color: "rgba(255,255,255,0.5)",
    fontSize: 11, fontWeight: 700 as const,
    letterSpacing: "0.08em", marginBottom: 6, textTransform: "uppercase" as const,
  };

  if (cart.length === 0 && step === "form") {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, color: "#fff" }}>
        <span style={{ fontSize: 48 }}>🛒</span>
        <p style={{ fontSize: 18, fontWeight: 700 }}>Tu carrito está vacío</p>
        <button onClick={() => router.push("/menu")} style={{ background: C, color: "#fff", border: "none", borderRadius: 10, padding: "12px 32px", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
          ← Volver al menú
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", fontFamily: "Inter, system-ui, sans-serif" }}>

      {/* ── Header ── */}
      <header style={{ position: "sticky", top: 0, background: "rgba(10,10,10,0.97)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.07)", zIndex: 100, padding: "0 24px", height: 60, display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={() => router.push("/menu")} style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 8, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", fontSize: 18, flexShrink: 0 }}>
          ←
        </button>
        <h1 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: "0.06em" }}>
          {step === "form" ? "FINALIZAR PEDIDO" : "¡PEDIDO CONFIRMADO!"}
        </h1>
        <div style={{ marginLeft: "auto", fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>
          🔥 Brasa Clandestina
        </div>
      </header>

      {step === "form" && (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px 80px", display: "grid", gridTemplateColumns: "1fr 340px", gap: 28 }} className="co-grid">

          {/* ── LEFT: Form ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Order type */}
            <div style={{ background: "#111", borderRadius: 14, padding: 20, border: "1px solid rgba(255,255,255,0.07)" }}>
              <p style={{ ...labelStyle, marginBottom: 12 }}>Tipo de pedido</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {([["delivery", "🛵 Delivery", "Te lo llevamos a tu puerta"], ["pickup", "🏃 Pickup", "Pasas a recoger al local"]] as [OrderType, string, string][]).map(([val, label, desc]) => (
                  <button key={val} onClick={() => setOrderType(val)} style={{ padding: "14px 12px", borderRadius: 10, border: `1px solid ${orderType === val ? C : "rgba(255,255,255,0.1)"}`, background: orderType === val ? `rgba(232,96,60,0.12)` : "rgba(255,255,255,0.03)", cursor: "pointer", textAlign: "left", transition: "all 150ms" }}>
                    <p style={{ margin: 0, color: "#fff", fontWeight: 700, fontSize: 14 }}>{label}</p>
                    <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Customer data */}
            <div style={{ background: "#111", borderRadius: 14, padding: 20, border: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", gap: 14 }}>
              <p style={{ ...labelStyle, marginBottom: 4 }}>Tus datos</p>
              {[
                { label: "NOMBRE COMPLETO *", val: name, set: setName, ph: "Juan Pérez", type: "text" },
                { label: "TELÉFONO *", val: phone, set: setPhone, ph: "+504 9999-9999", type: "tel" },
                { label: "DIRECCIÓN DE ENTREGA", val: address, set: setAddress, ph: "Col. Palmira, calle 3, casa 12…", type: "text" },
              ].map(f => (
                <div key={f.label}>
                  <label style={labelStyle}>{f.label}</label>
                  <input
                    type={f.type} value={f.val}
                    onChange={e => f.set(e.target.value)}
                    placeholder={f.ph}
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = C; e.target.style.background = "rgba(255,255,255,0.09)"; }}
                    onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.12)"; e.target.style.background = "rgba(255,255,255,0.06)"; }}
                  />
                </div>
              ))}
              <div>
                <label style={labelStyle}>NOTAS PARA COCINA</label>
                <textarea
                  value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Ej: Sin cebolla, bien cocido, salsa aparte…"
                  rows={3}
                  style={{ ...inputStyle, resize: "none" }}
                  onFocus={e => { e.target.style.borderColor = C; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.12)"; }}
                />
              </div>
            </div>

            {/* Payment */}
            <div style={{ background: "#111", borderRadius: 14, padding: 20, border: "1px solid rgba(255,255,255,0.07)" }}>
              <p style={{ ...labelStyle, marginBottom: 12 }}>Método de pago</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                {([["efectivo", "💵", "Efectivo"], ["tarjeta", "💳", "Tarjeta"], ["transferencia", "📱", "Transferencia"]] as [PayMethod, string, string][]).map(([val, icon, label]) => (
                  <button key={val} onClick={() => setPayMethod(val)} style={{ padding: "12px 8px", borderRadius: 10, border: `1px solid ${payMethod === val ? C : "rgba(255,255,255,0.1)"}`, background: payMethod === val ? `rgba(232,96,60,0.12)` : "rgba(255,255,255,0.03)", cursor: "pointer", transition: "all 150ms", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 22 }}>{icon}</span>
                    <span style={{ color: payMethod === val ? C : "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 700 }}>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Order summary ── */}
          <div style={{ position: "sticky", top: 76, height: "fit-content" }}>
            <div style={{ background: "#111", borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: "0.1em", color: "rgba(255,255,255,0.5)" }}>RESUMEN DEL PEDIDO</p>
              </div>
              <div style={{ maxHeight: 280, overflowY: "auto", padding: "8px 0" }}>
                {cart.map(item => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 18px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</p>
                      <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>× {item.quantity}</p>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C, flexShrink: 0, marginLeft: 8 }}>{fmt(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div style={{ padding: "12px 18px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                {[["Subtotal", fmt(subtotal)], ["ISV (15%)", fmt(isv)], ["Delivery", "A coordinar"]].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                    <span>{l}</span><span>{v}</span>
                  </div>
                ))}
                <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "10px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>TOTAL</span>
                  <span style={{ fontSize: 20, fontWeight: 900, color: C }}>{fmt(total)}</span>
                </div>
              </div>
              <div style={{ padding: "0 18px 18px" }}>
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit || loading}
                  style={{ width: "100%", height: 50, background: canSubmit && !loading ? C : "rgba(255,255,255,0.1)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 800, fontSize: 14, letterSpacing: "0.06em", cursor: canSubmit && !loading ? "pointer" : "not-allowed", opacity: canSubmit && !loading ? 1 : 0.5, transition: "all 150ms", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  {loading ? "Registrando…" : "🔥 CONFIRMAR PEDIDO"}
                </button>
                {!canSubmit && (
                  <p style={{ margin: "8px 0 0", fontSize: 11, color: "rgba(255,255,255,0.3)", textAlign: "center" }}>
                    {cart.length === 0 ? "El carrito está vacío" : "Completa nombre y teléfono"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIRMATION ── */}
      {step === "confirm" && (
        <div style={{ maxWidth: 520, margin: "60px auto", padding: "0 20px 80px" }}>
          <div style={{ background: "#111", borderRadius: 20, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden", textAlign: "center" }}>
            <div style={{ padding: "40px 32px 24px" }}>
              {/* Animated check */}
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(45,159,107,0.15)", border: "2px solid #2D9F6B", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 32 }}>✓</div>
              <h2 style={{ color: "#fff", fontSize: 24, fontWeight: 900, margin: "0 0 6px", fontFamily: "'Playfair Display', serif" }}>¡Pedido registrado! 🔥</h2>
              <p style={{ color: C, fontWeight: 900, fontSize: 16, margin: "0 0 6px" }}>#{orderId}</p>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, margin: "0 0 24px", lineHeight: 1.6 }}>
                Tu pedido quedó guardado. Puedes confirmarlo por WhatsApp para atención inmediata, o simplemente esperar — ya lo tenemos registrado.
              </p>
              
              {/* Summary */}
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "12px 16px", marginBottom: 16, textAlign: "left" }}>
                <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em" }}>👤 {name} · {phone}</p>
                {address && <p style={{ margin: "0 0 10px", fontSize: 11, color: "rgba(255,255,255,0.35)" }}>📍 {address}</p>}
                {cart.map(i => (
                  <div key={i.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,0.6)", paddingBottom: 4 }}>
                    <span>{i.quantity}× {i.name}</span>
                    <span>{fmt(i.price * i.quantity)}</span>
                  </div>
                ))}
                <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "8px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 800, color: "#fff" }}>
                  <span>Total</span><span style={{ color: C }}>{fmt(total)}</span>
                </div>
              </div>
              <p style={{ color: C, fontWeight: 700, fontSize: 13, margin: "0 0 0px" }}>⏱ Entrega estimada: 35–45 min</p>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 24px 28px" }}>
              <button 
                onClick={() => { sendWhatsApp(); handleDone(); }} 
                style={{ width: "100%", height: 54, background: "#25D366", color: "#fff", border: "none", borderRadius: 12, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}
              >
                <span style={{ fontWeight: 800, fontSize: 14 }}>💬 Confirmar por WhatsApp</span>
                <span style={{ fontSize: 11, opacity: 0.8, fontWeight: 500 }}>Respuesta inmediata · Recomendado</span>
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0" }}>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.15)" }} />
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.15)", fontWeight: 700 }}>— o —</span>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.15)" }} />
              </div>

              <button 
                onClick={handleDone} 
                style={{ width: "100%", height: 48, background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, color: "rgba(255,255,255,0.6)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}
              >
                <span style={{ fontWeight: 700, fontSize: 13 }}>✓ Listo, mi pedido ya está registrado</span>
                <span style={{ fontSize: 11, opacity: 0.6 }}>Lo procesaremos en el orden recibido</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .co-grid { grid-template-columns: 1fr !important; }
        }
        * { box-sizing: border-box; }
        body { margin: 0; background: #0a0a0a; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 4px; }
      `}</style>
    </div>
  );
}
