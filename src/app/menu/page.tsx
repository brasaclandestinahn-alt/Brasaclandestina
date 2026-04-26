"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import { useAppState } from "@/lib/useStore";
import { MOCK_PRODUCTS, MOCK_CONFIG } from "@/lib/mockDB";
import { Product } from "@/lib/mockDB";

import CartDrawer from "@/components/Cart/CartDrawer";
import FloatingCartBar from "@/components/Cart/FloatingCartBar";
import ProductCard from "@/components/Menu/ProductCard";

const HEADER_HEIGHT = 120; // Aproximado para compensar el sticky

export default function DigitalMenuPage() {
  const { state, getProductAvailability, getCartCount } = useAppState();
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const config = state.config || MOCK_CONFIG;

  const displayProducts: Product[] = useMemo(
    () => (state.products && state.products.length > 0 ? state.products : MOCK_PRODUCTS),
    [state.products]
  );
  
  const categories = useMemo(() => {
    // Categorías que tienen productos activos
    const catsWithProducts = new Set(
      displayProducts.map((p) => p.category)
    );
    
    // Mantener el orden definido en config.categories
    const ordered = state.categories.filter(cat => 
      catsWithProducts.has(cat)
    );
    
    // Agregar al final las categorías que tienen productos 
    // pero no están en config (por si acaso)
    const extra = [...catsWithProducts].filter(
      cat => !state.categories.includes(cat)
    );
    
    return [...ordered, ...extra];
  }, [displayProducts, state.categories, config.categories]);

  // Intersection Observer para detectar categoría activa
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: `-${HEADER_HEIGHT}px 0px -70% 0px`,
      threshold: 0,
    };

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const categoryId = entry.target.id.replace("cat-", "");
          setActiveCategory(categoryId);
          
          // Scroll horizontal automático de la barra de categorías
          const navButton = document.getElementById(`nav-btn-${categoryId}`);
          if (navButton) {
            navButton.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
              inline: "center",
            });
          }
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);
    const sections = document.querySelectorAll('[id^="cat-"]');
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [categories]);

  const scrollToCategory = (cat: string) => {
    const element = document.getElementById(`cat-${cat}`);
    if (element) {
      const offset = HEADER_HEIGHT - 10;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: "smooth",
      });
    }
  };

  // Status badge logic
  const [status, setStatus] = useState({ isOpen: false, message: "" });
  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const hn = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + -6 * 3600000);
      const d = hn.getDay(), h = hn.getHours(), m = hn.getMinutes(), t = h + m / 60;
      const open = d >= 4 && d <= 6 && t >= 18.5 && t < 21.5;
      setStatus({
        isOpen: open,
        message: open
          ? "¡ESTAMOS ABIERTOS! · Entrega en 35-45 min"
          : d >= 4 && d <= 6 && t < 18.5
          ? "Abrimos hoy a las 6:30 pm · San Pedro Sula"
          : "Abrimos el Jueves · 6:30 pm · San Pedro Sula",
      });
    };
    calc();
    const t = setInterval(calc, 60000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "#fff" }}>
      
      {/* ── STICKY HEADER & NAV ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 1000,
        background: "rgba(5, 5, 5, 0.8)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.05)"
      }}>
        {/* Top Status Bar */}
        <div style={{
          background: status.isOpen ? "rgba(34, 197, 94, 0.15)" : "rgba(232, 96, 60, 0.15)",
          color: status.isOpen ? "#4ade80" : "#fb923c",
          textAlign: "center", padding: "6px 0", fontSize: "10px", fontWeight: 800,
          letterSpacing: "0.1em", textTransform: "uppercase",
          borderBottom: "1px solid rgba(255,255,255,0.03)"
        }}>
          <span style={{ 
            display: "inline-block", width: "6px", height: "6px", 
            borderRadius: "50%", background: "currentColor", 
            marginRight: "8px", verticalAlign: "middle",
            boxShadow: "0 0 10px currentColor",
            animation: status.isOpen ? "pulse 2s infinite" : "none"
          }} />
          {status.message}
        </div>

        {/* Main Logo & Cart Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 24px", maxWidth: "1400px", margin: "0 auto"
        }}>
          <h1 style={{ 
            margin: 0, fontSize: "22px", fontWeight: 900, 
            letterSpacing: "-0.02em", color: "#fff" 
          }}>
            BRASA<span style={{ color: "#E8603C" }}>CLANDESTINA</span>
          </h1>

          <button
            onClick={() => setIsCartOpen(true)}
            style={{
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "14px", padding: "8px 16px", color: "#fff",
              display: "flex", alignItems: "center", gap: "10px", cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            <span style={{ fontSize: "18px" }}>🛒</span>
            <span style={{ fontWeight: 800, fontSize: "14px" }}>{getCartCount()}</span>
          </button>
        </div>

        {/* Horizontal Category Scroller */}
        <nav className="hide-scrollbar" style={{
          display: "flex", gap: "12px", padding: "0 24px 16px",
          overflowX: "auto", maxWidth: "1400px", margin: "0 auto"
        }}>
          {categories.map((cat) => (
            <button
              key={cat}
              id={`nav-btn-${cat}`}
              onClick={() => scrollToCategory(cat)}
              style={{
                padding: "8px 20px", borderRadius: "100px",
                background: activeCategory === cat ? "#E8603C" : "rgba(255,255,255,0.03)",
                color: activeCategory === cat ? "#fff" : "rgba(255,255,255,0.4)",
                border: "1px solid " + (activeCategory === cat ? "#E8603C" : "rgba(255,255,255,0.08)"),
                fontSize: "11px", fontWeight: 800, whiteSpace: "nowrap",
                cursor: "pointer", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                letterSpacing: "0.05em"
              }}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </nav>
      </header>

      {/* ── HERO SECTION ── */}
      <section 
        style={{
          position: "relative",
          padding: "100px 24px 80px",
          overflow: "hidden",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "400px"
        }}
      >
        {/* Background Image with Overlay */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${config.hero_image_url || 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=1600'})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          zIndex: 0
        }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(5,5,5,0.6) 0%, rgba(5,5,5,0.95) 100%)",
          zIndex: 1
        }} />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 2, maxWidth: "800px" }}>
          <div style={{ 
            display: "inline-block", padding: "6px 16px", borderRadius: "100px",
            background: "rgba(232, 96, 60, 0.2)", border: "1px solid rgba(232, 96, 60, 0.3)",
            color: "#E8603C", fontSize: "10px", fontWeight: 900, letterSpacing: "0.2em",
            marginBottom: "24px"
          }}>
            {config.hero_badge || "EXPERIENCIA ARTESANAL"}
          </div>
          <h2 style={{ 
            fontSize: "clamp(2.5rem, 8vw, 4.5rem)", fontWeight: 900, 
            lineHeight: 1, margin: "0 0 20px", letterSpacing: "-0.03em"
          }}>
            {config.hero_title_line1 || "EL SABOR DE LA"} <br/>
            <span style={{ 
              color: "#E8603C",
              textShadow: "0 0 30px rgba(232, 96, 60, 0.4)"
            }}>{config.hero_title_line2 || "BRASA REAL."}</span>
          </h2>
          <p style={{ 
            fontSize: "clamp(1rem, 3vw, 1.2rem)", color: "rgba(255,255,255,0.7)",
            maxWidth: "600px", margin: "0 auto 40px", lineHeight: 1.6
          }}>
            {config.hero_description || "Hamburguesas y cortes premium preparados con fuego de leña y pasión clandestina en San Pedro Sula."}
          </p>

          {/* Social Proof */}
          <div style={{ 
            display: "flex", alignItems: "center", justifyContent: "center", 
            gap: "20px", flexWrap: "wrap" 
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ display: "flex", color: "#FFD700" }}>⭐⭐⭐⭐⭐</div>
              <span style={{ fontSize: "12px", fontWeight: 700, opacity: 0.8 }}>+500 Clientes Felices</span>
            </div>
            <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.1)" }} />
            <div style={{ fontSize: "12px", fontWeight: 700, opacity: 0.8 }}>
              🛵 Delivery Propio y App
            </div>
          </div>
        </div>
      </section>

      {/* ── MENU CONTENT ── */}
      <main style={{ padding: "40px 24px 120px", maxWidth: "1400px", margin: "0 auto" }}>
        {categories.map((cat) => {
          const products = displayProducts.filter((p) => p.category === cat && p.is_active !== false);
          if (products.length === 0) return null;

          return (
            <section
              key={cat}
              id={`cat-${cat}`}
              style={{ marginBottom: "80px", scrollMarginTop: "120px" }}
            >
              {/* Category Header */}
              <div style={{ 
                display: "flex", alignItems: "center", gap: "20px", marginBottom: "40px" 
              }}>
                <h3 style={{ 
                  margin: 0, fontSize: "28px", fontWeight: 900, 
                  textTransform: "uppercase", letterSpacing: "0.05em" 
                }}>
                  {cat}
                </h3>
                <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
                <span style={{ fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.3)" }}>
                  {products.length} ITEMS
                </span>
              </div>

              <div className="products-grid">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    availability={getProductAvailability(product)}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </main>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <FloatingCartBar onClick={() => setIsCartOpen(true)} />

      <style>{`
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        
        .products-grid {
          display: grid;
          gap: 30px;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        }

        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }

        @media (max-width: 640px) {
          .products-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
        }
      `}</style>
    </div>
  );
}
