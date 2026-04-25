"use client";
import { Product } from "@/lib/mockDB";
import { useAppState } from "@/lib/useStore";
import { useState, useCallback } from "react";

interface ProductCardProps {
  product: Product;
  availability: number;
}

const BRAND_CORAL = "#E8603C";
const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800";

export default function ProductCard({ product, availability }: ProductCardProps) {
  const { state, addToCart, updateQuantity } = useAppState();
  const [localQty, setLocalQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const isOutOfStock = availability <= 0;
  const inCart = state.cart.find((i) => i.id === product.id);

  const imgSrc =
    product.image_url && product.image_url.trim().length > 10
      ? product.image_url
      : FALLBACK_IMG;

  const handleAdd = useCallback(() => {
    if (localQty > availability) {
      alert(`Solo quedan ${availability} disponibles de ${product.name}`);
      return;
    }
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: localQty,
      category: product.category,
      image_url: product.image_url,
    });
    setLocalQty(1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  }, [addToCart, localQty, product, availability]);

  return (
    <div className="pc-card">
      {/* ── Image ── */}
      <div className="pc-img-wrap">
        <img
          src={imgSrc}
          alt={product.name}
          loading="lazy"
          className={`pc-img${isOutOfStock ? " pc-img--out" : ""}`}
        />

        {isOutOfStock && (
          <div className="pc-sold-out-overlay">
            <span className="pc-sold-out-badge">AGOTADO</span>
          </div>
        )}

        {product.price > 400 && !isOutOfStock && (
          <span className="pc-badge-popular">⭐ MÁS PEDIDO</span>
        )}
      </div>

      {/* ── Info ── */}
      <div className="pc-body">
        <h3 className="pc-name">{product.name}</h3>
        <p className="pc-desc">
          {product.description || "Preparado con fuego real y técnicas artesanales."}
        </p>

        {/* Price row */}
        <div className="pc-price-row">
          <span className="pc-desde">DESDE</span>
          <span className="pc-price">L. {product.price.toFixed(0)}</span>
        </div>

        {/* Controls */}
        <div className="pc-controls">
          {!isOutOfStock ? (
            inCart ? (
              /* Already in cart — show in-cart stepper */
              <div className="pc-incart">
                <button
                  id={`pc-dec-incart-${product.id}`}
                  className="pc-stepper-btn"
                  onClick={() => updateQuantity(product.id, inCart.quantity - 1)}
                  aria-label="Disminuir"
                >
                  −
                </button>
                <div className="pc-incart-info">
                  <span className="pc-incart-label">En carrito</span>
                  <span className="pc-incart-qty">{inCart.quantity}</span>
                </div>
                <button
                  id={`pc-inc-incart-${product.id}`}
                  className="pc-stepper-btn"
                  onClick={() => {
                    if (inCart.quantity >= availability) return;
                    updateQuantity(product.id, inCart.quantity + 1);
                  }}
                  disabled={inCart.quantity >= availability}
                  style={{ 
                    opacity: inCart.quantity >= availability ? 0.3 : 1, 
                    cursor: inCart.quantity >= availability ? "not-allowed" : "pointer" 
                  }}
                  aria-label="Aumentar"
                >
                  +
                </button>
              </div>
            ) : (
              /* Not yet in cart */
              <div className="pc-add-row">
                <div className="pc-qty-label-group">
                  <span className="pc-qty-label">CANTIDAD:</span>
                  <div className="pc-qty-ctrl">
                    <button
                      id={`pc-dec-${product.id}`}
                      className="pc-qty-btn"
                      onClick={() => setLocalQty((q) => Math.max(1, q - 1))}
                      aria-label="Menos"
                    >
                      −
                    </button>
                    <span className="pc-qty-val">{localQty}</span>
                    <button
                      id={`pc-inc-${product.id}`}
                      className="pc-qty-btn"
                      onClick={() => setLocalQty((q) => Math.min(availability, q + 1))}
                      aria-label="Más"
                    >
                      +
                    </button>
                  </div>
                </div>
                <button
                  id={`pc-add-${product.id}`}
                  className={`pc-add-btn${justAdded ? " pc-add-btn--done" : ""}`}
                  onClick={handleAdd}
                  disabled={justAdded}
                >
                  {justAdded ? "✓ AGREGADO" : "AGREGAR"}
                </button>
              </div>
            )
          ) : (
            <button disabled className="pc-disabled-btn">
              PRODUCTO AGOTADO
            </button>
          )}
        </div>
      </div>

      <style>{`
        .pc-card {
          background: #1a1a1a;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.06);
          display: flex;
          flex-direction: column;
          transition: border-color 200ms ease, transform 200ms ease, box-shadow 200ms ease;
          cursor: default;
        }
        .pc-card:hover {
          border-color: rgba(232,96,60,0.4);
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(232,96,60,0.12);
        }

        /* Image */
        .pc-img-wrap {
          width: 100%;
          aspect-ratio: 16/9;
          position: relative;
          overflow: hidden;
          background: #111;
          flex-shrink: 0;
        }
        .pc-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 300ms ease;
        }
        .pc-card:hover .pc-img { transform: scale(1.03); }
        .pc-img--out { filter: grayscale(80%) brightness(0.5); }

        .pc-sold-out-overlay {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          background: rgba(0,0,0,0.55);
        }
        .pc-sold-out-badge {
          background: #E8603C; color: #fff;
          padding: 6px 20px; border-radius: 100px;
          font-size: 11px; font-weight: 900; letter-spacing: 0.12em;
        }
        .pc-badge-popular {
          position: absolute; top: 10px; left: 10px;
          background: rgba(0,0,0,0.75);
          border: 1px solid rgba(255,220,60,0.5);
          color: #FFD83A;
          font-size: 10px; font-weight: 800; letter-spacing: 0.08em;
          padding: 4px 10px; border-radius: 100px;
        }

        /* Body */
        .pc-body {
          padding: 16px;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .pc-name {
          font-size: 15px;
          font-weight: 700;
          color: #ffffff;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0;
          line-height: 1.3;
        }
        .pc-desc {
          font-size: 12px;
          color: rgba(255,255,255,0.5);
          line-height: 1.5;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          flex: 1;
        }

        /* Price */
        .pc-price-row {
          display: flex;
          align-items: baseline;
          gap: 6px;
          margin: 4px 0 8px;
        }
        .pc-desde {
          font-size: 10px;
          font-weight: 700;
          color: rgba(255,255,255,0.35);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .pc-price {
          font-size: 18px;
          font-weight: 900;
          color: ${BRAND_CORAL};
        }

        /* Controls */
        .pc-controls { margin-top: auto; }

        /* In-cart stepper */
        .pc-incart {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(232,96,60,0.1);
          border: 1.5px solid ${BRAND_CORAL};
          border-radius: 8px;
          padding: 0 4px;
        }
        .pc-stepper-btn {
          background: none; border: none;
          color: #fff; cursor: pointer;
          width: 40px; height: 44px;
          font-size: 20px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          transition: color 150ms;
        }
        .pc-stepper-btn:hover { color: ${BRAND_CORAL}; }
        .pc-incart-info { text-align: center; }
        .pc-incart-label {
          display: block;
          font-size: 9px; font-weight: 800;
          text-transform: uppercase;
          color: rgba(255,255,255,0.45);
          letter-spacing: 0.06em;
        }
        .pc-incart-qty {
          display: block;
          font-size: 16px; font-weight: 900;
          color: ${BRAND_CORAL};
        }

        /* Add row */
        .pc-add-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .pc-qty-label-group {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .pc-qty-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: rgba(255,255,255,0.35);
          text-transform: uppercase;
        }
        .pc-qty-ctrl {
          display: flex;
          align-items: center;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 6px;
          overflow: hidden;
        }
        .pc-qty-btn {
          width: 28px; height: 28px;
          background: none; border: none;
          color: #fff; cursor: pointer;
          font-size: 16px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          transition: background 150ms, color 150ms;
          border-radius: 6px;
        }
        .pc-qty-btn:hover { background: rgba(232,96,60,0.25); color: ${BRAND_CORAL}; }
        .pc-qty-val {
          min-width: 28px;
          text-align: center;
          font-size: 13px;
          font-weight: 700;
          color: #fff;
        }

        /* Add button */
        .pc-add-btn {
          flex: 1;
          height: 36px;
          background: ${BRAND_CORAL};
          color: #fff;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          transition: filter 150ms ease, background 250ms ease;
          white-space: nowrap;
        }
        .pc-add-btn:hover:not(:disabled) { filter: brightness(1.12); }
        .pc-add-btn--done {
          background: #2D9F6B;
          cursor: default;
        }

        .pc-disabled-btn {
          width: 100%;
          height: 36px;
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.3);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          cursor: not-allowed;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
      `}</style>
    </div>
  );
}
