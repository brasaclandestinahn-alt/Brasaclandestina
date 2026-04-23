"use client";
import { useEffect, useState } from "react";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    setIsOpen(hour >= 12 && hour < 22);
  }, []);

  return (
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

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: isOpen ? "#22c55e" : "#ef4444" }} />
          <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {isOpen ? "Abierto · 35-45 min" : "Cerrado · Abre 12pm"}
          </span>
        </div>
      </div>
    </header>
  );
}
