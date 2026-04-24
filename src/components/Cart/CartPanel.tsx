"use client";
import { useState, useEffect } from "react";
import { useAppState } from "@/lib/useStore";
import { formatCurrency } from "@/lib/utils";

export default function CartPanel({ isBottomSheet = false }: { isBottomSheet?: boolean }) {
  const { state, updateQuantity, removeFromCart, getCartTotal } = useAppState();
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const cart = state.cart;
  const total = getCartTotal();
  const minOrder = 150;
  const remainingForMin = Math.max(0, minOrder - total);

  useEffect(() => {
    const checkStatus = () => {
      const now = new Date();
      const offset = -6;
      const hondurasTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (offset * 3600000));
      const day = hondurasTime.getDay();
      const hour = hondurasTime.getHours();
      const min = hondurasTime.getMinutes();
      const timeValue = hour + min / 60;
      setIsOpen((day >= 4 && day <= 6) && (timeValue >= 18.5 && timeValue < 21.5));
    };
    checkStatus();
    const timer = setInterval(checkStatus, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleWhatsApp = () => {
    if (!isOpen) return;
    const itemsList = cart.map(item => `• ${item.quantity}x ${item.name} — L. ${item.price * item.quantity}`).join('\n');
    const message = `Hola Brasa Clandestina 🔥 Quiero hacer un pedido:\n\n${itemsList}\n\n${notes ? `📝 Nota: ${notes}\n\n` : ''}💰 Total: L. ${total}\n\n¿Pueden confirmar disponibilidad?`;
    const whatsappUrl = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '50499999999'}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleOnlineOrder = () => {
    if (!isOpen) return;
    // Dispatch custom event to open the checkout modal
    window.dispatchEvent(new CustomEvent('open-online-checkout', { detail: { notes } }));
  };

  return (
    <div className={`cart-panel-container ${isBottomSheet ? 'mobile' : 'desktop'}`}>
      {/* Header */}
      <div className="cart-header">
        <h2 className="serif">Tu Pedido 🔥</h2>
        <p className="cart-subtitle">
          {cart.length > 0 
            ? `${cart.length} productos · L. ${total}`
            : "Agrega tus favoritos"}
        </p>
      </div>

      {/* Content */}
      <div className="cart-content">
        {cart.length === 0 ? (
          <div className="empty-state">
            <div className="grill-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2ZM12 20C7.589 20 4 16.411 4 12C4 7.589 7.589 4 12 4C16.411 4 20 7.589 20 12C20 16.411 16.411 20 12 20Z" fill="#E8593C" fillOpacity="0.3"/>
                    <path d="M7 11H17V13H7V11ZM9 7H15V9H9V7ZM10 15H14V17H10V15Z" fill="#E8593C"/>
                </svg>
            </div>
            <p className="empty-title">Tu pedido está vacío</p>
            <p className="empty-desc">Selecciona tus cortes y te los llevamos a tu puerta</p>
          </div>
        ) : (
          <div className="cart-items">
            {cart.map((item) => (
              <div key={item.id} className="cart-item animate-in">
                <div className="item-row-top">
                  <span className="item-badge">{item.quantity}</span>
                  <span className="item-name">{item.name}</span>
                  <span className="item-price">{formatCurrency(item.price * item.quantity)}</span>
                </div>
                <div className="item-row-bottom">
                  <div className="quantity-controls">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className={`qty-btn ${item.quantity === 1 ? 'danger' : ''}`}
                    >
                      -
                    </button>
                    <span className="qty-num">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="qty-btn coral"
                    >
                      +
                    </button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="remove-btn">✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {cart.length > 0 && (
        <div className="cart-footer">
          {/* Notes Toggle */}
          <div className="notes-section">
            <button className="notes-toggle" onClick={() => setShowNotes(!showNotes)}>
              {showNotes ? "- Ocultar instrucciones" : "+ Agregar instrucciones especiales"}
            </button>
            {showNotes && (
              <div className="notes-expand animate-expand">
                <textarea 
                  maxLength={200}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Sin cebolla, término del corte, dirección especial..."
                />
                <span className="char-count">{notes.length}/200</span>
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="totals-section">
            <div className="total-row">
              <span>Subtotal</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <div className="total-row">
              <span>Delivery</span>
              <span className="delivery-text">A coordinar 🛵</span>
            </div>
            <div className="total-divider"></div>
            <div className="total-row main">
              <span className="serif">TOTAL</span>
              <span className="total-amount serif">{formatCurrency(total)}</span>
            </div>

            {total < minOrder && (
              <div className="min-order-banner">
                ⚠️ Mínimo {formatCurrency(minOrder)} · Faltan {formatCurrency(remainingForMin)}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <div className="button-wrapper">
                {!isOpen && <div className="closed-tooltip">Abrimos el próximo Jueves a las 6:30pm</div>}
                <button 
                    onClick={handleWhatsApp}
                    disabled={total < minOrder}
                    className={`btn-whatsapp ${!isOpen ? 'inactive' : ''}`}
                >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                    Pedir por WhatsApp
                </button>
            </div>
            
            <div className="button-wrapper">
                {!isOpen && <div className="closed-tooltip">Abrimos el próximo Jueves a las 6:30pm</div>}
                <button 
                    onClick={handleOnlineOrder}
                    disabled={total < minOrder}
                    className={`btn-online ${!isOpen ? 'inactive' : ''}`}
                >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                    Registrar pedido online
                </button>
            </div>
          </div>

          {!isOpen && (
            <p className="closed-text">Ahora cerrado · Puedes preparar tu pedido</p>
          )}
          
          <p className="legal-text">🕐 Jue–Sáb · 6:30–9:30pm</p>
        </div>
      )}

      <style jsx>{`
        .cart-panel-container {
          display: flex;
          flex-direction: column;
          background: #141414;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          height: 100%;
          overflow: hidden;
        }
        .desktop {
          width: 380px;
          position: sticky;
          top: 100px;
          max-height: calc(100vh - 140px);
        }
        .mobile {
          width: 100%;
          height: 100%;
          border: none;
          border-radius: 0;
        }
        .cart-header {
          background: #1a1a1a;
          padding: 20px 20px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .cart-header h2 {
          margin: 0;
          font-size: 18px;
          color: white;
        }
        .cart-subtitle {
          margin: 4px 0 0;
          font-size: 12px;
          color: #94A3B8;
          font-weight: 500;
        }
        .cart-content {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        
        /* Empty State */
        .empty-state {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          opacity: 0.8;
          padding: 40px 0;
        }
        .grill-icon {
          width: 48px;
          height: 48px;
          margin-bottom: 16px;
        }
        .empty-title {
          font-size: 16px;
          font-weight: 700;
          color: white;
          margin: 0 0 8px;
        }
        .empty-desc {
          font-size: 13px;
          color: #94A3B8;
          max-width: 200px;
          line-height: 1.4;
        }

        /* Items */
        .cart-items {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .cart-item {
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .item-row-top {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }
        .item-badge {
          background: #E8593C;
          color: white;
          font-size: 10px;
          font-weight: 900;
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }
        .item-name {
          flex: 1;
          font-size: 14px;
          font-weight: 500;
          color: white;
          line-height: 1.3;
        }
        .item-price {
          font-size: 14px;
          font-weight: 700;
          color: white;
        }
        .item-row-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-left: 28px;
        }
        .quantity-controls {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255,255,255,0.05);
          padding: 4px;
          border-radius: 8px;
        }
        .qty-btn {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          font-weight: 900;
          background: transparent;
          color: white;
          transition: all 0.2s;
        }
        .qty-btn.danger { color: #EF4444; }
        .qty-btn.coral { color: #E8593C; }
        .qty-num {
          font-size: 13px;
          font-weight: 700;
          min-width: 12px;
          text-align: center;
        }
        .remove-btn {
          background: none;
          border: none;
          color: #94A3B8;
          font-size: 12px;
          cursor: pointer;
          padding: 4px;
          transition: color 0.2s;
        }
        .remove-btn:hover { color: #EF4444; }

        /* Footer */
        .cart-footer {
          padding: 20px;
          background: #1a1a1a;
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .notes-section {
          margin-bottom: 20px;
        }
        .notes-toggle {
          background: none;
          border: none;
          color: #E8593C;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
        }
        .notes-expand {
          margin-top: 12px;
          position: relative;
        }
        .notes-expand textarea {
          width: 100%;
          background: #0A0A0A;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          color: white;
          padding: 12px;
          font-size: 13px;
          resize: none;
          height: 70px;
          outline: none;
        }
        .char-count {
          position: absolute;
          bottom: 8px;
          right: 12px;
          font-size: 10px;
          color: #64748B;
        }

        .totals-section {
          margin-bottom: 20px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          color: #94A3B8;
          margin-bottom: 8px;
        }
        .delivery-text { color: white; }
        .total-divider {
          height: 1px;
          background: linear-gradient(90deg, #E8593C 0%, transparent 100%);
          margin: 16px 0;
          opacity: 0.3;
        }
        .total-row.main {
          color: #E8593C;
          font-size: 20px;
          font-weight: 700;
          align-items: center;
        }
        .total-amount { font-size: 24px; }

        .min-order-banner {
          background: rgba(255, 193, 7, 0.1);
          color: #FFC107;
          padding: 10px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
          text-align: center;
          margin-top: 12px;
          border: 1px dashed #FFC107;
        }

        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 12px;
        }
        .button-wrapper {
            position: relative;
        }
        .closed-tooltip {
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            background: #E8593C;
            color: white;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 10px;
            font-weight: 800;
            white-space: nowrap;
            margin-bottom: 8px;
            opacity: 0;
            pointer-events: none;
            transition: all 0.2s;
            z-index: 10;
        }
        .button-wrapper:hover .closed-tooltip {
            opacity: 1;
            transform: translateX(-50%) translateY(-4px);
        }
        .action-buttons button {
          width: 100%;
          height: 50px;
          border-radius: 12px;
          border: none;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.2s;
        }
        .btn-whatsapp { background: #25D366; color: white; }
        .btn-online { background: #E8593C; color: white; }
        .action-buttons button:hover:not(:disabled) { filter: brightness(1.08); }
        .action-buttons button:disabled { opacity: 0.5; cursor: not-allowed; }
        .action-buttons button.inactive { 
            background: #333 !important; 
            color: #666 !important;
            cursor: help;
        }

        .closed-text {
            color: #E8593C;
            font-size: 12px;
            font-weight: 700;
            text-align: center;
            margin: 0 0 12px;
        }
        .legal-text {
          font-size: 11px;
          color: #64748B;
          text-align: center;
          margin: 0;
        }

        /* Animations */
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fadeIn 0.3s ease-out forwards; }
        
        @keyframes expand { from { opacity: 0; height: 0; } to { opacity: 1; height: 80px; } }
        .animate-expand { animation: expand 0.3s ease-out forwards; overflow: hidden; }

        .serif { font-family: 'Playfair Display', serif; }
      `}</style>
    </div>
  );
}
