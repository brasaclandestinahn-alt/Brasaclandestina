"use client"
import { useState, useEffect } from "react";
import { OrderItem } from "@/lib/mockDB";
import { useAppState } from "@/lib/useStore";
import { supabase } from "@/lib/supabase";

interface CartItem extends OrderItem {
  image_url?: string;
  price: number;
}

interface CartDrawerProps {
  items: CartItem[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onCheckout: (customerData: any) => void;
}

export default function CartDrawer({ items, isOpen, onClose, onUpdateQuantity, onCheckout }: CartDrawerProps) {
  const { state, hydrated } = useAppState();
  const [step, setStep] = useState<"cart" | "checkout">("cart");
  const [customerInfo, setCustomerInfo] = useState({
    name: "", phone: "", address: "", payment: "efectivo"
  });

  useEffect(() => {
    if (!isOpen) { 
      setStep("cart"); 
    }
  }, [isOpen]);

  if (!isOpen || !hydrated) return null;

  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const deliveryFee = subtotal > 0 ? 50 : 0; // Mock delivery fee
  const total = subtotal + deliveryFee;

  return (
    <>
      {/* Overlay */}
      <div 
        style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 2000,
          backdropFilter: 'blur(10px)', transition: 'opacity 0.3s'
        }} 
        onClick={onClose}
      />
      {/* Drawer Container */}
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0, width: '450px', maxWidth: '100vw',
        zIndex: 2001, display: 'flex', flexDirection: 'column', 
        backgroundColor: '#0A0A0A', borderLeft: '1px solid rgba(245,237,216,0.1)',
        boxShadow: '-20px 0 50px rgba(0,0,0,0.8)',
        animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        
        {/* Header */}
        <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid rgba(245,237,216,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="serif" style={{ fontSize: '1.5rem', color: '#E8593C', margin: 0, letterSpacing: '0.02em' }}>
              {step === "cart" ? "Tu Carrito" : "Finalizar Pedido"}
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: '0.25rem 0 0', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.1em' }}>
              Brasa Clandestina Experience
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', color: 'white', cursor: 'pointer', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }} className="hide-scrollbar">
          {step === "cart" ? (
            <div style={{ animation: 'fadeIn 0.4s' }}>
              {items.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: '6rem', opacity: 0.5 }}>
                  <span style={{ fontSize: '4rem' }}>🛒</span>
                  <p style={{ marginTop: '1.5rem', fontWeight: 600 }}>Tu carrito está vacío.</p>
                  <button onClick={onClose} style={{ marginTop: '1rem', color: '#E8593C', background: 'none', border: '1px solid #E8593C', padding: '0.5rem 1.5rem', borderRadius: '100px', cursor: 'pointer' }}>Explorar Menú</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {items.map((item) => (
                    <div key={item.product_id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <img src={item.image_url} alt={item.product_name} style={{ width: '70px', height: '70px', borderRadius: '0.75rem', objectFit: 'cover' }} />
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>{item.product_name}</h4>
                        <p style={{ margin: '0.25rem 0 0.75rem', fontSize: '0.8rem', color: '#94A3B8' }}>L. {item.price}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#1A1A1A', borderRadius: '0.5rem', padding: '0.25rem' }}>
                            <button onClick={() => onUpdateQuantity(item.product_id, -1)} style={{ background: 'none', border: 'none', color: 'white', width: '24px', cursor: 'pointer', fontWeight: 900 }}>-</button>
                            <span style={{ width: '30px', textAlign: 'center', fontSize: '0.9rem', fontWeight: 800 }}>{item.quantity}</span>
                            <button onClick={() => onUpdateQuantity(item.product_id, 1)} style={{ background: 'none', border: 'none', color: 'white', width: '24px', cursor: 'pointer', fontWeight: 900 }}>+</button>
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontWeight: 900, color: '#F5EDD8' }}>L. {item.price * item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ animation: 'fadeIn 0.4s', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <button onClick={() => setStep("cart")} style={{ background: 'none', border: 'none', color: '#E8593C', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: 0 }}>
                ← VOLVER AL CARRITO
              </button>

              {/* DATOS MÍNIMOS */}
              <section>
                <h3 style={{ fontSize: '0.75rem', fontWeight: 900, color: '#E8593C', letterSpacing: '0.15em', marginBottom: '1rem', textTransform: 'uppercase' }}>Datos Mínimos</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <input 
                    type="text" placeholder="Nombre Completo" 
                    style={{ width: '100%', padding: '1rem', backgroundColor: '#18181B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', color: 'white', outline: 'none' }}
                    value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})}
                  />
                  <input 
                    type="tel" placeholder="Teléfono" 
                    style={{ width: '100%', padding: '1rem', backgroundColor: '#18181B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', color: 'white', outline: 'none' }}
                    value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})}
                  />
                </div>
              </section>

              {/* DIRECCIÓN DE ENTREGA */}
              <section>
                <h3 style={{ fontSize: '0.75rem', fontWeight: 900, color: '#E8593C', letterSpacing: '0.15em', marginBottom: '1rem', textTransform: 'uppercase' }}>Dirección de Entrega</h3>
                <textarea 
                  placeholder="Barrio, Calle, Referencia detallada..." 
                  style={{ width: '100%', padding: '1rem', backgroundColor: '#18181B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', color: 'white', outline: 'none', height: '100px', resize: 'none' }}
                  value={customerInfo.address} onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})}
                />
              </section>

              {/* FORMA DE PAGO */}
              <section>
                <h3 style={{ fontSize: '0.75rem', fontWeight: 900, color: '#E8593C', letterSpacing: '0.15em', marginBottom: '1rem', textTransform: 'uppercase' }}>Forma de Pago</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {["Efectivo", "Transferencia Bancaria", "Tarjeta"].map((p) => (
                    <button 
                      key={p}
                      onClick={() => setCustomerInfo({...customerInfo, payment: p.toLowerCase()})}
                      style={{ 
                        padding: '1rem', borderRadius: '0.75rem', border: '1px solid',
                        borderColor: customerInfo.payment === p.toLowerCase() ? '#E8593C' : 'rgba(255,255,255,0.1)',
                        backgroundColor: customerInfo.payment === p.toLowerCase() ? 'rgba(232, 89, 60, 0.1)' : 'transparent',
                        color: 'white', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', transition: '0.2s'
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Footer Summary */}
        <div style={{ padding: '2rem 1.5rem', borderTop: '1px solid rgba(245,237,216,0.1)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: '0.9rem' }}>
              <span>Subtotal</span>
              <span>L. {subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: '0.9rem' }}>
              <span>Envío</span>
              <span>L. {deliveryFee.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 900 }}>Total</span>
              <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#E8593C' }}>L. {total.toFixed(2)}</span>
            </div>
          </div>

          {step === "cart" ? (
            <button 
              disabled={items.length === 0}
              onClick={() => setStep("checkout")}
              style={{ 
                width: '100%', padding: '1.25rem', borderRadius: '1rem', border: 'none',
                backgroundColor: items.length === 0 ? '#333' : '#E8593C', 
                color: 'white', fontWeight: 900, fontSize: '1rem', cursor: 'pointer',
                boxShadow: '0 10px 20px rgba(232, 89, 60, 0.2)',
                transition: '0.2s', letterSpacing: '0.05em'
              }}
            >
              PROCEDER AL CHECKOUT
            </button>
          ) : (
            <button 
              disabled={!customerInfo.name || !customerInfo.phone || !customerInfo.address}
              onClick={() => onCheckout(customerInfo)}
              style={{ 
                width: '100%', padding: '1.25rem', borderRadius: '1rem', border: 'none',
                backgroundColor: (!customerInfo.name || !customerInfo.phone || !customerInfo.address) ? '#333' : '#22C55E', 
                color: 'white', fontWeight: 900, fontSize: '1rem', cursor: 'pointer',
                boxShadow: '0 10px 20px rgba(34, 197, 94, 0.2)',
                transition: '0.2s', letterSpacing: '0.05em'
              }}
            >
              CONFIRMAR PEDIDO DIRECTO
            </button>
          )}
        </div>

        <style jsx>{`
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .serif { font-family: 'Playfair Display', serif; }
        `}</style>
      </div>
    </>
  );
}
