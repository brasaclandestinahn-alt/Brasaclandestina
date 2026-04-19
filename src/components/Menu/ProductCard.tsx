import { Product } from "@/lib/mockDB";

interface ProductCardProps {
  product: Product;
  availability: number;
  onAdd: (product: Product) => void;
}

export default function ProductCard({ product, availability, onAdd }: ProductCardProps) {
  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div 
        style={{ 
          height: '180px', 
          backgroundColor: 'var(--bg-tertiary)', 
          backgroundImage: `url(${product.image_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderBottom: '1px solid var(--border-color)',
          filter: availability <= 0 ? 'grayscale(100%)' : 'none'
        }} 
      />
      <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.25rem' }}>{product.name}</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', flex: 1, marginBottom: '1rem' }}>
          {product.description}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--accent-color)' }}>
            L {product.price.toFixed(2)}
          </span>
          <button className="btn-primary" onClick={() => onAdd(product)} disabled={availability <= 0}>
             {availability > 0 ? "Añadir +" : "Agotado"}
          </button>
        </div>
      </div>
    </div>
  );
}
