"use client";
import { useAppState } from "@/lib/useStore";
import { MOCK_CONFIG } from "@/lib/mockDB";

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
      padding: "80px 24px 60px",
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

        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "center" }}>
          <a href={WHATSAPP_LINK} target="_blank" className="btn-primary btn-whatsapp" style={{ paddingInline: "2.5rem" }}>
            <span>Pedir por WhatsApp</span>
          </a>
          <a href="#menu" className="btn-primary" style={{ backgroundColor: "transparent", border: "2px solid var(--text-cream)", color: "var(--text-cream)" }}>
            Ver Menú
          </a>
        </div>

        {/* Aggregators */}
        <div style={{ marginTop: "3.5rem", display: "flex", flexWrap: "wrap", gap: "2.5rem", justifyContent: "center", alignItems: "center", opacity: 0.7 }}>
           {config.rappi_link && (
             <a href={config.rappi_link} target="_blank" title="Rappi">
               <img src="https://upload.wikimedia.org/wikipedia/commons/0/06/Rappi_logo_2.svg" alt="Rappi" style={{ height: "24px", filter: "brightness(0) invert(1)" }} />
             </a>
           )}
           {config.ubereats_link && (
             <a href={config.ubereats_link} target="_blank" title="Uber Eats">
               <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Uber_Eats_2020_logo.svg" alt="UberEats" style={{ height: "18px", filter: "brightness(0) invert(1)" }} />
             </a>
           )}
           {config.pedidosya_link && (
             <a href={config.pedidosya_link} target="_blank" title="PedidosYa">
               <img src="https://vignette.wikia.nocookie.net/logopedia/images/4/4e/PedidosYa_2018.svg" alt="PedidosYa" style={{ height: "24px", filter: "brightness(0) invert(1)" }} />
             </a>
           )}
        </div>
      </div>
    </section>
  );
}
