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

  const handleNotifyMe = () => {
    const whatsapp = state.config?.whatsapp_number || "50499999999";
    const message = encodeURIComponent(
      `¡Hola! Me interesa el producto *${product.name}*, pero veo que no está disponible hoy. ¿Podrían avisarme cuando vuelva a estar en stock? 🔥`
    );
    window.open(`https://wa.me/${whatsapp}?text=${message}`, "_blank");
  };

  return (
    <div className={`pc-card ${isOutOfStock ? "pc-card--out" : ""}`}>
      {/* ── Image ── */}
      <div className="pc-img-wrap">
        <img
          src={imgSrc}
          alt={product.name}
          loading="lazy"
          className="pc-img"
        />

        {isOutOfStock && (
          <>
            <div className="pc-sold-out-overlay" />
            <div className="pc-sold-out-tag">
              <span className="pc-sold-out-dot" />
              AGOTADO HOY
            </div>
          </>
        )}

        {product.price > 400 && !isOutOfStock && (
          <span className="pc-badge-popular">⭐ RECOMENDADO</span>
        )}
      </div>

      {/* ── Info ── */}
      <div className="pc-body">
        <div className="pc-header-row">
          <h3 className="pc-name">{product.name}</h3>
          <span className="pc-price">L. {product.price.toFixed(0)}</span>
        </div>
        
        <p className="pc-desc">
          {product.description || "Preparado con fuego real y técnicas artesanales de Brasa Clandestina."}
        </p>

        {/* Controls */}
        <div className="pc-controls">
          {!isOutOfStock ? (
            inCart ? (
              <div className="pc-incart">
                <button
                  className="pc-stepper-btn"
                  onClick={() => updateQuantity(product.id, inCart.quantity - 1)}
                >
                  −
                </button>
                <div className="pc-incart-info">
                  <span className="pc-incart-qty">{inCart.quantity}</span>
                  <span className="pc-incart-label">EN CARRITO</span>
                </div>
                <button
                  className="pc-stepper-btn"
                  onClick={() => {
                    if (inCart.quantity >= availability) return;
                    updateQuantity(product.id, inCart.quantity + 1);
                  }}
                  disabled={inCart.quantity >= availability}
                >
                  +
                </button>
              </div>
            ) : (
              <div className="pc-add-row">
                <div className="pc-qty-ctrl">
                  <button
                    className="pc-qty-btn"
                    onClick={() => setLocalQty((q) => Math.max(1, q - 1))}
                  >
                    −
                  </button>
                  <span className="pc-qty-val">{localQty}</span>
                  <button
                    className="pc-qty-btn"
                    onClick={() => setLocalQty((q) => Math.min(availability, q + 1))}
                  >
                    +
                  </button>
                </div>
                <button
                  className={`pc-add-btn ${justAdded ? "pc-add-btn--done" : ""}`}
                  onClick={handleAdd}
                  disabled={justAdded}
                >
                  {justAdded ? "✓ LISTO" : "AGREGAR"}
                </button>
              </div>
            )
          ) : (
            <button className="pc-notify-btn" onClick={handleNotifyMe}>
              <span style={{ fontSize: "14px" }}>💬</span> AVÍSAME CUANDO VUELVA
            </button>
          )}
        </div>
      </div>

      <style>{`
        .pc-card {
          background: #111;
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.05);
          display: flex;
          flex-direction: column;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }
        .pc-card:hover {
          border-color: rgba(232,96,60,0.3);
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.4);
        }
        .pc-card--out { opacity: 0.9; }

        /* Image: Aspect Ratio 4:5 for Premium Look */
        .pc-img-wrap {
          width: 100%;
          aspect-ratio: 4/5;
          position: relative;
          overflow: hidden;
          background: #000;
        }
        .pc-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .pc-card:hover .pc-img { transform: scale(1.08); }

        /* Sold Out States */
        .pc-sold-out-overlay {
          position: absolute; inset: 0;
          background: rgba(0,0,0,0.4);
          backdrop-filter: grayscale(1) blur(2px);
        }
        .pc-sold-out-tag {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          background: #fff; color: #000;
          padding: 8px 16px; border-radius: 100px;
          font-size: 10px; font-weight: 900; letter-spacing: 0.1em;
          display: flex; align-items: center; gap: 6px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        }
        .pc-sold-out-dot {
          width: 6px; height: 6px; background: #E8603C;
          border-radius: 50%;
          animation: pulse-dot 1.5s infinite;
        }
        @keyframes pulse-dot {
          0% { transform: scale(0.8); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.8); opacity: 0.5; }
        }

        .pc-badge-popular {
          position: absolute; top: 12px; left: 12px;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.1);
          color: #fff; font-size: 9px; font-weight: 800;
          padding: 5px 12px; border-radius: 100px;
        }

        /* Body */
        .pc-body {
          padding: 20px;
          flex: 1;
          display: flex;
          flex-direction: column;
          background: linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(0,0,0,0) 100%);
        }
        .pc-header-row {
          display: flex; justify-content: space-between;
          align-items: flex-start; gap: 10px; margin-bottom: 8px;
        }
        .pc-name {
          font-size: 17px; font-weight: 800; color: #fff;
          margin: 0; line-height: 1.2; letter-spacing: -0.01em;
          flex: 1;
        }
        .pc-price {
          font-size: 17px; font-weight: 900; color: ${BRAND_CORAL};
        }
        .pc-desc {
          font-size: 13px; color: rgba(255,255,255,0.5);
          line-height: 1.5; margin: 0 0 20px;
          display: -webkit-box; -webkit-line-clamp: 2;
          -webkit-box-orient: vertical; overflow: hidden;
        }

        /* Controls */
        .pc-controls { margin-top: auto; }

        .pc-qty-ctrl {
          display: flex; align-items: center;
          background: rgba(255,255,255,0.05);
          border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);
        }
        .pc-qty-btn {
          width: 36px; height: 36px; background: none; border: none;
          color: #fff; cursor: pointer; font-size: 18px;
        }
        .pc-qty-val {
          min-width: 30px; text-align: center; font-weight: 800; font-size: 14px;
        }

        .pc-add-row { display: flex; gap: 10px; }
        .pc-add-btn {
          flex: 1; height: 38px; background: #fff; color: #000;
          border: none; border-radius: 12px; font-size: 12px;
          font-weight: 900; cursor: pointer; transition: all 0.2s;
        }
        .pc-add-btn:hover { transform: scale(1.02); background: ${BRAND_CORAL}; color: #fff; }
        .pc-add-btn--done { background: #2D9F6B; color: #fff; }

        .pc-incart {
          display: flex; align-items: center; justify-content: space-between;
          background: ${BRAND_CORAL}; border-radius: 12px; padding: 4px;
        }
        .pc-incart-info { text-align: center; color: #fff; }
        .pc-incart-qty { display: block; font-size: 15px; font-weight: 900; line-height: 1; }
        .pc-incart-label { font-size: 8px; font-weight: 800; opacity: 0.8; }

        .pc-notify-btn {
          width: 100%; height: 42px; background: rgba(255,255,255,0.05);
          color: #fff; border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px; font-size: 11px; font-weight: 800;
          cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .pc-notify-btn:hover { background: rgba(255,255,255,0.1); border-color: ${BRAND_CORAL}; }
      `}</style>
    </div>
  );
}
