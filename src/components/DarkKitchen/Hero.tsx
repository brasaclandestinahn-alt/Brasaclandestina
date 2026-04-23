"use client";
import { useAppState } from "@/lib/useStore";

export default function Hero() {
  const WHATSAPP_LINK = "https://wa.me/50499999999?text=Hola,%20quiero%20hacer%20un%20pedido%20de%20Brasa%20Clandestina";

  return (
    <section style={{ 
      height: "100vh", 
      width: "100%", 
      position: "relative", 
      display: "flex", 
      flexDirection: "column", 
      justifyContent: "center", 
      alignItems: "center",
      textAlign: "center",
      padding: "2rem",
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
          Delivery de parrilla artesanal · San Pedro Sula · Lun–Dom 6:30–9:30pm
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
        <div style={{ marginTop: "3rem", display: "flex", gap: "2rem", justifyContent: "center", opacity: 0.6, filter: "grayscale(100%) invert(1)" }}>
           <img src="https://upload.wikimedia.org/wikipedia/commons/2/21/Rappi_logo.svg" alt="Rappi" style={{ height: "20px" }} />
           <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Uber_Eats_2020_logo.svg" alt="UberEats" style={{ height: "20px" }} />
           <img src="https://pedidosya.com/images/logos/logotype-red.svg" alt="PedidosYa" style={{ height: "20px" }} />
        </div>
      </div>
    </section>
  );
}
