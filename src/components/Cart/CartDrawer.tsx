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
  const { state, hydrated } = useAppState();
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "form">("cart");
  const [method, setMethod] = useState<"whatsapp" | "direct">("whatsapp");
  const [customerInfo, setCustomerInfo] = useState({
    name: "", phone: "", address: "", type: "delivery" as "delivery" | "pickup"
  });

  useEffect(() => {
    if (!isOpen) { 
      setCheckoutStep("cart"); 
      setCustomerInfo({ name: "", phone: "", address: "", type: "delivery" });
    }
  }, [isOpen]);

  if (!isOpen || !hydrated) return null;

  const total = items.reduce((acc, item) => acc + item.subtotal, 0);
  const config = state.config || {};
  const WHATSAPP_BASE = `https://wa.me/${config.whatsapp_number?.replace(/\D/g, '') || '50499999999'}`;

  const handleWhatsAppOrder = () => {
    const orderText = items.map(i => {
        const p = state.products.find(prod => prod.id === i.product_id);
        return `- ${i.quantity}x ${p ? p.name : i.product_id}`;
    }).join("\n");
    const fullMsg = `Hola, quiero hacer un pedido 🔥\n\nDetalle:\n${orderText}\n\nTotal: L ${total.toFixed(2)}`;
    window.open(`${WHATSAPP_BASE}?text=${encodeURIComponent(fullMsg)}`, "_blank");
  };

  return (
    <>
      {/* Overlay */}
      <div 
        style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 2000,
          backdropFilter: 'blur(8px)'
        }} 
        onClick={onClose}
      />
      {/* Drawer */}
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0, width: '400px', maxWidth: '100vw',
        zIndex: 2001, display: 'flex', flexDirection: 'column', 
        backgroundColor: '#0F0F0F', borderLeft: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
        animation: 'slideInRight 0.3s ease-out'
      }}>
        {/* Header */}
        <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div>
            <h2 className="serif" style={{ fontSize: '1.25rem', fontWeight: 900, color: '#E8593C', margin: 0 }}>Tu Carrito</h2>
            <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: 0 }}>{items.length} artículos seleccionados</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', color: 'white', cursor: 'pointer', fontSize: '1.25rem' }}>&times;</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '4rem' }}>
                <span style={{ fontSize: '3rem' }}>🛒</span>
                <p style={{ color: '#94A3B8', marginTop: '1rem' }}>Tu carrito está vacío.</p>
            </div>
          ) : (
            <>
              {/* Product List Summary */}
              <div style={{ marginBottom: '2rem' }}>
                {items.map((item, i) => {
                  const product = state.products.find(p => p.id === item.product_id);
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <span style={{ backgroundColor: 'rgba(232, 89, 60, 0.1)', color: '#E8593C', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 800, fontSize: '0.85rem' }}>{item.quantity}</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{product ? product.name : `Item ${item.product_id}`}</span>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>L. {item.subtotal}</span>
                    </div>
                  );
                })}
              </div>

              {checkoutStep === "cart" ? (
                <div style={{ animation: 'fadeIn 0.3s' }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Método de Finalización</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* WhatsApp Option */}
                    <button 
                        onClick={handleWhatsAppOrder}
                        style={{ 
                            display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem',
                            backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '2px solid #22C55E',
                            borderRadius: '1rem', cursor: 'pointer', textAlign: 'left', transition: '0.2s'
                        }}
                    >
                        <span style={{ fontSize: '2rem' }}>💬</span>
                        <div>
                            <p style={{ margin: 0, fontWeight: 800, color: '#22C55E' }}>Pedido Rápido WhatsApp</p>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#22C55E', opacity: 0.8 }}>Comunicación inmediata</p>
                        </div>
                    </button>

                    {/* Direct Confirmation Option */}
                    <button 
                        onClick={() => setCheckoutStep("form")}
                        style={{ 
                            display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem',
                            backgroundColor: 'rgba(232, 89, 60, 0.1)', border: '2px solid #E8593C',
                            borderRadius: '1rem', cursor: 'pointer', textAlign: 'left', transition: '0.2s'
                        }}
                    >
                        <span style={{ fontSize: '2rem' }}>🔥</span>
                        <div>
                            <p style={{ margin: 0, fontWeight: 800, color: '#E8593C' }}>Registro y Confirmación</p>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#E8593C', opacity: 0.8 }}>Ingresa tus datos de envío</p>
                        </div>
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ animation: 'fadeIn 0.3s' }}>
                  <button onClick={() => setCheckoutStep("cart")} style={{ background: 'none', border: 'none', color: '#E8593C', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    ← Volver al carrito
                  </button>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.5rem', color: '#94A3B8', textTransform: 'uppercase' }}>Nombre Completo</label>
                        <input 
                            type="text" 
                            style={{ width: '100%', padding: '1rem', backgroundColor: '#18181B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', color: 'white', outline: 'none' }} 
                            placeholder="Ej. Roberto Gómez"
                            value={customerInfo.name}
                            onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.5rem', color: '#94A3B8', textTransform: 'uppercase' }}>Teléfono</label>
                        <input 
                            type="tel" 
                            style={{ width: '100%', padding: '1rem', backgroundColor: '#18181B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', color: 'white', outline: 'none' }} 
                            placeholder="Ej. +504 9999-0000"
                            value={customerInfo.phone}
                            onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.5rem', color: '#94A3B8', textTransform: 'uppercase' }}>Dirección de Entrega</label>
                        <textarea 
                            style={{ width: '100%', padding: '1rem', backgroundColor: '#18181B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', color: 'white', outline: 'none', height: '80px', resize: 'none' }} 
                            placeholder="Barrio, Calle, Referencia de casa..."
                            value={customerInfo.address}
                            onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})}
                        />
                    </div>
                    
                    <div style={{ backgroundColor: 'rgba(232, 89, 60, 0.05)', padding: '1rem', borderRadius: '0.75rem', border: '1px dashed #E8593C' }}>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#E8593C', textAlign: 'center', fontWeight: 600 }}>
                            Te contactaremos en breve para confirmar tu envío.
                        </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Summary */}
        <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>Total</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#E8593C' }}>L. {total.toFixed(2)}</span>
          </div>

          {checkoutStep === "form" && (
            <button 
                className="btn-primary" 
                style={{ width: '100%', padding: '1.1rem', fontSize: '1rem', backgroundColor: '#E8593C', borderRadius: '0.75rem', border: 'none', color: 'white', fontWeight: 800, cursor: 'pointer' }} 
                disabled={!customerInfo.name || !customerInfo.phone || !customerInfo.address}
                onClick={() => {
                  if (onCheckout) onCheckout(customerInfo);
                }}
            >
                CONFIRMAR PEDIDO 🔥
            </button>
          )}
          
          {items.length > 0 && checkoutStep === "cart" && (
            <p style={{ margin: 0, textAlign: 'center', fontSize: '0.75rem', color: '#94A3B8' }}>
                Selecciona un método para continuar
            </p>
          )}
        </div>

        <style jsx>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </>
  );
}
