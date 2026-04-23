"use client";
import { useAppState } from "@/lib/useStore";
import { MOCK_CONFIG } from "@/lib/mockDB";

export default function Footer() {
  const { state } = useAppState();
  const config = state.config || MOCK_CONFIG;

  return (
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
          <p style={{ color: "var(--text-muted)" }}>
            WhatsApp: {config.whatsapp_number || "+504 9999-9999"}<br />
            Instagram: @brasaclandestina
          </p>
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
  );
}
