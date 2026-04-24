"use client";

import { useEffect, useState } from "react";
import CartButton from "@/components/Cart/CartButton";
import { useAppState } from "@/lib/useStore";
import CartDrawer from "@/components/Cart/CartDrawer";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { state } = useAppState();

  useEffect(() => {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    const min = now.getMinutes();
    const timeValue = hour + min / 60;
    
    const isCorrectDay = day >= 4 && day <= 6;
    const isCorrectTime = timeValue >= 18.5 && timeValue < 21.5;

    setIsOpen(isCorrectDay && isCorrectTime);
  }, []);

  return (
    <>
      <header style={{ 
        padding: "1rem 1.5rem", 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        position: "sticky", 
        top: 0, 
        backgroundColor: "rgba(17,17,17,0.9)", 
        backdropFilter: "blur(10px)",
        zIndex: 100,
        borderBottom: "1px solid var(--border-color)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <h1 className="serif" style={{ fontSize: "1.25rem", color: "var(--accent-red)", margin: 0 }}>Brasa Clandestina</h1>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <nav className="desktop-only" style={{ display: "flex", gap: "1rem", marginRight: "0.5rem" }}>
            <a href="#menu" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase" }}>Asados</a>
          </nav>
          
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: isOpen ? "#22c55e" : "#ef4444" }} />
            <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {isOpen ? "Abierto" : "Cerrado"}
            </span>
          </div>

          <div style={{ marginLeft: "0.5rem" }}>
            <CartButton onClick={() => setIsCartOpen(true)} />
          </div>
        </div>
      </header>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
