"use client";
import { useState, useEffect } from "react";

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) setShow(true);
  }, []);

  const accept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div style={{ 
      position: "fixed", 
      bottom: "2rem", 
      left: "2rem", 
      right: "2rem", 
      zIndex: 1000, 
      maxWidth: "500px",
      marginInline: "auto"
    }} className="animate-fade">
      <div className="glass-panel" style={{ padding: "1.5rem", border: "1px solid var(--accent-gold)" }}>
        <h4 className="serif" style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Aviso de Cookies</h4>
        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
          Utilizamos cookies para mejorar tu experiencia y medir la conversión de nuestros pedidos. Al continuar, aceptas nuestra política de privacidad.
        </p>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button onClick={accept} className="btn-primary" style={{ padding: "0.5rem 1.5rem", fontSize: "0.75rem" }}>
            Aceptar
          </button>
          <button onClick={() => setShow(false)} style={{ fontSize: "0.75rem", textDecoration: "underline", color: "var(--text-muted)" }}>
            Rechazar
          </button>
        </div>
      </div>
    </div>
  );
}
