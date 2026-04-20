"use client"
import { useState, useEffect } from "react";
import { OrderItem } from "@/lib/mockDB";
import { useAppState } from "@/lib/useStore";

interface CartDrawerProps {
  items: OrderItem[];
  isOpen: boolean;
  onClose: () => void;
  onCheckout?: (customerData: any) => void;
}

export default function CartDrawer({ items, isOpen, onClose, onCheckout }: CartDrawerProps) {
  const { state } = useAppState();
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "form">("cart");
  const [customerInfo, setCustomerInfo] = useState({
    name: "", phone: "", address: "", type: "pickup" as "delivery" | "pickup", payment: "efectivo", bank: "",
    isScheduled: false, scheduledTime: ""
  });

  useEffect(() => {
    if (!isOpen) { 
      setCheckoutStep("cart"); 
      setCustomerInfo({ name: "", phone: "", address: "", type: "pickup", payment: "efectivo", bank: "", isScheduled: false, scheduledTime: "" });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const total = items.reduce((acc, item) => acc + item.subtotal, 0);

  return (
    <>
      {/* Overlay */}
      <div 
        style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 40,
          backdropFilter: 'blur(4px)'
        }} 
        onClick={onClose}
      />
      {/* Drawer */}
      <div className="glass-panel" style={{
        position: 'fixed', right: 0, top: 0, bottom: 0, width: '350px', maxWidth: '100vw',
        zIndex: 50, borderRight: 'none', borderRadius: 'var(--radius-lg) 0 0 var(--radius-lg)',
        display: 'flex', flexDirection: 'column', padding: '1.5rem', backgroundColor: 'var(--bg-secondary)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Tu Orden</h2>
          <button onClick={onClose} style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>&times;</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem' }}>
          {checkoutStep === "cart" ? (
            <>
              {items.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>El carrito está vacío</p>
              ) : (
                items.map((item, i) => {
                  const product = state.products.find(p => p.id === item.product_id);
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                      <div style={{ paddingRight: "1rem" }}>
                        <span style={{ fontWeight: 600 }}>x{item.quantity}</span> <span style={{ color: 'var(--text-secondary)' }}>{product ? product.name : `Item ${item.product_id}`}</span>
                      </div>
                      <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>L {item.subtotal.toFixed(2)}</span>
                    </div>
                  );
                })
              )}
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", animation: "fadeIn 0.2s" }}>
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>Por favor, completa tus datos para enviar la orden.</p>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.25rem" }}>Nombre o Razón Social</label>
                <input type="text" className="input-field" placeholder="Ej. Juan Pérez" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.25rem" }}>Teléfono de Contacto</label>
                <input type="tel" className="input-field" placeholder="Ej. +504 9999-9999" value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} />
              </div>
              
              <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                <label style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.875rem" }}>
                  <input type="radio" name="orderType" checked={customerInfo.type === "pickup"} onChange={() => setCustomerInfo({...customerInfo, type: "pickup"})} />
                  Pick Up (LLevar)
                </label>
                <label style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.875rem" }}>
                  <input type="radio" name="orderType" checked={customerInfo.type === "delivery"} onChange={() => setCustomerInfo({...customerInfo, type: "delivery"})} />
                  Delivery
                </label>
              </div>

              {customerInfo.type === "delivery" && (
                <div style={{ animation: "fadeIn 0.2s" }}>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.25rem" }}>Dirección Completa de Entrega</label>
                  <textarea className="input-field" placeholder="Barrio, Calle, Referencia..." value={customerInfo.address} onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})} style={{ height: "60px", resize: "none" }} />
                </div>
              )}

              <div style={{ marginTop: "0.5rem" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.25rem" }}>Forma de Pago</label>
                <select 
                  className="input-field" 
                  value={customerInfo.payment} 
                  onChange={e => setCustomerInfo({...customerInfo, payment: e.target.value as any})}
                >
                  {(state.paymentMethods || [])
                    .filter(pm => pm.is_active)
                    .map(pm => (
                      <option key={pm.id} value={pm.id}>{pm.label} {pm.icon}</option>
                    ))
                  }
                </select>
              </div>
              {customerInfo.payment === "transferencia" && (
                <div style={{ animation: "fadeIn 0.2s" }}>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.25rem" }}>Seleccionar Banco destino</label>
                  <select 
                    className="input-field" 
                    value={customerInfo.bank} 
                    onChange={e => setCustomerInfo({...customerInfo, bank: e.target.value})}
                    required
                  >
                    <option value="">-- Elija un Banco --</option>
                    {(() => {
                      const transMethod = (state.paymentMethods || []).find(pm => pm.id === "transferencia");
                      return (transMethod?.options || [])
                        .map(rawOpt => (typeof rawOpt === "string" ? { label: rawOpt, is_active: true } : rawOpt))
                        .filter(opt => opt.is_active)
                        .map(opt => (
                          <option key={opt.label} value={opt.label}>🏦 {opt.label}</option>
                        ));
                    })()}
                  </select>
                </div>
              )}

              {/* PROGRAMAR PEDIDO SECTION */}
              <div style={{ marginTop: "1rem", padding: "1.5rem", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-md)", border: "1px dashed var(--border-color)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: customerInfo.isScheduled ? "1rem" : "0" }}>
                  <div>
                    <h4 style={{ fontSize: "0.875rem", fontWeight: 700 }}>🕒 Programar Pedido</h4>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Recibe tu orden en un momento específico</p>
                  </div>
                  <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '44px', height: '22px' }}>
                    <input 
                      type="checkbox" 
                      style={{ opacity: 0, width: 0, height: 0 }}
                      checked={customerInfo.isScheduled}
                      onChange={e => {
                        const isChecked = e.target.checked;
                        let nextTime = "";
                        if (isChecked) {
                          const now = new Date();
                          const start = new Date(now);
                          const mins = now.getMinutes();
                          if (mins < 30) {
                            start.setMinutes(30, 0, 0);
                          } else {
                            start.setHours(start.getHours() + 1, 0, 0, 0);
                          }
                          const h = start.getHours();
                          const m = start.getMinutes();
                          const ampm = h >= 12 ? 'PM' : 'AM';
                          const displayH = h % 12 || 12;
                          nextTime = `${displayH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
                        }
                        setCustomerInfo({...customerInfo, isScheduled: isChecked, scheduledTime: nextTime});
                      }}
                    />
                    <span style={{ 
                      position: 'absolute', cursor: 'pointer', inset: 0, backgroundColor: customerInfo.isScheduled ? 'var(--accent-color)' : '#333', 
                      borderRadius: '34px', transition: '.4s' 
                    }}>
                      <span style={{ 
                        position: 'absolute', content: '""', height: '16px', width: '16px', left: customerInfo.isScheduled ? '24px' : '4px', bottom: '3px',
                        backgroundColor: 'white', borderRadius: '50%', transition: '.4s'
                      }} />
                    </span>
                  </label>
                </div>

                {customerInfo.isScheduled && (
                  <div style={{ animation: "fadeIn 0.3s ease-out" }}>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--accent-color)" }}>Hora de Entrega Deseada (12h)</label>
                    <select 
                      className="input-field" 
                      style={{ fontSize: "1.25rem", fontWeight: 900, textAlign: "center", color: "#000000", backgroundColor: "#ffffff" }} 
                      value={customerInfo.scheduledTime}
                      onChange={e => setCustomerInfo({...customerInfo, scheduledTime: e.target.value})}
                    >
                      {(() => {
                        const slots = [];
                        const now = new Date();
                        const start = new Date(now);
                        const mins = now.getMinutes();
                        if (mins < 30) {
                          start.setMinutes(30, 0, 0);
                        } else {
                          start.setHours(start.getHours() + 1, 0, 0, 0);
                        }

                        for (let i = 0; i < 24; i++) {
                          const slotTime = new Date(start.getTime() + i * 30 * 60 * 1000);
                          const h = slotTime.getHours();
                          const m = slotTime.getMinutes();
                          const ampm = h >= 12 ? 'PM' : 'AM';
                          const displayH = h % 12 || 12;
                          const str = `${displayH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
                          slots.push(<option key={str} value={str}>{str}</option>);
                        }
                        return slots;
                      })()}
                    </select>
                    <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.5rem", textAlign: "center" }}>
                      * Pedidos disponibles en intervalos de 30 minutos.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ borderTop: '2px solid var(--border-color)', paddingTop: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 700 }}>
            <span>Total:</span>
            <span style={{ color: 'var(--accent-color)' }}>L {total.toFixed(2)}</span>
          </div>
        </div>

        {checkoutStep === "cart" ? (
          <button className="btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.125rem' }} disabled={items.length === 0} onClick={() => setCheckoutStep("form")}>
            Realizar Pedido
          </button>
        ) : (
          <button 
            className="btn-primary" 
            style={{ width: '100%', padding: '1rem', fontSize: '1.125rem', backgroundColor: "var(--success)" }} 
            disabled={!customerInfo.name || !customerInfo.phone || (customerInfo.type === "delivery" && !customerInfo.address) || (customerInfo.payment === "transferencia" && !customerInfo.bank)} 
            onClick={() => { 
              if(onCheckout) {
                onCheckout({
                  ...customerInfo,
                  payment_details: customerInfo.payment === "transferencia" ? customerInfo.bank : undefined,
                  scheduled_time: customerInfo.isScheduled ? customerInfo.scheduledTime : undefined
                });
              } 
            }}
          >
            Confirmar y Enviar Pedido
          </button>
        )}
      </div>
    </>
  );
}
