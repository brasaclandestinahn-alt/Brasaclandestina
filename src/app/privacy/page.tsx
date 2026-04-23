"use client";
import Header from "@/components/DarkKitchen/Header";

export default function PrivacyPolicy() {
  return (
    <div style={{ backgroundColor: "var(--bg-dark)", color: "var(--text-cream)", minHeight: "100vh" }}>
      <Header />
      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "5rem 2rem" }}>
        <h1 className="serif" style={{ fontSize: "3rem", marginBottom: "2rem" }}>Aviso de Privacidad</h1>
        
        <section style={{ display: "flex", flexDirection: "column", gap: "2rem", color: "var(--text-muted)" }}>
          <p>En <strong>Brasa Clandestina</strong>, valoramos tu privacidad. Este aviso describe cómo recopilamos y usamos tu información cuando realizas un pedido a través de nuestros canales de WhatsApp o agregadores.</p>
          
          <div>
            <h2 className="serif" style={{ color: "var(--text-cream)", marginBottom: "1rem" }}>1. Datos Recopilados</h2>
            <p>Solo solicitamos la información necesaria para procesar y entregar tu pedido: nombre, número de teléfono y dirección de entrega.</p>
          </div>

          <div>
            <h2 className="serif" style={{ color: "var(--text-cream)", marginBottom: "1rem" }}>2. Uso de la Información</h2>
            <p>Tus datos se utilizan exclusivamente para la logística de entrega y comunicación sobre el estado de tu pedido. No compartimos tus datos con terceros para fines publicitarios.</p>
          </div>

          <div>
            <h2 className="serif" style={{ color: "var(--text-cream)", marginBottom: "1rem" }}>3. Seguridad</h2>
            <p>Implementamos medidas de seguridad para proteger tu información personal contra acceso no autorizado o divulgación.</p>
          </div>

          <div>
            <h2 className="serif" style={{ color: "var(--text-cream)", marginBottom: "1rem" }}>4. Contacto</h2>
            <p>Si tienes dudas sobre tus datos, puedes contactarnos a través de nuestro WhatsApp oficial.</p>
          </div>
        </section>

        <div style={{ marginTop: "5rem" }}>
          <a href="/" className="btn-primary" style={{ backgroundColor: "transparent", border: "1px solid var(--border-color)" }}>
            Volver al Inicio
          </a>
        </div>
      </main>
    </div>
  );
}
