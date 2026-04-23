"use client";
import { useState, useEffect } from "react";
import { useAppState } from "@/lib/useStore";
import { MOCK_PRODUCTS } from "@/lib/mockDB";
import ProductCard from "@/components/Menu/ProductCard";
import Header from "@/components/DarkKitchen/Header";
import Hero from "@/components/DarkKitchen/Hero";

import ReviewCarousel from "@/components/DarkKitchen/ReviewCarousel";
import CookieConsent from "@/components/DarkKitchen/CookieConsent";

export default function DarkKitchenLanding() {
    const { state, getProductAvailability } = useAppState();
    const [activeCategory, setActiveCategory] = useState("Todas");
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        setHydrated(true);
    }, []);
  
    const displayProducts = (state.products && state.products.length > 0) 
        ? state.products 
        : MOCK_PRODUCTS;

    const categories = ["Todas", ...Array.from(new Set(displayProducts.map(p => p.category)))];
  
    const filteredProducts = activeCategory === "Todas" 
      ? displayProducts 
      : displayProducts.filter(p => p.category === activeCategory);

    if (!hydrated) return <div style={{ backgroundColor: "var(--bg-dark)", minHeight: "100vh" }} />;

  return (
    <div style={{ backgroundColor: "var(--bg-dark)", color: "var(--text-cream)" }}>
      <Header />
      
      <Hero />

      {/* Menu Section */}
      <section id="menu" style={{ padding: "4rem 1.5rem" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2 className="serif" style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>Nuestro Menú</h2>
            <p style={{ color: "var(--text-muted)" }}>Selecciona tu categoría favorita</p>
          </div>

          {/* Filters */}
          <nav style={{ 
            display: "flex", 
            overflowX: "auto", 
            padding: "0.5rem 0", 
            gap: "0.75rem", 
            scrollbarWidth: "none",
            marginBottom: "3rem",
            justifyContent: "center"
          }} className="scrollable-x">
            {categories.map(cat => (
              <button 
                key={cat} 
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: "0.6rem 1.5rem", borderRadius: "100px", whiteSpace: "nowrap",
                  backgroundColor: activeCategory === cat ? "var(--accent-red)" : "transparent",
                  color: activeCategory === cat ? "white" : "var(--text-cream)",
                  border: `1px solid ${activeCategory === cat ? 'var(--accent-red)' : 'var(--border-color)'}`, 
                  fontWeight: 700, transition: "0.2s",
                  fontSize: "0.8rem", textTransform: "uppercase"
                }}
              >
                {cat}
              </button>
            ))}
          </nav>

          {/* Product Grid */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", 
            gap: "2rem" 
          }}>
            {filteredProducts.map(product => (
              <ProductCard 
                  key={product.id} 
                  product={product} 
                  availability={getProductAvailability(product)} 
              />
            ))}
          </div>
        </div>
      </section>

      {/* Why Us Section */}
      <section style={{ padding: "5rem 2rem", background: "var(--bg-panel)", borderTop: "1px solid var(--border-color)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "3rem", textAlign: "center" }}>
          <div>
            <span style={{ fontSize: "3rem" }}>🥩</span>
            <h3 className="serif" style={{ marginTop: "1rem", fontSize: "1.5rem" }}>Maestros de la Parrilla</h3>
            <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>Técnicas tradicionales de asado para resaltar el sabor auténtico de cada corte de carne.</p>
          </div>
          <div>
            <span style={{ fontSize: "3rem" }}>📦</span>
            <h3 className="serif" style={{ marginTop: "1rem", fontSize: "1.5rem" }}>Empaque Térmico</h3>
            <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>Nuestros empaques están diseñados para conservar el calor hasta por 60 minutos.</p>
          </div>
          <div>
            <span style={{ fontSize: "3rem" }}>🚀</span>
            <h3 className="serif" style={{ marginTop: "1rem", fontSize: "1.5rem" }}>35-45 min Promedio</h3>
            <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>Optimizamos nuestra cocina para que tu pedido llegue caliente y a tiempo.</p>
          </div>
        </div>
      </section>

      <ReviewCarousel />

      {/* Footer */}
      <footer style={{ padding: "5rem 2rem", background: "#0a0a0a", borderTop: "1px solid var(--border-color)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "3rem" }}>
          <div>
            <h4 className="serif" style={{ color: "var(--accent-red)", marginBottom: "1rem" }}>Horario</h4>
            <p style={{ color: "var(--text-muted)" }}>Jueves a Sábado<br />6:30 PM - 9:30 PM</p>
          </div>
          <div>
            <h4 className="serif" style={{ color: "var(--accent-red)", marginBottom: "1rem" }}>Cobertura</h4>
            <p style={{ color: "var(--text-muted)" }}>San Pedro Sula: Barrio Los Andes, Guamilito, Colonia Trejo, Jardines del Valle y zonas aledañas.</p>
          </div>
          <div>
            <h4 className="serif" style={{ color: "var(--accent-red)", marginBottom: "1rem" }}>Contacto</h4>
            <p style={{ color: "var(--text-muted)" }}>WhatsApp: +504 9999-9999<br />Instagram: @brasaclandestina</p>
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: "5rem", color: "var(--text-muted)", fontSize: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "2rem" }}>
          <p>Brasa Clandestina © 2025 · Dark Kitchen · San Pedro Sula</p>
          <div style={{ marginTop: "1rem", display: "flex", justifyContent: "center", gap: "1.5rem" }}>
            <a href="/privacy" style={{ textDecoration: "underline" }}>Aviso de Privacidad</a>
            <a href="#" style={{ textDecoration: "underline" }}>Política de Cookies</a>
          </div>
        </div>
      </footer>

      {/* Sticky Pedir Ahora Mobile */}
      <div style={{ 
        position: "fixed", 
        bottom: 0, 
        left: 0, 
        width: "100%", 
        padding: "1rem 1.5rem", 
        background: "rgba(17,17,17,0.8)", 
        backdropFilter: "blur(10px)",
        borderTop: "1px solid var(--border-color)",
        display: "flex",
        zIndex: 200
      }} className="mobile-only">
        <a href="https://wa.me/50499999999" className="btn-primary btn-whatsapp" style={{ width: "100%", justifyContent: "center" }}>
          PEDIR AHORA
        </a>
      </div>

      <CookieConsent />
    </div>
  );
}
