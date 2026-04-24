"use client";
import { useState } from "react";
import { useAppState } from "@/lib/useStore";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: string;
}

export default function CheckoutModal({ isOpen, onClose, notes }: CheckoutModalProps) {
  const { state, getCartTotal, clearCart } = useAppState();
  const [screen, setScreen] = useState<"form" | "success">("form");
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    reference: "",
    payment: "cash",
    changeFor: "",
    transferConfirmed: false
  });

  const total = getCartTotal();
  const cartItems = state.cart;

  const handleOnlineSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formData.name,
          phone: formData.phone,
          address: formData.address,
          addressReference: formData.reference,
          paymentMethod: formData.payment,
          changeFor: formData.payment === 'cash' ? Number(formData.changeFor) : null,
          transferConfirmed: formData.transferConfirmed,
          notes: notes,
          items: cartItems,
          subtotal: total,
          total: total
        })
      });

      const data = await response.json();
      if (data.success) {
        setOrderId(data.orderId);
        setScreen("success");
        if (data.notificationUrl) window.open(data.notificationUrl, "_blank");
      } else {
        alert(data.error || "Error al procesar pedido");
      }
    } catch (error) {
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.name.length >= 3 && 
                      formData.phone.replace(/\D/g, '').length >= 8 && 
                      formData.address.length >= 10 &&
                      (formData.payment === 'transfer' ? formData.transferConfirmed : true);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {screen === 'form' ? (
          <div className="checkout-form">
            <div className="modal-header">
              <h2 className="serif">Tus Datos</h2>
              <button onClick={onClose} className="close-btn">&times;</button>
            </div>
            
            <div className="form-body hide-scrollbar">
                <div className="input-group">
                  <label>Nombre completo *</label>
                  <input 
                    type="text" placeholder="Tu nombre"
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div className="input-group">
                  <label>WhatsApp / Teléfono *</label>
                  <input 
                    type="tel" placeholder="+504 XXXX-XXXX"
                    value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>

                <div className="input-group">
                  <label>Dirección de entrega *</label>
                  <textarea 
                    placeholder="Colonia, calle, número de casa..."
                    value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}
                  />
                </div>

                <div className="input-group">
                  <label>Referencia de ubicación</label>
                  <input 
                    type="text" placeholder="Casa verde, frente al parque, etc."
                    value={formData.reference} onChange={e => setFormData({...formData, reference: e.target.value})}
                  />
                </div>

                <div className="payment-options">
                  <label>Método de Pago</label>
                  <div className="grid">
                    <button 
                      onClick={() => setFormData({...formData, payment: 'cash'})}
                      className={formData.payment === 'cash' ? 'active' : ''}
                    >💵 Efectivo</button>
                    <button 
                      onClick={() => setFormData({...formData, payment: 'transfer'})}
                      className={formData.payment === 'transfer' ? 'active' : ''}
                    >📱 Transfer</button>
                  </div>

                  {formData.payment === 'cash' && (
                    <div className="payment-detail animate-in">
                      <label>¿Con cuánto vas a pagar?</label>
                      <input 
                        type="number" placeholder="Ej: L. 500"
                        value={formData.changeFor} onChange={e => setFormData({...formData, changeFor: e.target.value})}
                      />
                    </div>
                  )}

                  {formData.payment === 'transfer' && (
                    <div className="payment-detail animate-in">
                      <p className="bank-info"><b>{process.env.NEXT_PUBLIC_BANK_NAME}</b><br/>Cuenta: {process.env.NEXT_PUBLIC_BANK_ACCOUNT}<br/>Titular: {process.env.NEXT_PUBLIC_BANK_HOLDER}</p>
                      <label className="checkbox-label">
                        <input type="checkbox" checked={formData.transferConfirmed} onChange={e => setFormData({...formData, transferConfirmed: e.target.checked})} />
                        Ya realicé la transferencia
                      </label>
                    </div>
                  )}
                </div>
            </div>

            <div className="modal-footer">
              <button 
                disabled={!isFormValid || loading}
                onClick={handleOnlineSubmit}
                className="confirm-btn"
              >
                {loading ? "PROCESANDO..." : "CONFIRMAR PEDIDO 🔥"}
              </button>
            </div>
          </div>
        ) : (
          <div className="success-screen text-center animate-in">
            <div className="success-icon">✓</div>
            <h2 className="serif">¡Pedido recibido! 🔥</h2>
            <p className="order-id">Orden #{orderId}</p>
            <p className="success-desc">Te confirmaremos por WhatsApp en los próximos minutos.</p>
            
            <button 
                onClick={() => {
                  clearCart();
                  onClose();
                }}
                className="finish-btn"
            >
                Listo, gracias
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.85);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 3000;
          padding: 20px;
        }
        .modal-content {
          background: #141414;
          width: 100%;
          max-width: 500px;
          border-radius: 24px;
          border: 1px solid rgba(255,255,255,0.1);
          overflow: hidden;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
        }
        .modal-header {
          padding: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .modal-header h2 { margin: 0; font-size: 24px; color: white; }
        .close-btn { background: none; border: none; color: white; font-size: 32px; cursor: pointer; line-height: 1; }
        
        .form-body { padding: 24px; overflow-y: auto; flex: 1; }
        .input-group { margin-bottom: 20px; }
        .input-group label { display: block; font-size: 11px; font-weight: 800; color: #E8593C; text-transform: uppercase; margin-bottom: 8px; }
        .input-group input, .input-group textarea {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          color: white;
          padding: 14px;
          font-size: 14px;
          outline: none;
        }
        .input-group textarea { height: 80px; resize: none; }
        
        .payment-options label { display: block; font-size: 11px; font-weight: 800; color: #E8593C; text-transform: uppercase; margin-bottom: 12px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
        .grid button {
          height: 50px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05); color: #94A3B8; font-weight: 700; cursor: pointer;
        }
        .grid button.active { border-color: #E8593C; background: rgba(232, 89, 60, 0.1); color: white; }
        
        .payment-detail { background: rgba(255,255,255,0.03); padding: 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); }
        .bank-info { font-size: 13px; line-height: 1.5; color: #94A3B8; margin-bottom: 12px; }
        .checkbox-label { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 700; cursor: pointer; }
        
        .modal-footer { padding: 24px; border-top: 1px solid rgba(255,255,255,0.05); }
        .confirm-btn { width: 100%; height: 56px; background: #E8593C; color: white; border: none; border-radius: 16px; font-size: 16px; font-weight: 900; cursor: pointer; }
        .confirm-btn:disabled { opacity: 0.3; cursor: not-allowed; }

        .success-screen { padding: 60px 40px; text-align: center; }
        .success-icon { width: 80px; height: 80px; background: #22C55E; color: white; font-size: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }
        .order-id { font-size: 20px; font-weight: 900; color: #E8593C; margin: 0 0 12px; }
        .success-desc { color: #94A3B8; font-size: 14px; margin-bottom: 32px; }
        .finish-btn { width: 100%; height: 50px; background: transparent; border: 1px solid #E8593C; color: #E8593C; border-radius: 12px; font-weight: 700; cursor: pointer; }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fadeIn 0.4s ease-out forwards; }
        .serif { font-family: 'Playfair Display', serif; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
