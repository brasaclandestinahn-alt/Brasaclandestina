"use client";
import { useAppState } from "@/lib/useStore";
import { MOCK_CONFIG } from "@/lib/mockDB";
import Link from "next/link";

export default function Hero() {
  const { state } = useAppState();
  const config = state.config || MOCK_CONFIG;
  
  const WHATSAPP_LINK = `https://wa.me/${config.whatsapp_number?.replace(/\D/g, '') || '50499999999'}?text=${encodeURIComponent(config.whatsapp_message || 'Hola')}`;

  return (
    <section style={{ 
      minHeight: "auto", 
      width: "100%", 
      position: "relative", 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center",
      textAlign: "center",
      padding: "80px 24px 20px",
      overflow: "hidden"
    }}>
      {/* Background with Dark Overlay */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `url('https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        zIndex: -2
      }} />
      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(circle, rgba(17,17,17,0.7) 0%, rgba(17,17,17,1) 100%)",
        zIndex: -1
      }} />

      <div className="animate-fade" style={{ maxWidth: "800px" }}>
        <h1 style={{ 
          fontSize: "clamp(3rem, 10vw, 5rem)", 
          color: "var(--text-cream)", 
          marginBottom: "1rem",
          lineHeight: 1
        }}>
          Brasa Clandestina. <br />
          <span style={{ color: "var(--accent-red)" }}>En tu puerta.</span>
        </h1>
        
        <p style={{ 
          fontSize: "clamp(1rem, 4vw, 1.25rem)", 
          color: "var(--text-cream)", 
          opacity: 0.9,
          marginBottom: "2.5rem",
          maxWidth: "600px",
          marginInline: "auto"
        }}>
          Delivery de parrilla artesanal · San Pedro Sula · Jue–Sáb 6:30–9:30pm
        </p>

      </div>
    </section>
  );
}
