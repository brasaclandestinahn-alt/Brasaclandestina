"use client";
import { Product } from "@/lib/mockDB";
import { formatCurrency } from "@/lib/utils";
import { useAppState } from "@/lib/useStore";
import { useState, useEffect } from "react";

interface ProductCardProps {
  product: Product;
  availability: number;
}

export default function ProductCard({ product, availability }: ProductCardProps) {
  const { state, addToCart, updateQuantity } = useAppState();
  const [isAdding, setIsAdding] = useState(false);
  
  const isOutOfStock = availability <= 0;
  const inCart = state.cart.find(i => i.id === product.id);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAdding(true);
    setTimeout(() => setIsAdding(false), 200);
    
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      category: product.category,
      image_url: product.image_url
    });

    // Toast notification event
    window.dispatchEvent(new CustomEvent('show-toast', { 
      detail: { message: `✓ ${product.name} agregado al pedido` } 
    }));
  };

  const placeholderImg = "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800";

  return (
    <div className={`product-card ${isOutOfStock ? 'out-of-stock' : ''}`}>
      {/* Desktop Layout (Horizontal) */}
      <div className="card-desktop">
        <div className="image-container">
          <img src={product.image_url || placeholderImg} alt={product.name} />
          {isOutOfStock && <div className="out-overlay">AGOTADO</div>}
        </div>
        
        <div className="card-info">
          <div className="info-top">
            <h3 className="product-name">{product.name}</h3>
            {!inCart && !isOutOfStock && (
              <button 
                onClick={handleAdd}
                className={`add-btn-circle ${isAdding ? 'pulse' : ''}`}
              >
                +
              </button>
            )}
          </div>
          
          <p className="product-desc">{product.description || "Asado artesanal preparado con fuego real."}</p>
          
          <div className="info-bottom">
            <span className="product-price">{formatCurrency(product.price)}</span>
            
            {inCart && (
              <div className="qty-controls-inline">
                <button onClick={() => updateQuantity(product.id, inCart.quantity - 1)} className="qty-act">-</button>
                <span className="qty-val">{inCart.quantity}</span>
                <button onClick={() => updateQuantity(product.id, inCart.quantity + 1)} className="qty-act">+</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Layout (Vertical) */}
      <div className="card-mobile">
        <div className="mobile-image">
          <img src={product.image_url || placeholderImg} alt={product.name} />
          {isOutOfStock && <div className="out-overlay">AGOTADO</div>}
          {!inCart && !isOutOfStock && (
            <button 
              onClick={handleAdd}
              className={`mobile-add-fab ${isAdding ? 'pulse' : ''}`}
            >
              +
            </button>
          )}
        </div>
        
        <div className="mobile-info">
          <div className="mobile-info-top">
             <h3 className="product-name">{product.name}</h3>
             <span className="product-price">{formatCurrency(product.price)}</span>
          </div>
          <p className="product-desc">{product.description || "Asado artesanal preparado con fuego real."}</p>
          
          {inCart && (
            <div className="qty-controls-inline mobile-qty">
              <button onClick={() => updateQuantity(product.id, inCart.quantity - 1)} className="qty-act">-</button>
              <span className="qty-val">{inCart.quantity}</span>
              <button onClick={() => updateQuantity(product.id, inCart.quantity + 1)} className="qty-act">+</button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .product-card {
          background: #141414;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.2s ease;
          overflow: hidden;
        }
        .product-card:hover {
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(232, 96, 60, 0.2);
        }
        .out-of-stock {
          opacity: 0.6;
        }

        /* Desktop Styles */
        .card-desktop {
          display: flex;
          padding: 16px;
          gap: 16px;
        }
        @media (max-width: 1023px) {
          .card-desktop { display: none; }
        }
        .image-container {
          width: 80px;
          height: 80px;
          border-radius: 10px;
          overflow: hidden;
          flex-shrink: 0;
          position: relative;
        }
        .image-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .out-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          font-weight: 900;
          color: white;
          letter-spacing: 1px;
        }

        .card-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .info-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 4px;
        }
        .product-name {
          font-size: 15px;
          font-weight: 700;
          color: white;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .add-btn-circle {
          width: 36px;
          height: 36px;
          background: #E8593C;
          color: white;
          border: none;
          border-radius: 50%;
          font-size: 20px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s;
        }
        .add-btn-circle:hover { transform: scale(1.1); }
        .pulse { transform: scale(1.3) !important; }

        .product-desc {
          font-size: 12px;
          color: #94A3B8;
          margin: 0 0 12px;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .info-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
        }
        .product-price {
          font-size: 15px;
          font-weight: 700;
          color: #E8593C;
        }

        /* Controls */
        .qty-controls-inline {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255,255,255,0.05);
          padding: 4px 8px;
          border-radius: 100px;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .qty-act {
          background: none;
          border: none;
          color: white;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .qty-val {
          font-size: 14px;
          font-weight: 700;
          color: #E8593C;
        }

        /* Mobile Styles */
        .card-mobile {
          display: none;
          flex-direction: column;
        }
        @media (max-width: 1023px) {
          .card-mobile { display: flex; }
        }
        .mobile-image {
          width: 100%;
          aspect-ratio: 16/9;
          position: relative;
        }
        .mobile-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .mobile-add-fab {
          position: absolute;
          bottom: 12px;
          right: 12px;
          width: 44px;
          height: 44px;
          background: #E8593C;
          color: white;
          border: none;
          border-radius: 50%;
          font-size: 24px;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(232, 89, 60, 0.4);
        }
        .mobile-info {
          padding: 16px;
        }
        .mobile-info-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .mobile-qty {
          margin-top: 12px;
          justify-content: center;
          width: fit-content;
        }
      `}</style>
    </div>
  );
}
