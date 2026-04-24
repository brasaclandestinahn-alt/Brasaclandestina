"use client";
import { useState, useMemo } from "react";
import { useAppState } from "@/lib/useStore";
import { MOCK_PRODUCTS } from "@/lib/mockDB";
import Link from "next/link";

export default function DigitalMenuPage() {
  const { state, hydrated } = useAppState();
  const [activeCategory, setActiveCategory] = useState<string>("Todas");

  const displayProducts = useMemo(() => {
    return (state.products && state.products.length > 0) ? state.products : MOCK_PRODUCTS;
  }, [state.products]);

  const categories = useMemo(() => {
    return ["Todas", ...Array.from(new Set(displayProducts.map(p => p.category)))];
  }, [displayProducts]);

  if (!hydrated) return <div style={{ backgroundColor: "#000", minHeight: "100vh" }} />;

  const navItems = [
    { label: "Menú Digital", icon: "🍴", active: true },
    { label: "Pedidos", icon: "📋", active: false },
    { label: "Repartidores", icon: "🛵", active: false },
    { label: "Configuración", icon: "⚙️", active: false },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#0A0A0A", color: "#FFFFFF", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Sidebar - charcoal professional */}
      <aside style={{ 
        width: "240px", 
        backgroundColor: "#1A1714", 
        padding: "2rem 1rem", 
        display: "flex", 
        flexDirection: "column",
        borderRight: "1px solid #2D2A26",
        flexShrink: 0
      }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 900, letterSpacing: "0.05em", color: "#FFFFFF", margin: 0 }}>
            Brasa Clandestina
          </h1>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {navItems.map((item) => (
            <div 
              key={item.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "0.85rem 1.25rem",
                borderRadius: "12px",
                backgroundColor: item.active ? "rgba(232, 89, 60, 0.15)" : "transparent",
                color: item.active ? "#E8593C" : "#A09890",
                fontWeight: 700,
                fontSize: "0.95rem",
                cursor: "pointer",
                position: "relative",
                transition: "all 0.2s"
              }}
            >
              {item.active && (
                <div style={{ 
                  position: "absolute", 
                  left: "-1rem", 
                  height: "20px", 
                  width: "4px", 
                  backgroundColor: "#E8593C",
                  borderRadius: "0 4px 4px 0"
                }} />
              )}
              <span style={{ fontSize: "1.1rem" }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: "3rem 4rem", overflowY: "auto", height: "100vh" }}>
        
        <header style={{ marginBottom: "3rem" }}>
            <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
                {categories.map(cat => (
                    <button 
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        style={{
                            padding: "0.5rem 1.25rem",
                            borderRadius: "100px",
                            backgroundColor: activeCategory === cat ? "#E8593C" : "rgba(255,255,255,0.05)",
                            color: "#FFF",
                            border: "none",
                            fontSize: "0.75rem",
                            fontWeight: 800,
                            textTransform: "uppercase",
                            cursor: "pointer",
                            transition: "all 0.2s"
                        }}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </header>

        {/* Menu Items */}
        <div style={{ maxWidth: "800px" }}>
            {categories.filter(cat => cat !== "Todas" && (activeCategory === "Todas" || activeCategory === cat)).map(category => (
                <div key={category} style={{ marginBottom: "4rem" }}>
                    <h2 style={{ 
                        fontSize: "1.25rem", 
                        fontWeight: 900, 
                        color: "#FFFFFF", 
                        textTransform: "uppercase", 
                        letterSpacing: "0.1em",
                        marginBottom: "2rem",
                        borderBottom: "1px solid rgba(255,255,255,0.1)",
                        paddingBottom: "0.75rem"
                    }}>
                        NUESTROS {category === "Todas" ? "PLATOS" : category.toUpperCase()}
                    </h2>

                    <div style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>
                        {displayProducts.filter(p => p.category === category).map(product => (
                            <div key={product.id} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                                    <h3 style={{ 
                                        fontSize: "1.1rem", 
                                        fontWeight: 800, 
                                        color: "#FFFFFF", 
                                        textTransform: "uppercase",
                                        margin: 0
                                    }}>
                                        {product.name}
                                    </h3>
                                    <span style={{ 
                                        fontSize: "1.1rem", 
                                        fontWeight: 900, 
                                        color: "#22C55E", // Emerald green like the mockup
                                        fontFamily: "monospace"
                                    }}>
                                        {product.price} L
                                    </span>
                                </div>
                                <p style={{ 
                                    fontSize: "0.95rem", 
                                    color: "#A09890", 
                                    lineHeight: "1.5",
                                    margin: 0,
                                    maxWidth: "600px"
                                }}>
                                    {product.description || "Asado artesanal con el toque clandestino de la casa."}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
      </main>

      <style jsx global>{`
        body { margin: 0; background-color: #0A0A0A; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}
