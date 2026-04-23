"use client";
import { useState, useEffect } from "react";

const REVIEWS = [
  { name: "Carlos M.", text: "La carne llegó caliente y en su punto. El empaque de aluminio realmente conserva el calor. 10/10.", stars: 5 },
  { name: "Ana P.", text: "El sabor a leña es real, no como otros lugares que usan humo líquido. Pedí por WhatsApp y llegó en 35 min.", stars: 5 },
  { name: "Roberto G.", text: "Los mejores cortes para delivery en la ciudad. Muy bien presentado y las porciones son generosas.", stars: 4 },
  { name: "Lucía F.", text: "Increíble empaque, nada se derramó. Se nota el cuidado que le ponen al envío.", stars: 5 },
  { name: "Diego V.", text: "Rápido y delicioso. El servicio por Rappi fue impecable.", stars: 5 }
];

export default function ReviewCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % REVIEWS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section style={{ padding: "5rem 2rem", background: "var(--bg-dark)" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
        <h2 className="serif" style={{ fontSize: "2rem", marginBottom: "3rem" }}>Lo que dicen nuestros clientes</h2>
        
        <div className="glass-panel" style={{ padding: "3rem 2rem", position: "relative", minHeight: "250px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div className="animate-fade" key={index}>
            <div style={{ color: "var(--accent-gold)", fontSize: "1.5rem", marginBottom: "1rem" }}>
              {"★".repeat(REVIEWS[index].stars)}
              {"☆".repeat(5 - REVIEWS[index].stars)}
            </div>
            <p style={{ fontSize: "1.25rem", fontStyle: "italic", marginBottom: "1.5rem", color: "var(--text-cream)" }}>
              "{REVIEWS[index].text}"
            </p>
            <cite style={{ fontWeight: 800, color: "var(--accent-red)", textTransform: "uppercase", fontSize: "0.875rem" }}>
              — {REVIEWS[index].name}
            </cite>
          </div>

          {/* Dots */}
          <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "2rem" }}>
            {REVIEWS.map((_, i) => (
              <button 
                key={i} 
                onClick={() => setIndex(i)}
                style={{ 
                  width: "8px", height: "8px", borderRadius: "50%", 
                  backgroundColor: i === index ? "var(--accent-red)" : "rgba(255,255,255,0.2)",
                  transition: "0.3s"
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
