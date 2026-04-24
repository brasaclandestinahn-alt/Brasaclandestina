"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import { useAppState } from "@/lib/useStore";
import { MOCK_PRODUCTS } from "@/lib/mockDB";
import { Product } from "@/lib/mockDB";

import CartDrawer from "@/components/Cart/CartDrawer";
import FloatingCartBar from "@/components/Cart/FloatingCartBar";
import ProductCard from "@/components/Menu/ProductCard";

const HEADER_H = 96; // banner (28) + header (68)

export default function DigitalMenuPage() {
  const { state, getProductAvailability } = useAppState();
  const [activeCategory, setActiveCategory] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);

  const displayProducts: Product[] = useMemo(
    () => (state.products && state.products.length > 0 ? state.products : MOCK_PRODUCTS),
    [state.products]
  );
  const categories = useMemo(
    () => Array.from(new Set(displayProducts.map((p) => p.category))),
    [displayProducts]
  );

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) setActiveCategory(categories[0]);
  }, [categories, activeCategory]);

  // Status badge
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
          ? "Abrimos hoy a las 6:30 pm · Puedes ver el menú y pedir más tarde"
          : "Abrimos el Jueves · 6:30 pm — Puedes ver el menú y hacer tu pedido",
      });
    };
    calc();
    const t = setInterval(calc, 60000);
    return () => clearInterval(t);
  }, []);

  // Category scroll
  const scrollToCategory = (cat: string) => {
    setActiveCategory(cat);
    const el = document.getElementById(`cat-${cat}`);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - HEADER_H - 16;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  // Observe which category is in view
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const cat = e.target.getAttribute("data-cat");
            if (cat) setActiveCategory(cat);
          }
        });
      },
      { rootMargin: `-${HEADER_H + 32}px 0px -55% 0px`, threshold: 0 }
    );
    categories.forEach((cat) => {
      const el = sectionRefs.current[cat];
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [categories]);

  return (
    <>
      {/* ── STATUS BANNER ── */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0,
        background: status.isOpen ? "#16a34a" : "#E8603C",
        color: "#fff", textAlign: "center",
        padding: "5px 12px", fontSize: 11, fontWeight: 800,
        letterSpacing: "0.04em", zIndex: 1100,
      }}>
        <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "#fff", marginRight: 6, verticalAlign: "middle", animation: status.isOpen ? "pulse 1.5s infinite" : "none" }} />
        {status.message}
      </div>

      {/* ── HEADER ── */}
      <header style={{
        position: "fixed", top: 28, left: 0, right: 0,
        background: "rgba(10,10,10,0.97)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        zIndex: 1050, height: 68,
        display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "0 24px",
      }}>
        <a href="/menu" style={{ textDecoration: "none" }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#E8603C", fontFamily: "'Playfair Display', serif" }}>Brasa Clandestina</h1>
        </a>

        {/* Category pills — visible on scrollable nav */}
        <nav id="cat-nav" style={{ display: "flex", alignItems: "center", gap: 8, overflowX: "auto", flex: 1, margin: "0 24px", padding: "4px 0" }} className="hide-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => scrollToCategory(cat)}
              style={{
                padding: "6px 16px", borderRadius: 100,
                background: activeCategory === cat ? "#E8603C" : "transparent",
                color: activeCategory === cat ? "#fff" : "rgba(255,255,255,0.5)",
                border: `1px solid ${activeCategory === cat ? "#E8603C" : "rgba(255,255,255,0.15)"}`,
                fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
                cursor: "pointer", transition: "all 180ms ease",
                letterSpacing: "0.04em",
              }}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </nav>

        {/* Cart icon */}
        <button
          id="header-cart-btn"
          onClick={() => setIsCartOpen(true)}
          style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 10, width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", fontSize: 20, flexShrink: 0 }}
        >
          🛒
        </button>
      </header>

      {/* ── MAIN LAYOUT ── */}
      <div style={{ minHeight: "100vh", background: "#0a0a0a", paddingTop: HEADER_H }}>

        {/* ── Mini Hero (Refactored: Centered & Responsive) ── */}
        <div className="relative w-full py-16 sm:py-24 px-6 flex flex-col items-center text-center bg-gradient-to-b from-[#1a0a06] via-[#0a0a0a] to-[#0a0a0a] border-b border-white/10 overflow-hidden">
          
          {/* Centered decorative glow */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#E8603C]/10 blur-[100px] rounded-full pointer-events-none" />
          
          <p className="relative z-10 text-[10px] sm:text-[11px] font-black tracking-[0.25em] text-[#E8603C]/80 uppercase mb-4">
            🔥 San Pedro Sula · Jue–Sáb 6:30–9:30 pm
          </p>
          
          <h1 className="relative z-10 text-5xl sm:text-6xl md:text-7xl font-black text-white leading-[1.05] mb-6 font-serif max-w-4xl">
            Brasa Clandestina<br />
            <span className="text-[#E8603C]">En tu puerta.</span>
          </h1>
          
          <p className="relative z-10 text-base sm:text-lg text-white/50 max-w-2xl leading-relaxed mb-8">
            La auténtica experiencia de parrilla artesanal con fuego real.<br className="hidden sm:block" />
            Pide ahora y recibe tu pedido caliente en 35–45 minutos.
          </p>
          
          {/* Status dot */}
          <div className={`relative z-10 inline-flex items-center gap-3 px-5 py-2 rounded-full border shadow-lg ${status.isOpen ? 'border-green-500/30 bg-green-500/10' : 'border-[#E8603C]/30 bg-[#E8603C]/10'}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${status.isOpen ? 'bg-green-500' : 'bg-[#E8603C]'} inline-block`} 
                  style={{ animation: status.isOpen ? "heroPulse 1.5s infinite" : "none" }} />
            <span className={`text-xs font-black tracking-widest ${status.isOpen ? 'text-green-500' : 'text-[#E8603C]'}`}>
              {status.isOpen ? "ESTAMOS ABIERTOS" : "CERRADO · EXPLORA EL MENÚ"}
            </span>
          </div>
        </div>

        {/* Menu Sections */}
        <div style={{ flex: 1, padding: "40px 24px 120px", overflowY: "auto", minWidth: 0 }}>
          {categories.map((cat) => {
            const products = displayProducts.filter((p) => p.category === cat && p.is_active !== false);
            if (products.length === 0) return null;
            return (
              <section
                key={cat}
                id={`cat-${cat}`}
                data-cat={cat}
                ref={(el) => { sectionRefs.current[cat] = el; }}
                style={{ marginBottom: 64, maxWidth: "1400px", marginInline: "auto" }}
              >
                {/* Category heading */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 32 }}>
                  <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, transparent, rgba(232,96,60,0.3))" }} />
                  <h2 style={{ margin: 0, fontSize: "clamp(1.5rem, 4vw, 2.2rem)", fontWeight: 900, color: "#E8603C", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'Playfair Display', serif" }}>
                    {cat}
                  </h2>
                  <div style={{ flex: 1, height: 1, background: "linear-gradient(to left, transparent, rgba(232,96,60,0.3))" }} />
                </div>

                {/* Product grid */}
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
        </div>
      </div>

      {/* ── CartDrawer + FloatingBar ── */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <FloatingCartBar onClick={() => setIsCartOpen(true)} />

      {/* ── GLOBAL STYLES ── */}
      <style>{`
        * { box-sizing: border-box; }

        @keyframes heroPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.4); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }

        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }

        /* Products grid — full width responsive */
        .products-grid {
          display: grid;
          gap: 24px;
          grid-template-columns: repeat(4, 1fr);
        }
        @media (max-width: 1536px) {
          .products-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 1023px) {
          .products-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .products-grid { grid-template-columns: 1fr; }
        }

        /* Hero text responsiveness */
        @media (max-width: 640px) {
          #cat-nav { margin: 0 8px; }
        }

        body { background: #0a0a0a; margin: 0; }
      `}</style>
    </>
  );
}
