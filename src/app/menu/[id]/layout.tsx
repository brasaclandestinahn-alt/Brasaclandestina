import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}): Promise<Metadata> {
  const { id } = await params;
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const { data: product } = await supabase
    .from("products")
    .select("name, description, price, image_url")
    .eq("id", id)
    .single();
  
  if (!product) {
    return {
      title: "Platillo no encontrado | Brasa Clandestina",
    };
  }
  
  const title = `${product.name} — L. ${product.price} | Brasa Clandestina`;
  const description = product.description 
    || `${product.name} a la brasa. Pídelo en Brasa Clandestina, San Pedro Sula. Delivery propio.`;
  const imageUrl = product.image_url || "https://brasaclandestina.com/og-default.jpg";
  
  return {
    title,
    description,
    openGraph: {
      title: product.name,
      description: `${description} · L. ${product.price}`,
      type: "website",
      siteName: "Brasa Clandestina",
      url: `https://brasaclandestina.com/menu/${id}`,
      images: [{
        url: imageUrl,
        width: 1200,
        height: 630,
        alt: product.name,
      }],
      locale: "es_HN",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: `${description} · L. ${product.price}`,
      images: [imageUrl],
    },
    alternates: {
      canonical: `https://brasaclandestina.com/menu/${id}`,
    },
  };
}

export default function ProductLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return <>{children}</>;
}
