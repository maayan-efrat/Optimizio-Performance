import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://optimizio.co.il';
  const now = new Date();
  return [
    { url: baseUrl,                      lastModified: now, changeFrequency: 'weekly',  priority: 1   },
    { url: `${baseUrl}/pricing`,         lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/faq`,             lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/privacy`,         lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
  ];
}
