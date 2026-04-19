"use client";
import { useState, useMemo, useEffect } from "react";
import { useAppState } from "@/lib/useStore";
import { Product } from "@/lib/mockDB";

export default function DigitalMenu() {
  const { state, hydrated, addOrder } = useAppState();
  const [activeCategory, setActiveCategory] = useState("Todas");
  const [showCart, setShowCart] = useState(false);
  const [cart, setCart] = useState<{product: Product, qty: number}[]>([]);

  if (!hydrated) return (
    <div style={{ minHeight: "100vh", backgroundColor: "#020617", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="skeleton" style={{ width: "200px", height: "40px" }}></div>
    </div>
  );

  const categories = ["Todas", ...Array.from(new Set(state.products.map(p => p.category)))];
  
  const filteredProducts = activeCategory === "Todas" 
    ? state.products 
    : state.products.filter(p => p.category === activeCategory);

  const addToCart = (product: Product) => {
    setCart(prev => {
        const existing = prev.find(item => item.product.id === product.id);
        if (existing) {
            return prev.map(item => item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item);
        }
        return [...prev, { product, qty: 1 }];
    });
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.product.price * item.qty), 0);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-primary)", paddingBottom: "100px" }}>
      {/* Header Premium */}
      <header style={{ padding: "3rem 2rem", textAlign: "center", background: "linear-gradient(to bottom, rgba(249, 115, 22, 0.1), transparent)" }}>
        <h1 style={{ fontSize: "3rem", fontWeight: 900, letterSpacing: "-2px", color: "var(--text-primary)" }}>BRASA CLANDESTINA</h1>
        <p style={{ color: "var(--accent-color)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", fontSize: "0.875rem" }}>Auténtico Sabor de la Calle</p>
      </header>

      {/* Categorías Glaseadas */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, padding: "1rem", display: "flex", gap: "0.75rem", overflowX: "auto", whiteSpace: "nowrap", backdropFilter: "blur(20px)", backgroundColor: "rgba(2, 6, 23, 0.8)", borderBottom: "1px solid var(--border-color)" }}>
        {categories.map(cat => (
          <button 
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{ 
              padding: "0.6rem 1.5rem", borderRadius: "100px", fontSize: "0.85rem", fontWeight: 700, transition: "var(--transition-smooth)",
              backgroundColor: activeCategory === cat ? "var(--accent-color)" : "var(--bg-tertiary)",
              color: activeCategory === cat ? "white" : "var(--text-muted)",
              border: activeCategory === cat ? "none" : "1px solid var(--border-color)"
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid de Productos */}
      <main style={{ padding: "2rem", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "2rem" }}>
        {filteredProducts.map(product => (
          <div key={product.id} className="glass-panel" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ width: "100%", height: "200px", backgroundColor: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
                {/* Image placeholder with accent glow overlay */}
                <div style={{ width: "100%", height: "100%", background: `linear-gradient(45deg, var(--bg-tertiary), var(--bg-secondary))`, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.75rem" }}>
                    FOTO DEL PLATILLO
                </div>
            </div>
            <div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800 }}>{product.name}</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: "0.25rem", height: "40px", overflow: "hidden" }}>{product.description}</p>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
              <span style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--accent-color)" }}>L {product.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              <button 
                onClick={() => addToCart(product)}
                className="btn-primary"
                style={{ padding: "0.6rem 1.25rem", fontSize: "0.75rem" }}
              >
                Añadir +
              </button>
            </div>
          </div>
        ))}
      </main>

      {/* Floating Cart Bar */}
      {cart.length > 0 && (
        <div style={{ position: "fixed", bottom: "2rem", left: "50%", transform: "translateX(-50%)", width: "90%", maxWidth: "500px", zIndex: 100 }}>
            <button 
                onClick={() => setShowCart(true)}
                className="btn-primary" 
                style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 2rem", boxShadow: "0 10px 30px var(--accent-glow)", borderRadius: "var(--radius-lg)" }}
            >
                <span style={{ fontWeight: 800 }}>{cart.reduce((a,b) => a + b.qty, 0)} PRODUCTOS</span>
                <span style={{ fontWeight: 900, fontSize: "1.1rem" }}>VER CARRITO • L {cartTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </button>
        </div>
      )}

      {/* Cart Modal */}
      {showCart && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", zIndex: 200, display: "flex", alignItems: "flex-end" }}>
            <div className="glass-panel" style={{ width: "100%", maxHeight: "80vh", padding: "2rem", borderBottomLeftRadius: 0, borderBottomRightRadius: 0, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                    <h2 style={{ fontSize: "1.5rem", fontWeight: 900 }}>TU PEDIDO</h2>
                    <button onClick={() => setShowCart(false)} style={{ color: "var(--text-muted)", fontSize: "2rem" }}>&times;</button>
                </div>

                <div style={{ flex: 1, overflowY: "auto", marginBottom: "2rem" }}>
                    {cart.map(item => (
                        <div key={item.product.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 0", borderBottom: "1px solid var(--border-color)" }}>
                            <div>
                                <span style={{ fontWeight: 900, color: "var(--accent-color)", marginRight: "1rem" }}>{item.qty}x</span>
                                <span style={{ fontWeight: 700 }}>{item.product.name}</span>
                            </div>
                            <span style={{ fontWeight: 700 }}>L {(item.product.price * item.qty).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                    ))}
                </div>

                <div style={{ padding: "1.5rem", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-md)", marginBottom: "2rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                        <span style={{ color: "var(--text-muted)" }}>Subtotal</span>
                        <span style={{ fontWeight: 700 }}>L {cartTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.25rem", fontWeight: 900 }}>
                        <span>TOTAL</span>
                        <span style={{ color: "var(--accent-color)" }}>L {cartTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>

                <button 
                  className="btn-primary" 
                  style={{ width: "100%", padding: "1.5rem" }}
                  onClick={() => {
                    const orderId = Math.random().toString(36).substr(2, 9).toUpperCase();
                    addOrder({
                        id: orderId,
                        customer_name: "Cliente Web",
                        type: "pickup",
                        status: "pending",
                        payment_method: "efectivo",
                        total: cartTotal,
                        items: cart.map(item => ({ product_id: item.product.id, quantity: item.qty, subtotal: item.product.price * item.qty })),
                        created_at: new Date().toISOString()
                    });
                    setCart([]);
                    setShowCart(false);
                    alert("¡Pedido enviado correctamente a la brasa! TKT #" + orderId);
                  }}
                >
                    CONFIRMAR Y ENVIAR PEDIDO 🔥
                </button>
            </div>
        </div>
      )}
    </div>
  );
}
