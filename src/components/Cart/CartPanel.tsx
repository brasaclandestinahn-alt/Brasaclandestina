"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/lib/useStore";

type Step = "cart" | "choose" | "form" | "confirm";
type PayMethod = "efectivo" | "transferencia";

const C = "#E8603C";

const fmt = (n: number) => `L. ${n.toFixed(2)}`;

export default function CartPanel() {
  const { state, updateQuantity, removeFromCart, clearCart, getCartTotal } = useAppState();
  const cart = state.cart;
  const subtotal = getCartTotal();
  const tax = 0; // included or 0 as per brand
  const total = subtotal + tax;

  const [step, setStep] = useState<Step>("cart");
  const [notes, setNotes] = useState("");
  const [notesOpen, setNotesOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [payMethod, setPayMethod] = useState<PayMethod>("efectivo");
  const [orderNum] = useState(() => "BC-" + Date.now().toString().slice(-6));

  const canConfirm = name.trim().length > 0 && phone.trim().length > 0;

  const sendWhatsApp = useCallback(() => {
    const lines = cart.map(i => `• ${i.quantity}x ${i.name} — L. ${(i.price * i.quantity).toFixed(2)}`).join("\n");
    const msg = `Hola Brasa Clandestina 🔥\n\nPedido #${orderNum}:\n${lines}\n\n💰 Total: ${fmt(total)}\n${notes ? `📝 ${notes}\n` : ""}¿Pueden confirmar?`;
    const num = (state.config?.whatsapp_number || "50499999999").replace(/\D/g, "");
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, "_blank");
    setStep("confirm");
  }, [cart, total, notes, orderNum, state.config]);

  const handleConfirmOnline = useCallback(() => {
    setStep("confirm");
  }, []);

  const handleClose = useCallback(() => {
    setStep("cart");
    clearCart();
  }, [clearCart]);

  // ── MODAL (steps: choose / form / confirm) ──────────────────────────
  const showModal = step !== "cart";

  return (
    <>
      {/* ═══ PANEL ═══ */}
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            <span style={{ color: "#fff", fontSize: 13, fontWeight: 800, letterSpacing: "0.1em" }}>DETALLE DE ORDEN</span>
          </div>
          {cart.length > 0 && (
            <button onClick={() => { if (window.confirm("¿Vaciar carrito?")) clearCart(); }} title="Vaciar" style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: 6, display: "flex" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" /></svg>
            </button>
          )}
        </div>

        {/* Item list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {cart.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", minHeight: 180, gap: 8, color: "rgba(255,255,255,0.25)" }}>
              <span style={{ fontSize: 40 }}>🛒</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Tu carrito está vacío</span>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <button onClick={() => removeFromCart(item.id)} style={{ width: 22, height: 22, borderRadius: "50%", background: "#ef4444", border: "none", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.03em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</p>
                  <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.category}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, overflow: "hidden", flexShrink: 0 }}>
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ width: 28, height: 28, background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                  <span style={{ minWidth: 22, textAlign: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ width: 28, height: 28, background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, color: C, flexShrink: 0, minWidth: 60, textAlign: "right" }}>{fmt(item.price * item.quantity)}</span>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{ flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.08)", padding: "12px 20px 16px" }}>
          {/* Notes accordion */}
          <button onClick={() => setNotesOpen(p => !p)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, background: "rgba(255,220,100,0.07)", border: "1px solid rgba(255,220,100,0.15)", borderRadius: 8, padding: "8px 12px", cursor: "pointer", marginBottom: 10, color: "#FFD83A", fontSize: 12, fontWeight: 600, textAlign: "left" }}>
            <span style={{ flex: 1 }}>💬 AGREGAR COMENTARIOS PARA COCINA</span>
            <span style={{ fontSize: 10 }}>{notesOpen ? "▲" : "▼"}</span>
          </button>
          {notesOpen && (
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ej: Sin cebolla, término medio…" rows={2} style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 12, outline: "none", resize: "none", marginBottom: 10, fontFamily: "inherit" }} />
          )}

          {/* Totals */}
          {[
            { label: "SUBTOTAL", value: fmt(subtotal) },
            { label: "DELIVERY", value: "A coordinar 🛵" },
            { label: "DESCUENTO", value: fmt(0) },
          ].map(r => (
            <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em" }}>{r.label}</span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{r.value}</span>
            </div>
          ))}
          <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "8px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.6)", letterSpacing: "0.08em" }}>TOTAL</span>
            <span style={{ fontSize: 18, fontWeight: 900, color: C }}>{fmt(total)}</span>
          </div>

          <button
            onClick={() => cart.length > 0 && setStep("choose")}
            disabled={cart.length === 0}
            style={{ width: "100%", height: 48, background: cart.length === 0 ? "rgba(255,255,255,0.08)" : C, color: "#fff", border: "none", borderRadius: 8, fontWeight: 800, fontSize: 13, letterSpacing: "0.08em", cursor: cart.length === 0 ? "not-allowed" : "pointer", opacity: cart.length === 0 ? 0.5 : 1, transition: "filter 150ms" }}
          >
            CONTINUAR PEDIDO →
          </button>
        </div>
      </div>

      {/* ═══ MODAL ═══ */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#1a1a1a", borderRadius: 20, padding: 32, maxWidth: 480, width: "100%", border: "1px solid rgba(255,255,255,0.1)", maxHeight: "90vh", overflowY: "auto" }}>

            {/* ── STEP: choose ── */}
            {step === "choose" && (
              <>
                <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>¿Cómo prefieres pedir?</h2>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, margin: "0 0 24px" }}>Elige la opción que más te convenga</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                  {/* WhatsApp */}
                  <button onClick={sendWhatsApp} style={{ background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.35)", borderRadius: 12, padding: "20px 16px", cursor: "pointer", textAlign: "left", transition: "border-color 150ms" }} onMouseOver={e => (e.currentTarget.style.borderColor = "rgba(37,211,102,0.7)")} onMouseOut={e => (e.currentTarget.style.borderColor = "rgba(37,211,102,0.35)")}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a13.1 13.1 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                    <p style={{ color: "#fff", fontWeight: 700, fontSize: 14, margin: "10px 0 4px" }}>WhatsApp</p>
                    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, margin: "0 0 8px", lineHeight: 1.4 }}>Rápido y directo. Te confirmamos en minutos.</p>
                    <span style={{ background: "rgba(37,211,102,0.2)", color: "#25D366", fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 100 }}>⚡ MÁS RÁPIDO</span>
                  </button>
                  {/* Online */}
                  <button onClick={() => setStep("form")} style={{ background: "rgba(232,96,60,0.08)", border: `1px solid rgba(232,96,60,0.35)`, borderRadius: 12, padding: "20px 16px", cursor: "pointer", textAlign: "left", transition: "border-color 150ms" }} onMouseOver={e => (e.currentTarget.style.borderColor = "rgba(232,96,60,0.7)")} onMouseOut={e => (e.currentTarget.style.borderColor = "rgba(232,96,60,0.35)")}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></svg>
                    <p style={{ color: "#fff", fontWeight: 700, fontSize: 14, margin: "10px 0 4px" }}>Pedido Online</p>
                    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, margin: "0 0 8px", lineHeight: 1.4 }}>Llena tus datos y recibe confirmación al celular.</p>
                    <span style={{ background: "rgba(232,96,60,0.2)", color: C, fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 100 }}>📋 CON REGISTRO</span>
                  </button>
                </div>
                <button onClick={() => setStep("cart")} style={{ width: "100%", background: "none", border: "none", color: C, fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "underline", textAlign: "center" }}>← Volver al carrito</button>
              </>
            )}

            {/* ── STEP: form ── */}
            {step === "form" && (
              <>
                <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 800, margin: "0 0 20px" }}>Tus datos de entrega</h2>
                {[
                  { label: "NOMBRE COMPLETO *", val: name, set: setName, ph: "Juan Pérez" },
                  { label: "TELÉFONO *", val: phone, set: setPhone, ph: "+504 9999-9999" },
                  { label: "DIRECCIÓN", val: address, set: setAddress, ph: "Col. Palmira, frente al parque…" },
                ].map(f => (
                  <div key={f.label} style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 6 }}>{f.label}</label>
                    <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "12px 16px", color: "#fff", fontSize: 15, outline: "none", fontFamily: "inherit" }} onFocus={e => { e.target.style.borderColor = "rgba(232,96,60,0.6)"; e.target.style.background = "rgba(255,255,255,0.08)"; }} onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.12)"; e.target.style.background = "rgba(255,255,255,0.06)"; }} />
                  </div>
                ))}

                <label style={{ display: "block", color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 10 }}>MÉTODO DE PAGO</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                  {(["efectivo", "transferencia"] as PayMethod[]).map(pm => (
                    <button key={pm} onClick={() => setPayMethod(pm)} style={{ padding: "12px 8px", borderRadius: 10, border: `1px solid ${payMethod === pm ? C : "rgba(255,255,255,0.12)"}`, background: payMethod === pm ? "rgba(232,96,60,0.12)" : "rgba(255,255,255,0.04)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 150ms" }}>
                      {pm === "efectivo" ? "💵 Efectivo" : "📱 Transferencia"}
                    </button>
                  ))}
                </div>

                <button onClick={handleConfirmOnline} disabled={!canConfirm} style={{ width: "100%", height: 48, background: canConfirm ? C : "rgba(255,255,255,0.1)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: canConfirm ? "pointer" : "not-allowed", opacity: canConfirm ? 1 : 0.4, marginBottom: 10, letterSpacing: "0.05em", transition: "filter 150ms" }}>
                  CONFIRMAR PEDIDO 🔥
                </button>
                <button onClick={() => setStep("choose")} style={{ width: "100%", background: "none", border: "none", color: C, fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>← Volver</button>
              </>
            )}

            {/* ── STEP: confirm ── */}
            {step === "confirm" && (
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(45,159,107,0.15)", border: "2px solid #2D9F6B", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 36 }}>✓</div>
                <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 800, margin: "0 0 6px" }}>¡Pedido recibido! 🔥</h2>
                <p style={{ color: C, fontWeight: 900, fontSize: 15, margin: "0 0 8px" }}>#{orderNum}</p>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, margin: "0 0 20px", lineHeight: 1.5 }}>Nos pondremos en contacto pronto para confirmar tu pedido.</p>
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "12px 16px", marginBottom: 16, textAlign: "left" }}>
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
                <p style={{ color: C, fontWeight: 700, fontSize: 13, margin: "0 0 20px" }}>⏱ Entrega estimada: 35-45 min</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <button onClick={sendWhatsApp} style={{ height: 44, background: "#25D366", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>💬 Compartir</button>
                  <button onClick={handleClose} style={{ height: 44, background: "none", border: `1px solid ${C}`, borderRadius: 10, color: C, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Listo, gracias</button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}
