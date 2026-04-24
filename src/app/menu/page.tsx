"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import { useAppState } from "@/lib/useStore";
import { MOCK_PRODUCTS } from "@/lib/mockDB";
import { Product } from "@/lib/mockDB";

import CartPanel from "@/components/Cart/CartPanel";
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

        {/* Category pills — only visible on mobile */}
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

        {/* Cart icon — mobile only */}
        <button
          id="header-cart-btn"
          onClick={() => setIsCartOpen(true)}
          className="mobile-only"
          style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 10, width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", fontSize: 20, flexShrink: 0 }}
        >
          🛒
        </button>
      </header>

      {/* ── MAIN SPLIT LAYOUT ── */}
      <div style={{ display: "flex", minHeight: "100vh", background: "#0a0a0a", paddingTop: HEADER_H }}>

        {/* LEFT — Menu */}
        <div style={{ flex: 1, padding: "0 0 120px", overflowY: "auto", minWidth: 0 }}>

          {/* ── Mini Hero ── */}
          <div style={{
            position: "relative",
            width: "100%",
            padding: "40px 24px 32px",
            background: "linear-gradient(160deg, #1a0a06 0%, #0a0a0a 60%)",
            borderBottom: "1px solid rgba(232,96,60,0.15)",
            overflow: "hidden",
          }}>
            {/* Decorative glow */}
            <div style={{ position: "absolute", top: -60, left: -40, width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(232,96,60,0.18) 0%, transparent 70%)", pointerEvents: "none" }} />
            <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 800, letterSpacing: "0.18em", color: "rgba(232,96,60,0.7)", textTransform: "uppercase" }}>🔥 San Pedro Sula · Jue–Sáb 6:30–9:30 pm</p>
            <h1 style={{ margin: "0 0 10px", fontSize: "clamp(1.8rem, 5vw, 2.8rem)", fontWeight: 900, color: "#ffffff", fontFamily: "'Playfair Display', serif", lineHeight: 1.1 }}>
              Brasa Clandestina<br />
              <span style={{ color: "#E8603C" }}>En tu puerta.</span>
            </h1>
            <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.45)", maxWidth: 420, lineHeight: 1.6 }}>
              Parrilla artesanal con fuego real. Pide directo y recibe en 35–45 min.
            </p>
            {/* Status dot */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 14, background: status.isOpen ? "rgba(22,163,74,0.12)" : "rgba(232,96,60,0.1)", border: `1px solid ${status.isOpen ? "rgba(22,163,74,0.4)" : "rgba(232,96,60,0.3)"}`, borderRadius: 100, padding: "4px 12px" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: status.isOpen ? "#22c55e" : "#E8603C", display: "inline-block", animation: status.isOpen ? "heroPulse 1.5s infinite" : "none" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: status.isOpen ? "#22c55e" : "#E8603C", letterSpacing: "0.04em" }}>
                {status.isOpen ? "ABIERTOS AHORA" : "CERRADO · Puedes explorar el menú"}
              </span>
            </div>
          </div>

          <div style={{ padding: "24px 24px 0" }}>
          {categories.map((cat) => {
            const products = displayProducts.filter((p) => p.category === cat && p.is_active !== false);
            if (products.length === 0) return null;
            return (
              <section
                key={cat}
                id={`cat-${cat}`}
                data-cat={cat}
                ref={(el) => { sectionRefs.current[cat] = el; }}
                style={{ marginBottom: 56 }}
              >
                {/* Category heading */}
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
                  <div style={{ width: 4, height: 28, background: "#E8603C", borderRadius: 2 }} />
                  <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#E8603C", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'Playfair Display', serif" }}>
                    {cat}
                  </h2>
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
          </div>{/* end inner padding div */}
        </div>

        {/* RIGHT — Cart panel (desktop only) */}
        <aside className="desktop-cart" style={{
          width: 340, flexShrink: 0,
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          position: "sticky", top: HEADER_H,
          height: `calc(100vh - ${HEADER_H}px)`,
          overflowY: "auto", background: "#111111",
        }}>
          <CartPanel />
        </aside>
      </div>

      {/* ── MOBILE: CartDrawer + FloatingBar ── */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <div className="mobile-only">
        <FloatingCartBar onClick={() => setIsCartOpen(true)} />
      </div>

      {/* ── GLOBAL STYLES ── */}
      <style>{`
        * { box-sizing: border-box; }

        @keyframes heroPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.5); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }

        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }

        /* Products grid */
        .products-grid {
          display: grid;
          gap: 20px;
          grid-template-columns: repeat(3, 1fr);
        }
        @media (max-width: 1279px) {
          .products-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 767px) {
          .products-grid { grid-template-columns: 1fr; }
        }

        /* Desktop cart aside */
        .desktop-cart { display: flex; flex-direction: column; }
        @media (max-width: 1023px) {
          .desktop-cart { display: none; }
        }

        /* Mobile-only elements */
        .mobile-only { display: none; }
        @media (max-width: 1023px) {
          .mobile-only { display: flex; }
        }

        /* Scrollbar for cart aside */
        .desktop-cart::-webkit-scrollbar { width: 4px; }
        .desktop-cart::-webkit-scrollbar-track { background: transparent; }
        .desktop-cart::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

        /* Narrow cat nav on mobile */
        @media (max-width: 1023px) {
          #cat-nav { margin: 0 8px; }
        }

        body { background: #0a0a0a; margin: 0; }
      `}</style>
    </>
  );
}
