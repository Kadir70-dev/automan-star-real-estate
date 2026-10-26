import type {MetadataRoute} from 'next';
import {SITE_URL} from '@/lib/seo';
import {getLiveProperties} from '@/lib/live-properties';
import {getCms} from '@/lib/cms';
// Public, indexable, canonical pages only. Demo/concept listings, the team
// dashboard, saved and compare views are deliberately excluded.
const PAGES:[path:string,priority:number][]=[['/',1],['/properties',0.9],['/buy',0.9],['/off-plan',0.9],['/commercial',0.8],['/about',0.7],['/contact',0.7],['/experience',0.5],['/privacy',0.2]];
export const revalidate=3600;
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 const indexable=await Promise.all(PAGES.map(async([path,priority])=>{
  const slug=path==='/'?'home':path.slice(1);
  const content=await getCms(slug);
  if(content.seo.robots==='noindex')return null;
  return {url:`${SITE_URL}${path}`,changeFrequency:'weekly' as const,priority};
 }));
 const pages=indexable.filter((p):p is NonNullable<typeof p>=>p!==null);
 // Published listings from the property API; absent when the API is offline.
 const {data}=await getLiveProperties();
 const listings=data.filter(p=>p.slug&&p.listing_type!=='rent').map(p=>({url:`${SITE_URL}/properties/${encodeURIComponent(p.slug)}`,changeFrequency:'weekly' as const,priority:0.6}));
 return [...pages,...listings];
}
