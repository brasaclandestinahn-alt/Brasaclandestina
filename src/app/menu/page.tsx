"use client";
import { useState, useMemo, useEffect } from "react";
import { useAppState } from "@/lib/useStore";
import { MOCK_PRODUCTS, MOCK_CONFIG } from "@/lib/mockDB";
import Link from "next/link";

export default function DigitalMenuPage() {
  const { state, hydrated } = useAppState();
  const [activeCategory, setActiveCategory] = useState<string>("");
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
      // Ajuste manual a UTC-6 (Honduras)
      const offset = -6;
      const hondurasTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (offset * 3600000));
      
      const day = hondurasTime.getDay(); // 0=Sun, 4=Thu, 6=Sat
      const hour = hondurasTime.getHours();
      const min = hondurasTime.getMinutes();
      const timeValue = hour + min / 60;
      
      const isOpenTime = (day >= 4 && day <= 6) && (timeValue >= 18.5 && timeValue < 21.5);
      
      let msg = "";
      if (isOpenTime) {
        msg = "¡ESTAMOS ABIERTOS! · Entrega en 35-45 min";
      } else {
        if (day >= 4 && day <= 6 && timeValue < 18.5) {
          msg = "Abrimos hoy a las 6:30pm · Mira el menú y pide más tarde";
        } else {
          msg = "Abrimos el Jueves · 6:30pm — Puedes ver el menú y pedir mañana";
        }
      }
      
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
      const offset = 140; // Header + Nav height
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  const WHATSAPP_BASE = `https://wa.me/${config.whatsapp_number?.replace(/\D/g, '') || '50499999999'}`;
  
  if (!hydrated) return <div style={{ backgroundColor: "#000", minHeight: "100vh" }} />;

  return (
    <div style={{ backgroundColor: "#0A0A0A", color: "#F5EDD8", minHeight: "100vh", paddingBottom: "100px" }}>
      
      {/* Availability Banner */}
      <div style={{ 
        backgroundColor: status.isOpen ? "#22C55E" : "#E8593C", 
        color: "white", 
        textAlign: "center", 
        padding: "0.5rem", 
        fontSize: "0.75rem", 
        fontWeight: 800,
        position: "fixed",
        top: 0,
        width: "100%",
        zIndex: 1001,
        letterSpacing: "0.05em"
      }}>
        {status.message}
      </div>

      {/* Fixed Header */}
      <header style={{ 
        position: "fixed", 
        top: "30px", // Banner height
        width: "100%", 
        backgroundColor: "rgba(10,10,10,0.95)", 
        backdropFilter: "blur(10px)",
        padding: "1rem 1.5rem",
        borderBottom: "1px solid rgba(245,237,216,0.1)",
        zIndex: 1000,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <Link href="/" style={{ textDecoration: "none" }}>
            <h1 className="serif" style={{ fontSize: "1.25rem", color: "#E8593C", margin: 0 }}>Brasa Clandestina</h1>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: status.isOpen ? "#22C55E" : "#EF4444" }} />
            <span style={{ fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase" }}>
                {status.isOpen ? "Abierto" : "Cerrado"}
            </span>
        </div>
      </header>

      {/* Sticky Categories Navigation */}
      <nav style={{ 
        position: "fixed", 
        top: "94px", // Banner + Header
        width: "100%", 
        backgroundColor: "#0A0A0A",
        padding: "0.75rem 0",
        borderBottom: "1px solid rgba(245,237,216,0.1)",
        zIndex: 999,
        display: "flex",
        overflowX: "auto",
        gap: "0.75rem",
        paddingInline: "1.5rem",
        scrollbarWidth: "none"
      }} className="hide-scrollbar">
        {categories.map(cat => (
          <button 
            key={cat}
            onClick={() => scrollToCategory(cat)}
            style={{
              padding: "0.6rem 1.25rem",
              borderRadius: "100px",
              backgroundColor: activeCategory === cat ? "#E8593C" : "rgba(245,237,216,0.05)",
              color: activeCategory === cat ? "white" : "#F5EDD8",
              border: "none",
              fontSize: "0.75rem",
              fontWeight: 800,
              whiteSpace: "nowrap",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            {cat}
          </button>
        ))}
      </nav>

      {/* Menu Content */}
      <main style={{ padding: "180px 1.5rem 2rem", maxWidth: "800px", margin: "0 auto" }}>
        {categories.map(category => (
          <section key={category} id={`category-${category}`} style={{ marginBottom: "3rem" }}>
            <h2 className="serif" style={{ 
                fontSize: "1.75rem", 
                marginBottom: "1.5rem", 
                color: "#E8593C",
                borderLeft: "4px solid #E8593C",
                paddingLeft: "1rem"
            }}>
                {category}
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
              {displayProducts.filter(p => p.category === category).map(product => (
                <div key={product.id} style={{ 
                  backgroundColor: "#1A1A1A", 
                  borderRadius: "1.25rem", 
                  overflow: "hidden",
                  border: "1px solid rgba(245,237,216,0.05)",
                  display: "flex",
                  flexDirection: "column"
                }}>
                  {/* Product Image */}
                  <div style={{ width: "100%", aspectRatio: "16/9", position: "relative", backgroundColor: "#222" }}>
                    <img 
                        src={product.image_url || `https://images.unsplash.com/photo-1544025162-d76694265947?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`} 
                        alt={product.name}
                        loading="lazy"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>

                  <div style={{ padding: "1.25rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                        <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, lineHeight: "1.2" }}>{product.name}</h3>
                        <span style={{ fontSize: "1.25rem", fontWeight: 900, color: "#22C55E", fontFamily: "monospace" }}>
                            L. {product.price}
                        </span>
                    </div>
                    <p style={{ 
                        fontSize: "1rem", 
                        color: "#94A3B8", 
                        marginBottom: "1.5rem",
                        lineHeight: "1.5",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        minHeight: "3rem"
                    }}>
                        {product.description || "Nuestro asado artesanal preparado con técnicas tradicionales de la casa."}
                    </p>

                    <a 
                      href={`${WHATSAPP_BASE}?text=${encodeURIComponent(`Hola, quiero pedir: ${product.name}`)}`}
                      target="_blank"
                      style={{ 
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                        width: "100%", 
                        padding: "0.85rem", 
                        backgroundColor: "#E8593C", 
                        color: "white", 
                        textDecoration: "none", 
                        borderRadius: "0.75rem",
                        fontWeight: 800,
                        fontSize: "0.9rem",
                        height: "48px"
                      }}
                    >
                      <span>🔥</span> PEDIR ESTE PLATO
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>

      {/* Floating WhatsApp Button */}
      <a 
        href={`${WHATSAPP_BASE}?text=${encodeURIComponent("Hola, quiero hacer un pedido 🔥")}`}
        target="_blank"
        style={{
            position: "fixed",
            bottom: "1.5rem",
            right: "1.5rem",
            backgroundColor: "#22C55E",
            color: "white",
            padding: "1rem 1.5rem",
            borderRadius: "100px",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            textDecoration: "none",
            boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
            zIndex: 1002,
            fontWeight: 800,
            fontSize: "0.9rem",
            border: "2px solid rgba(255,255,255,0.1)"
        }}
      >
        <span style={{ fontSize: "1.2rem" }}>💬</span>
        <span>Hacer pedido completo</span>
      </a>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .serif { font-family: 'Playfair Display', serif; }
        body { margin: 0; background-color: #0A0A0A; }
      `}</style>
    </div>
  );
}
