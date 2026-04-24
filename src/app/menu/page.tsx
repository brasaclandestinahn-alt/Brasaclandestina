"use client";
import { useState, useMemo, useEffect } from "react";
import { useAppState } from "@/lib/useStore";
import { MOCK_PRODUCTS, MOCK_CONFIG } from "@/lib/mockDB";
import Link from "next/link";
import CartDrawer from "@/components/Cart/CartDrawer";

export default function DigitalMenuPage() {
  const { state, hydrated, addOrder, getProductAvailability } = useAppState();
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>({});

  const config = state.config || MOCK_CONFIG;

  const displayProducts = useMemo(() => {
    return (state.products && state.products.length > 0) ? state.products : MOCK_PRODUCTS;
  }, [state.products]);

  const categories = useMemo(() => {
    return Array.from(new Set(displayProducts.map(p => p.category)));
  }, [displayProducts]);

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  const [status, setStatus] = useState({ isOpen: false, message: "" });

  useEffect(() => {
    const updateStatus = () => {
      const now = new Date();
      const offset = -6;
      const hondurasTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (offset * 3600000));
      const day = hondurasTime.getDay();
      const hour = hondurasTime.getHours();
      const min = hondurasTime.getMinutes();
      const timeValue = hour + min / 60;
      
      const isOpenTime = (day >= 4 && day <= 6) && (timeValue >= 18.5 && timeValue < 21.5);
      let msg = isOpenTime ? "¡ESTAMOS ABIERTOS! · Entrega en 35-45 min" : (day >= 4 && day <= 6 && timeValue < 18.5) ? "Abrimos hoy a las 6:30pm · Mira el menú y pide más tarde" : "Abrimos el Jueves · 6:30pm — Puedes ver el menú y pedir mañana";
      setStatus({ isOpen: isOpenTime, message: msg });
    };
    updateStatus();
    const timer = setInterval(updateStatus, 60000);
    return () => clearInterval(timer);
  }, []);

  const scrollToCategory = (cat: string) => {
    setActiveCategory(cat);
    const element = document.getElementById(`category-${cat}`);
    if (element) {
      window.scrollTo({ top: element.getBoundingClientRect().top + window.pageYOffset - 140, behavior: "smooth" });
    }
  };

  const handleUpdateQty = (productId: string, delta: number) => {
    setProductQuantities(prev => ({
      ...prev,
      [productId]: Math.max(1, (prev[productId] || 1) + delta)
    }));
  };

  const addToCart = (product: any) => {
    const qty = productQuantities[product.id] || 1;
    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.id);
      if (existing) {
        return prev.map(item => item.product_id === product.id ? { ...item, quantity: item.quantity + qty } : item);
      }
      return [...prev, { product_id: product.id, product_name: product.name, price: product.price, image_url: product.image_url, quantity: qty }];
    });
    setProductQuantities(prev => ({ ...prev, [product.id]: 1 }));
    setIsCartOpen(true);
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => item.product_id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item).filter(item => item.quantity > 0));
  };

  const handleFinalCheckout = (customerData: any) => {
    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0) + 50;
    const order = {
      id: "ORDER_" + Date.now().toString(36),
      customer_name: customerData.name,
      customer_phone: customerData.phone,
      customer_address: customerData.address,
      payment_method: customerData.payment,
      type: "delivery" as any,
      status: "pending",
      items: cart.map(i => ({ product_id: i.product_id, product_name: i.product_name, quantity: i.quantity, subtotal: i.price * i.quantity })),
      total,
      created_at: new Date().toISOString()
    };
    addOrder(order);
    
    const orderText = cart.map(i => `- ${i.quantity}x ${i.product_name}`).join("\n");
    const msg = `🔥 ¡Nuevo Pedido Brasa Clandestina! 🔥\n\n👤 Cliente: ${customerData.name}\n📞 Tel: ${customerData.phone}\n📍 Dir: ${customerData.address}\n💳 Pago: ${customerData.payment}\n\nDetalle:\n${orderText}\n\nTOTAL: L. ${total.toFixed(2)}\n\n¡Gracias por preferirnos! Brasa Clandestina.`;
    window.open(`https://wa.me/${config.whatsapp_number?.replace(/\D/g, '') || '50499999999'}?text=${encodeURIComponent(msg)}`, "_blank");
    
    setCart([]);
    setIsCartOpen(false);
  };

  if (!hydrated) return <div style={{ backgroundColor: "#000", minHeight: "100vh" }} />;

  return (
    <div style={{ backgroundColor: "#0A0A0A", color: "#F5EDD8", minHeight: "100vh", paddingBottom: "100px" }}>
      
      {/* Banner */}
      <div style={{ backgroundColor: status.isOpen ? "#22C55E" : "#E8593C", color: "white", textAlign: "center", padding: "0.5rem", fontSize: "0.75rem", fontWeight: 800, position: "fixed", top: 0, width: "100%", zIndex: 1001 }}>
        {status.message}
      </div>

      {/* Header */}
      <header style={{ position: "fixed", top: "30px", width: "100%", backgroundColor: "rgba(10,10,10,0.95)", backdropFilter: "blur(10px)", padding: "1rem 1.5rem", borderBottom: "1px solid rgba(245,237,216,0.1)", zIndex: 1000, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/" style={{ textDecoration: "none" }}>
            <h1 className="serif" style={{ fontSize: "1.25rem", color: "#E8593C", margin: 0 }}>Brasa Clandestina</h1>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button onClick={() => setIsCartOpen(true)} style={{ background: "rgba(232, 89, 60, 0.1)", border: "1px solid #E8593C", color: "white", padding: "0.6rem 1.2rem", borderRadius: "100px", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", position: "relative" }}>
                <span style={{ fontSize: "1.2rem" }}>🛒</span>
                <span style={{ fontWeight: 900, fontSize: "1rem" }}>{cart.reduce((a, b) => a + b.quantity, 0)}</span>
                {cart.length > 0 && <span style={{ position: "absolute", top: "-5px", right: "-5px", width: "12px", height: "12px", backgroundColor: "#22C55E", borderRadius: "50%", border: "2px solid #0A0A0A" }} />}
            </button>
        </div>
      </header>

      {/* Categories */}
      <nav style={{ position: "fixed", top: "94px", width: "100%", backgroundColor: "#0A0A0A", padding: "0.75rem 0", borderBottom: "1px solid rgba(245,237,216,0.1)", zIndex: 999, display: "flex", overflowX: "auto", gap: "0.75rem", paddingInline: "1.5rem" }} className="hide-scrollbar">
        {categories.map(cat => (
          <button key={cat} onClick={() => scrollToCategory(cat)} style={{ padding: "0.6rem 1.25rem", borderRadius: "100px", backgroundColor: activeCategory === cat ? "#E8593C" : "rgba(245,237,216,0.05)", color: activeCategory === cat ? "white" : "#F5EDD8", border: "none", fontSize: "0.75rem", fontWeight: 800, whiteSpace: "nowrap", cursor: "pointer" }}>
            {cat}
          </button>
        ))}
      </nav>

      {/* Main Grid */}
      <main style={{ padding: "180px 1.5rem 2rem", maxWidth: "1200px", margin: "0 auto" }}>
        {categories.map(category => (
          <section key={category} id={`category-${category}`} style={{ marginBottom: "5rem" }}>
            <h2 className="serif" style={{ fontSize: "2rem", marginBottom: "2.5rem", color: "#E8593C", borderLeft: "5px solid #E8593C", paddingLeft: "1.25rem" }}>{category}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "2.5rem" }}>
              {displayProducts.filter(p => p.category === category).map(product => {
                const availability = getProductAvailability(product);
                const isOut = availability <= 0;
                
                return (
                  <div key={product.id} style={{ backgroundColor: "#141414", borderRadius: "1.5rem", overflow: "hidden", border: "1px solid rgba(245,237,216,0.05)", display: "flex", flexDirection: "column", position: "relative" }}>
                    <div style={{ width: "100%", aspectRatio: "1/1", position: "relative", backgroundColor: "#000" }}>
                      <img src={product.image_url || `https://images.unsplash.com/photo-1544025162-d76694265947?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`} alt={product.name} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: isOut ? 0.3 : 0.8 }} />
                      
                      {isOut && (
                        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", backgroundColor: "#E8593C", color: "white", padding: "0.5rem 1.5rem", borderRadius: "100px", fontWeight: 900, fontSize: "0.9rem", letterSpacing: "0.1em", boxShadow: "0 10px 20px rgba(0,0,0,0.5)" }}>
                            AGOTADO
                        </div>
                      )}

                      <div style={{ position: "absolute", bottom: "1rem", left: "1rem", backgroundColor: "rgba(0,0,0,0.8)", padding: "0.5rem 1rem", borderRadius: "100px", border: "1px solid rgba(255,255,255,0.1)" }}>
                        <span style={{ fontSize: "1.25rem", fontWeight: 900, color: "#F5EDD8" }}>L. {product.price}</span>
                      </div>
                    </div>
                    
                    <div style={{ padding: "1.5rem", flex: 1, display: "flex", flexDirection: "column" }}>
                      <h3 className="serif" style={{ fontSize: "1.5rem", fontWeight: 900, margin: "0 0 0.5rem", color: "#F5EDD8" }}>{product.name}</h3>
                      <p style={{ fontSize: "0.9rem", color: "#94A3B8", marginBottom: "1.5rem", lineHeight: "1.6", flex: 1 }}>{product.description || "Asado artesanal preparado con fuego real y técnicas tradicionales."}</p>
                      
                      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                        {!isOut ? (
                          <>
                            <div style={{ display: "flex", alignItems: "center", backgroundColor: "#0A0A0A", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.1)" }}>
                                <button onClick={() => handleUpdateQty(product.id, -1)} style={{ background: "none", border: "none", color: "white", width: "36px", height: "44px", cursor: "pointer", fontSize: "1.2rem", fontWeight: 900 }}>-</button>
                                <span style={{ width: "24px", textAlign: "center", fontSize: "1rem", fontWeight: 900, color: "#E8593C" }}>{productQuantities[product.id] || 1}</span>
                                <button onClick={() => handleUpdateQty(product.id, 1)} style={{ background: "none", border: "none", color: "white", width: "36px", height: "44px", cursor: "pointer", fontSize: "1.2rem", fontWeight: 900 }}>+</button>
                            </div>
                            <button onClick={() => addToCart(product)} style={{ flex: 1, height: "44px", backgroundColor: "#E8593C", color: "white", border: "none", borderRadius: "0.75rem", fontWeight: 900, fontSize: "0.8rem", cursor: "pointer", letterSpacing: "0.05em" }}>
                                AÑADIR AL CARRITO
                            </button>
                          </>
                        ) : (
                          <button disabled style={{ width: "100%", height: "44px", backgroundColor: "rgba(255,255,255,0.05)", color: "#94A3B8", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.75rem", fontWeight: 900, fontSize: "0.8rem", cursor: "not-allowed" }}>
                            PRODUCTO AGOTADO
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </main>

      <CartDrawer items={cart} isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} onUpdateQuantity={updateCartQty} onCheckout={handleFinalCheckout} />

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .serif { font-family: 'Playfair Display', serif; }
      `}</style>
    </div>
  );
}
