import type { MetadataRoute } from 'next';

const base = 'https://automanstarrealty.com';

export default function sitemap(): MetadataRoute.Sitemap {
  // Keep this list to public, indexable, canonical pages only.
  // Property detail URLs must be added here only after verified listings exist.
  const paths = [
    '/',
    '/properties',
    '/buy',
    '/off-plan',
    '/commercial',
    '/about',
    '/contact',
    '/experience',
  ];

  return paths.map((path) => ({
    url: new URL(path, base).toString(),
  }));
}
