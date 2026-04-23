import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

/**
 * Brasa Clandestina - Dynamic Sitemap Generator
 * Indexes the home page, categories, and individual products for SEO.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://brasaclandestina.com';

  // 1. Fetch products from Supabase
  const { data: products } = await supabase
    .from('products')
    .select('id, name')
    .eq('is_active', true);

  const productEntries: MetadataRoute.Sitemap = (products || []).map((p) => ({
    url: `${baseUrl}/menu/${p.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/admin`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    ...productEntries,
  ];
}
