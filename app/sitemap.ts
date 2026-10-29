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
 // Only link to detail pages which meet the same completeness requirements
 // used by /properties/[slug]/generateMetadata. Incomplete records are noindex
 // and must not be offered to search engines as indexable URLs.
 const seen=new Set<string>();
 const listings=data.flatMap(p=>{
  const slug=p.slug?.trim();
  if(!slug||!p.title?.trim()||!p.community?.trim()||!p.emirate?.trim()||p.listing_type?.toLowerCase()==='rent')return [];
  const url=`${SITE_URL}/properties/${encodeURIComponent(slug)}`;
  if(seen.has(url))return [];
  seen.add(url);
  return [{url,changeFrequency:'weekly' as const,priority:0.6}];
 });
 return [...pages,...listings];
}
