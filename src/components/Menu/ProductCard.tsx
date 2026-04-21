import { Product } from "@/lib/mockDB";

interface ProductCardProps {
  product: Product;
  availability: number;
  onAdd: (product: Product) => void;
}

export default function ProductCard({ product, availability, onAdd }: ProductCardProps) {
  const isOutOfStock = availability <= 0;

  return (
    <div
      className="glass-panel"
      style={{
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: "1.25rem",
        transition: "transform 0.2s, box-shadow 0.2s",
        opacity: isOutOfStock ? 0.6 : 1,
      }}
    >
      {/* Imagen cuadrada 1:1 — recomendado subir fotos de 800×800 px mínimo */}
      <div
        style={{
          width: "100%",
          aspectRatio: "1 / 1",        // siempre cuadrada
          backgroundColor: "var(--bg-tertiary)",
          backgroundImage: `url(${product.image_url})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: isOutOfStock ? "grayscale(100%)" : "none",
          transition: "filter 0.3s",
          position: "relative",
        }}
      >
        {isOutOfStock && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.5)"
          }}>
            <span style={{
              backgroundColor: "var(--warning)", color: "#000",
              fontWeight: 800, padding: "0.4rem 1rem", borderRadius: "100px",
              fontSize: "0.75rem", letterSpacing: "0.05em"
            }}>AGOTADO</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "1rem 1.25rem 1.25rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <h3 style={{ fontSize: "1.125rem", fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
          {product.name}
        </h3>

        {/* Descripción siempre visible */}
        {product.description && (
          <p style={{
            fontSize: "0.8125rem",
            color: "var(--text-muted)",
            lineHeight: 1.5,
            margin: 0,
            flex: 1,
          }}>
            {product.description}
          </p>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
          <span style={{ fontWeight: 800, fontSize: "1.25rem", color: "var(--accent-color)" }}>
            L {product.price.toFixed(2)}
          </span>
          <button
            className="btn-primary"
            onClick={() => onAdd(product)}
            disabled={isOutOfStock}
            style={{ padding: "0.5rem 1.25rem", borderRadius: "100px", fontWeight: 700 }}
          >
            {isOutOfStock ? "Agotado" : "Añadir +"}
          </button>
        </div>
      </div>
    </div>
  );
}
