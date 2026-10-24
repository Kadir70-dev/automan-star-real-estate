import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/saved', '/compare'],
      },
    ],
    sitemap: 'https://automanstarrealty.com/sitemap.xml',
    host: 'https://automanstarrealty.com',
  };
}
