import { Metadata, ResolvingMetadata } from 'next';
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Header from '@/components/DarkKitchen/Header';
import Footer from '@/components/DarkKitchen/Footer';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import Image from 'next/image';

interface Props {
  params: { id: string };
}

// Senior SEO: Dynamic Metadata Generation
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!product) return { title: 'Producto no encontrado' };

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: `${product.name} | Brasa Clandestina`,
      description: product.description,
      images: [product.image_url],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!product) notFound();

  const waLink = buildWhatsAppLink(product.name, "product_page");

  // MenuItem Schema Markup
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MenuItem",
    "name": product.name,
    "description": product.description,
    "offers": {
      "@type": "Offer",
      "price": product.price,
      "priceCurrency": "HNL"
    },
    "image": product.image_url
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-dark)', minHeight: '100vh', color: 'var(--text-cream)' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      
      <main style={{ padding: '4rem 1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '3rem',
            alignItems: 'center'
        }}>
          {/* Product Image */}
          <div style={{ 
              position: 'relative', 
              aspectRatio: '1/1', 
              borderRadius: 'var(--radius-xl)', 
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <Image 
              src={product.image_url} 
              alt={product.name}
              fill
              priority
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 768px) 100vw, 500px"
            />
          </div>

          {/* Product Info */}
          <div>
            <span style={{ 
                color: 'var(--accent-red)', 
                fontWeight: 700, 
                textTransform: 'uppercase', 
                fontSize: '0.85rem',
                letterSpacing: '0.1em'
            }}>
              {product.category}
            </span>
            <h1 className="serif" style={{ fontSize: 'clamp(2rem, 8vw, 3.5rem)', margin: '0.5rem 0', lineHeight: 1.1 }}>{product.name}</h1>
            <p style={{ 
                fontSize: '1.1rem', 
                color: 'var(--text-muted)', 
                lineHeight: 1.6,
                marginBottom: '2rem' 
            }}>
              {product.description}
            </p>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '3rem' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 700 }}>L. {product.price}</span>
            </div>

            <a 
              href={waLink}
              target="_blank"
              className="btn-primary"
              style={{ padding: '1.25rem 2.5rem', fontSize: '1.1rem', width: '100%', textAlign: 'center', display: 'block' }}
            >
              🚀 Pedir este Plato por WhatsApp
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
