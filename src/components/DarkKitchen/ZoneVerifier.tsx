"use client";
import { useState } from "react";

export default function ZoneVerifier() {
  const [zip, setZip] = useState("");
  const [status, setStatus] = useState<null | "ok" | "no">(null);

  const checkZone = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulación simple: si tiene 5 dígitos es OK
    if (zip.length >= 4) {
      setStatus("ok");
    } else {
      setStatus("no");
    }
  };

  return (
    <section style={{ padding: "4rem 2rem", background: "var(--bg-dark)", borderBottom: "1px solid var(--border-color)" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem" }}>¿Llegamos a tu zona?</h2>
        
        <form onSubmit={checkZone} style={{ display: "flex", gap: "0.5rem" }}>
          <input 
            type="text" 
            placeholder="Ingresa tu colonia o código postal" 
            value={zip}
            onChange={(e) => {
              setZip(e.target.value);
              setStatus(null);
            }}
            style={{ 
              flex: 1, 
              padding: "1rem 1.5rem", 
              borderRadius: "100px", 
              border: "1px solid var(--border-color)", 
              background: "rgba(255,255,255,0.05)",
              color: "white",
              outline: "none"
            }}
          />
          <button type="submit" className="btn-primary" style={{ padding: "0 1.5rem" }}>
            Verificar
          </button>
        </form>

        {status === "ok" && (
          <div className="animate-fade" style={{ marginTop: "1.5rem", color: "#22c55e", fontWeight: 700 }}>
            ✅ Sí llegamos · ~40 min · Envío L 35
          </div>
        )}
        {status === "no" && (
          <div className="animate-fade" style={{ marginTop: "1.5rem", color: "var(--accent-red)", fontWeight: 700 }}>
            📍 Próximamente en tu zona
          </div>
        )}
      </div>
    </section>
  );
}
