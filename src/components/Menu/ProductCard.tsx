import { Product } from "@/lib/mockDB";
import { formatCurrency } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  availability: number;
  onAdd?: (product: Product) => void; // Optional now as we use WhatsApp
}

export default function ProductCard({ product, availability }: ProductCardProps) {
  const isOutOfStock = availability <= 0;
  const WHATSAPP_LINK = `https://wa.me/50499999999?text=Hola,%20quiero%20pedir:%20${encodeURIComponent(product.name)}`;

  return (
    <div
      className="glass-panel animate-fade"
      style={{
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        border: "1px solid rgba(245, 237, 216, 0.05)",
        background: "var(--bg-panel)",
        opacity: isOutOfStock ? 0.5 : 1,
        position: "relative"
      }}
    >
      {/* Badges */}
      <div style={{ position: "absolute", top: "1rem", left: "1rem", zIndex: 5, display: "flex", gap: "0.5rem" }}>
        {product.price > 400 && <span className="badge badge-red">Más Pedido</span>}
        {product.id.includes("new") && <span className="badge badge-gold">Nuevo</span>}
      </div>

      {/* Image */}
      <div
        style={{
          width: "100%",
          aspectRatio: "1 / 1",
          backgroundImage: `url(${product.image_url})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: isOutOfStock ? "grayscale(100%)" : "none",
        }}
      >
        {isOutOfStock && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.7)"
          }}>
            <span className="badge badge-red" style={{ padding: "0.5rem 1.5rem" }}>AGOTADO</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "1.5rem", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
          <h3 style={{ fontSize: "1.25rem", color: "var(--text-cream)", margin: 0 }}>{product.name}</h3>
          <div style={{ display: "flex", gap: "2px" }}>
            {[1, 2].map(i => (
              <span key={i} style={{ color: i <= 2 ? "var(--accent-red)" : "rgba(255,255,255,0.1)", fontSize: "0.8rem" }}>🔥</span>
            ))}
          </div>
        </div>

        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "1.5rem", flex: 1 }}>
          {product.description || "Parrilla artesanal preparada al momento con leña real."}
        </p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--accent-gold)" }}>
            {formatCurrency(product.price)}
          </span>
          <a 
            href={isOutOfStock ? "#" : WHATSAPP_LINK} 
            target="_blank"
            className={`btn-primary ${isOutOfStock ? '' : 'btn-whatsapp'}`}
            style={{ 
              padding: "0.6rem 1.25rem", 
              fontSize: "0.75rem",
              pointerEvents: isOutOfStock ? "none" : "auto",
              opacity: isOutOfStock ? 0.5 : 1
            }}
          >
            {isOutOfStock ? "Agotado" : "Pedir WhatsApp"}
          </a>
        </div>
      </div>
    </div>
  );
}
