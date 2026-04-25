"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/lib/useStore";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatLps = (amount: number) =>
  `Lps. ${amount.toFixed(2)}`;

const TAX_RATE = 0.15;
const SHIPPING_COST = 0; // Mostrar como "A coordinar"

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { state, updateQuantity, removeFromCart, getCartTotal, clearCart, getProductAvailability } =
    useAppState();
  const [notes, setNotes] = useState("");
  const [notesOpen, setNotesOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);
  const router = useRouter();
  const drawerRef = useRef<HTMLDivElement>(null);

  const cartItems = state.cart;
  const subtotal = getCartTotal();
  const tax = subtotal * TAX_RATE;
  const discount = 0;
  const total = subtotal + tax + SHIPPING_COST - discount;

  // CAMBIO 3: Calcula bandera global del carrito
  const hasAnyStockIssue = cartItems.some(item => {
    const product = state.products.find(p => p.id === item.id);
    const available = product ? getProductAvailability(product) : 99;
    return item.quantity > available;
  });

  // Manage mount/unmount animation
  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimating(true));
      });
    } else {
      setAnimating(false);
      const t = setTimeout(() => setVisible(false), 380);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleProcessOrder = () => {
    onClose();
    router.push("/checkout");
  };

  const handleClearCart = () => {
    if (window.confirm("¿Vaciar todo el carrito?")) clearCart();
  };

  if (!visible) return null;

  return (
    <>
      {/* ─── Backdrop ─── */}
      <div
        className="bc-backdrop"
        style={{ opacity: animating ? 1 : 0 }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ─── Drawer Panel ─── */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Detalle de orden"
        className="bc-drawer"
        style={{ transform: animating ? "translateX(0)" : "translateX(100%)" }}
      >
        {/* ══════════════════ HEADER ══════════════════ */}
        <header className="bc-header">
          <div className="bc-header-title">
            <span className="bc-header-flame">🔥</span>
            <div>
              <h2 className="bc-title">DETALLE DE ORDEN</h2>
              <p className="bc-subtitle">Brasa Clandestina</p>
            </div>
          </div>

          <div className="bc-header-actions">
            {cartItems.length > 0 && (
              <button
                id="cart-clear-btn"
                className="bc-icon-btn bc-icon-btn--danger"
                onClick={handleClearCart}
                title="Vaciar carrito"
                aria-label="Vaciar carrito"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                </svg>
              </button>
            )}
            <button
              id="cart-close-btn"
              className="bc-icon-btn"
              onClick={onClose}
              aria-label="Cerrar carrito"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </header>

        {/* ══════════════════ ITEM LIST ══════════════════ */}
        <div className="bc-body">
          {cartItems.length === 0 ? (
            <div className="bc-empty">
              <span className="bc-empty-icon">🛒</span>
              <p className="bc-empty-title">Tu carrito está vacío</p>
              <p className="bc-empty-sub">Agrega platillos desde el menú</p>
            </div>
          ) : (
            <ul className="bc-item-list">
              {cartItems.map((item) => {
                // CAMBIO 2: Lógica de disponibilidad por item
                const product = state.products.find(p => p.id === item.id);
                const available = product ? getProductAvailability(product) : 99;
                const hasStockIssue = item.quantity > available;

                return (
                  <li key={item.id} className={`bc-item ${hasStockIssue ? 'bc-item--warning' : ''}`}>
                    {/* Remove button */}
                    <button
                      id={`cart-remove-${item.id}`}
                      className="bc-remove-btn"
                      onClick={() => removeFromCart(item.id)}
                      aria-label={`Eliminar ${item.name}`}
                    >
                      ✕
                    </button>

                    {/* Product image */}
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="bc-item-img"
                      />
                    )}

                    {/* Info */}
                    <div className="bc-item-info">
                      <p className="bc-item-name">{item.name}</p>
                      {hasStockIssue && (
                        <p style={{ 
                          margin: "4px 0 0", fontSize: 11, fontWeight: 700,
                          color: "#E8593C", display: "flex", alignItems: "center", gap: 4 
                        }}>
                          ⚠ Solo quedan {available} disponibles
                        </p>
                      )}
                      <p className="bc-item-desc">{item.category}</p>

                      {/* Quantity controls */}
                      <div className="bc-qty-row">
                        <div className="bc-qty-ctrl">
                          <button
                            id={`cart-dec-${item.id}`}
                            className="bc-qty-btn"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            aria-label="Disminuir cantidad"
                          >
                            −
                          </button>
                          <span className="bc-qty-val">{item.quantity}</span>
                          <button
                            id={`cart-inc-${item.id}`}
                            className="bc-qty-btn"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            aria-label="Aumentar cantidad"
                          >
                            +
                          </button>
                        </div>

                        <span className="bc-item-price">
                          {formatLps(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ══════════════════ FOOTER ══════════════════ */}
        <footer className="bc-footer">
          {/* Accordion: comments */}
          <div className="bc-accordion">
            <button
              id="cart-notes-toggle"
              className="bc-accordion-toggle"
              onClick={() => setNotesOpen((p) => !p)}
              aria-expanded={notesOpen}
            >
              <span className="bc-accordion-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
              </span>
              Agregar comentarios para cocina
              <span className={`bc-chevron ${notesOpen ? "bc-chevron--open" : ""}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </span>
            </button>

            {notesOpen && (
              <div className="bc-accordion-body">
                <textarea
                  id="cart-notes-input"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: Sin cebolla, término medio, salsa aparte…"
                  className="bc-notes-input"
                  rows={3}
                />
              </div>
            )}
          </div>

          {/* Cost breakdown */}
          <div className="bc-summary">
            <div className="bc-summary-row">
              <span>Subtotal</span>
              <span>{formatLps(subtotal)}</span>
            </div>
            <div className="bc-summary-row">
              <span>Impuesto (15%)</span>
              <span>{formatLps(tax)}</span>
            </div>
            <div className="bc-summary-row">
              <span>Flete</span>
              <span className="bc-coordinar">A coordinar</span>
            </div>
            {discount > 0 && (
              <div className="bc-summary-row bc-summary-row--discount">
                <span>Descuento</span>
                <span>− {formatLps(discount)}</span>
              </div>
            )}
            <div className="bc-summary-divider" />
            <div className="bc-summary-row bc-summary-row--total">
              <span>TOTAL</span>
              <span className="bc-total-amount">{formatLps(total)}</span>
            </div>
          </div>

          {/* CTA */}
          <button
            id="cart-process-btn"
            className="bc-cta-btn"
            disabled={cartItems.length === 0 || hasAnyStockIssue}
            onClick={handleProcessOrder}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            PROCESAR MI ORDEN
          </button>

          {/* CAMBIO 5: Mensaje de error global */}
          {hasAnyStockIssue && (
            <p style={{ 
              margin: "8px 0 0", fontSize: 11, color: "#E8593C",
              textAlign: "center", fontWeight: 600
            }}>
              Ajusta las cantidades marcadas en rojo
            </p>
          )}

          <button
            id="cart-continue-btn"
            className="bc-secondary-btn"
            onClick={onClose}
          >
            Seguir viendo el menú
          </button>
        </footer>
      </div>

      {/* ══════════════════ STYLES ══════════════════ */}
      <style>{`
        /* ── Tokens ── */
        .bc-backdrop {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(4px);
          z-index: 2000;
          transition: opacity 0.35s ease;
        }

        .bc-drawer {
          position: fixed;
          top: 0; right: 0;
          height: 100%;
          width: 100%;
          max-width: 440px;
          background: #FAFAF8;
          color: #1A1A1A;
          z-index: 2001;
          display: flex;
          flex-direction: column;
          box-shadow: -8px 0 40px rgba(0,0,0,0.22);
          transition: transform 0.38s cubic-bezier(0.16, 1, 0.3, 1);
          font-family: 'Inter', system-ui, sans-serif;
        }

        /* ── HEADER ── */
        .bc-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: #1C1C1C;
          border-bottom: 2px solid #E8593C;
          flex-shrink: 0;
        }
        .bc-header-title { display: flex; align-items: center; gap: 10px; }
        .bc-header-flame { font-size: 22px; }
        .bc-title {
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 0.12em;
          color: #FFFFFF;
          margin: 0;
          line-height: 1.2;
        }
        .bc-subtitle {
          font-size: 10px;
          color: #E8593C;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          margin: 2px 0 0;
        }
        .bc-header-actions { display: flex; align-items: center; gap: 8px; }
        .bc-icon-btn {
          min-width: 40px; min-height: 40px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 8px;
          border: none;
          background: rgba(255,255,255,0.08);
          color: #FFFFFF;
          cursor: pointer;
          transition: background 0.18s ease, transform 0.12s ease;
        }
        .bc-icon-btn:hover { background: rgba(255,255,255,0.16); }
        .bc-icon-btn:active { transform: scale(0.93); }
        .bc-icon-btn--danger { color: #FF6B6B; }
        .bc-icon-btn--danger:hover { background: rgba(255,107,107,0.15); }

        /* ── BODY ── */
        .bc-body {
          flex: 1;
          overflow-y: auto;
          overscroll-behavior: contain;
          padding: 12px 0;
        }
        .bc-body::-webkit-scrollbar { width: 4px; }
        .bc-body::-webkit-scrollbar-track { background: transparent; }
        .bc-body::-webkit-scrollbar-thumb { background: #D1C9C0; border-radius: 4px; }

        /* Empty state */
        .bc-empty {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          height: 100%;
          min-height: 220px;
          gap: 8px;
          color: #9C9585;
        }
        .bc-empty-icon { font-size: 52px; }
        .bc-empty-title { font-size: 17px; font-weight: 700; color: #4A453E; margin: 0; }
        .bc-empty-sub { font-size: 13px; margin: 0; }

        /* Item list */
        .bc-item-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }

        .bc-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 20px;
          background: #FFFFFF;
          border-bottom: 1px solid #F0EDE8;
          transition: background 0.15s ease;
          position: relative;
        }
        .bc-item:hover { background: #F9F7F4; }

        /* CAMBIO 6: Agregado al CSS */
        .bc-item--warning {
          background: rgba(232, 89, 60, 0.04) !important;
          border-left: 3px solid #E8593C;
        }

        .bc-remove-btn {
          min-width: 26px; min-height: 26px;
          display: flex; align-items: center; justify-content: center;
          background: #FF4444;
          color: #fff;
          border: none;
          border-radius: 50%;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          flex-shrink: 0;
          margin-top: 2px;
          transition: background 0.15s ease, transform 0.12s ease;
        }
        .bc-remove-btn:hover { background: #CC0000; }
        .bc-remove-btn:active { transform: scale(0.9); }

        .bc-item-img {
          width: 60px; height: 60px;
          border-radius: 8px;
          object-fit: cover;
          flex-shrink: 0;
          border: 1px solid #EDE9E3;
        }

        .bc-item-info { flex: 1; min-width: 0; }
        .bc-item-name {
          font-size: 14px;
          font-weight: 700;
          color: #1A1A1A;
          margin: 0 0 2px;
          line-height: 1.3;
        }
        .bc-item-desc {
          font-size: 12px;
          color: #8C8278;
          margin: 0 0 10px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Qty row */
        .bc-qty-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .bc-qty-ctrl {
          display: flex;
          align-items: center;
          gap: 0;
          background: #F0EDE8;
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid #DDD8D0;
        }
        .bc-qty-btn {
          min-width: 44px; min-height: 44px;
          display: flex; align-items: center; justify-content: center;
          background: transparent;
          border: none;
          font-size: 20px;
          font-weight: 700;
          color: #3C3228;
          cursor: pointer;
          transition: background 0.15s ease, color 0.15s ease;
          line-height: 1;
        }
        .bc-qty-btn:hover { background: #E8593C; color: #fff; }
        .bc-qty-btn:active { background: #C74D33; color: #fff; }
        .bc-qty-val {
          min-width: 38px;
          text-align: center;
          font-size: 15px;
          font-weight: 700;
          color: #1A1A1A;
          border-left: 1px solid #DDD8D0;
          border-right: 1px solid #DDD8D0;
          padding: 0 4px;
          line-height: 44px;
        }
        .bc-item-price {
          font-size: 14px;
          font-weight: 800;
          color: #1A1A1A;
        }

        /* ── FOOTER ── */
        .bc-footer {
          flex-shrink: 0;
          border-top: 1px solid #EDE9E3;
          background: #F5F2EE;
          padding: 14px 20px 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* Accordion */
        .bc-accordion {
          border: 1px solid #DDD8D0;
          border-radius: 10px;
          overflow: hidden;
          background: #FFFFFF;
        }
        .bc-accordion-toggle {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 14px;
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          color: #4A453E;
          text-align: left;
          transition: background 0.15s ease;
        }
        .bc-accordion-toggle:hover { background: #F5F2EE; }
        .bc-accordion-icon { color: #E8593C; display: flex; }
        .bc-chevron { margin-left: auto; color: #9C9585; transition: transform 0.22s ease; display: flex; }
        .bc-chevron--open { transform: rotate(180deg); }
        .bc-accordion-body { padding: 0 14px 12px; }
        .bc-notes-input {
          width: 100%;
          resize: none;
          border: 1px solid #DDD8D0;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 13px;
          color: #1A1A1A;
          background: #FAFAF8;
          outline: none;
          transition: border-color 0.18s ease, box-shadow 0.18s ease;
          box-sizing: border-box;
          font-family: inherit;
        }
        .bc-notes-input:focus {
          border-color: #E8593C;
          box-shadow: 0 0 0 3px rgba(232, 89, 60, 0.12);
        }

        /* Summary */
        .bc-summary { display: flex; flex-direction: column; gap: 7px; }
        .bc-summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          color: #6B6358;
        }
        .bc-summary-row--discount { color: #2D9F6B; }
        .bc-summary-divider { height: 1px; background: #DDD8D0; margin: 4px 0; }
        .bc-summary-row--total {
          font-size: 15px;
          font-weight: 800;
          color: #1A1A1A;
        }
        .bc-total-amount {
          font-size: 20px;
          font-weight: 900;
          color: #E8593C;
        }
        .bc-coordinar { color: #9C9585; font-style: italic; }

        /* CTA */
        .bc-cta-btn {
          width: 100%;
          min-height: 52px;
          display: flex; align-items: center; justify-content: center;
          gap: 10px;
          background: linear-gradient(135deg, #D97B1C 0%, #E8A020 100%);
          color: #FFFFFF;
          font-size: 15px;
          font-weight: 800;
          letter-spacing: 0.08em;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(217, 123, 28, 0.35);
          transition: transform 0.14s ease, box-shadow 0.14s ease, filter 0.14s ease;
        }
        .bc-cta-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(217, 123, 28, 0.45);
        }
        .bc-cta-btn:active:not(:disabled) { transform: scale(0.98); }
        .bc-cta-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          box-shadow: none;
        }

        .bc-secondary-btn {
          width: 100%;
          min-height: 44px;
          background: transparent;
          border: 1.5px solid #DDD8D0;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          color: #6B6358;
          cursor: pointer;
          transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
        }
        .bc-secondary-btn:hover {
          border-color: #E8593C;
          color: #E8593C;
          background: rgba(232,89,60,0.04);
        }
      `}</style>
    </>
  );
}
