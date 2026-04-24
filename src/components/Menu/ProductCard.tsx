"use client";
import { Product } from "@/lib/mockDB";
import { formatCurrency } from "@/lib/utils";
import { useAppState } from "@/lib/useStore";
import { useState } from "react";

interface ProductCardProps {
  product: Product;
  availability: number;
}

export default function ProductCard({ product, availability }: ProductCardProps) {
  const { state, addToCart, updateQuantity } = useAppState();
  const [localQty, setLocalQty] = useState(1);
  const isOutOfStock = availability <= 0;
  const inCart = state.cart.find(i => i.id === product.id);

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: localQty,
      category: product.category,
      image_url: product.image_url
    });
    setLocalQty(1);
  };

  return (
    <div
      className="glass-panel animate-fade"
      style={{
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        border: "1px solid rgba(245, 237, 216, 0.05)",
        background: "var(--bg-panel)",
        opacity: isOutOfStock ? 0.5 : 1,
        position: "relative"
      }}
    >
      {/* Badges */}
      <div style={{ position: "absolute", top: "1rem", left: "1rem", zIndex: 5, display: "flex", gap: "0.5rem" }}>
        {product.price > 400 && <span className="badge badge-red">Más Pedido</span>}
        {product.id.includes("new") && <span className="badge badge-gold">Nuevo</span>}
      </div>

      {/* Image Container */}
      <div
        style={{
          width: "100%",
          aspectRatio: "1 / 1",
          backgroundColor: "#1a1a1a",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <img 
          src={
            (product.image_url && product.image_url.trim().length > 10) 
              ? product.image_url 
              : (product.category?.toLowerCase().includes("alita") || product.category?.toLowerCase().includes("pollo"))
                ? "https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&q=80&w=800"
                : (product.category?.toLowerCase().includes("asado") || product.category?.toLowerCase().includes("carne") || product.category?.toLowerCase().includes("chuleta"))
                  ? "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800"
                  : "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800"
          } 
          alt={product.name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: isOutOfStock ? "grayscale(100%)" : "none",
            display: "block"
          }}
        />
        {isOutOfStock && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.7)"
          }}>
            <span className="badge badge-red" style={{ padding: "0.5rem 1.5rem" }}>AGOTADO</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "1.5rem", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
          <h3 style={{ fontSize: "1.25rem", color: "var(--text-cream)", margin: 0 }}>{product.name}</h3>
          <div style={{ display: "flex", gap: "2px" }}>
            {[1, 2].map(i => (
              <span key={i} style={{ color: i <= 2 ? "var(--accent-red)" : "rgba(255,255,255,0.1)", fontSize: "0.8rem" }}>🔥</span>
            ))}
          </div>
        </div>

        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "1.5rem", flex: 1 }}>
          {product.description || "Parrilla artesanal preparada al momento con leña real."}
        </p>

        <div style={{ marginTop: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--accent-gold)" }}>
              {formatCurrency(product.price)}
            </span>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            {!isOutOfStock ? (
              <>
                {inCart ? (
                  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(232, 89, 60, 0.1)", borderRadius: "100px", border: "1.5px solid var(--accent-red)", padding: "0 0.5rem" }}>
                    <button onClick={() => updateQuantity(product.id, inCart.quantity - 1)} style={{ background: "none", border: "none", color: "white", width: "36px", height: "40px", cursor: "pointer", fontSize: "1.2rem", fontWeight: 900 }}>-</button>
                    <div style={{ textAlign: "center" }}>
                      <span style={{ display: "block", fontSize: "0.5rem", fontWeight: 900, opacity: 0.6, textTransform: "uppercase" }}>En carrito</span>
                      <span style={{ display: "block", fontSize: "0.9rem", fontWeight: 900, color: "var(--accent-red)", marginTop: "-2px" }}>{inCart.quantity}</span>
                    </div>
                    <button onClick={() => updateQuantity(product.id, inCart.quantity + 1)} style={{ background: "none", border: "none", color: "white", width: "36px", height: "40px", cursor: "pointer", fontSize: "1.2rem", fontWeight: 900 }}>+</button>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", alignItems: "center", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "100px", border: "1px solid var(--border-color)" }}>
                      <button onClick={() => setLocalQty(Math.max(1, localQty - 1))} style={{ background: "none", border: "none", color: "white", width: "32px", height: "40px", cursor: "pointer", fontSize: "1rem", fontWeight: 900 }}>-</button>
                      <span style={{ width: "20px", textAlign: "center", fontSize: "0.9rem", fontWeight: 900, color: "var(--accent-red)" }}>{localQty}</span>
                      <button onClick={() => setLocalQty(localQty + 1)} style={{ background: "none", border: "none", color: "white", width: "32px", height: "40px", cursor: "pointer", fontSize: "1rem", fontWeight: 900 }}>+</button>
                    </div>
                    <button onClick={handleAddToCart} className="btn-primary" style={{ flex: 1, padding: "0 1rem", fontSize: "0.7rem", height: "40px", borderRadius: "100px", gap: "0.4rem" }}>
                      <span>🛒</span> AGREGAR
                    </button>
                  </>
                )}
              </>
            ) : (
              <button disabled className="btn-primary" style={{ width: "100%", opacity: 0.5, cursor: "not-allowed", backgroundColor: "#333", border: "none" }}>
                AGOTADO
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
