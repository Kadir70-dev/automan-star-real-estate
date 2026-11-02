import {notFound} from 'next/navigation';
import Link from 'next/link';
import type {Metadata} from 'next';
import {cache} from 'react';
import ListingDetail from '@/components/ListingDetail';
import {getCms} from '@/lib/cms';
import {BUSINESS,pageMetadata} from '@/lib/seo';
import {getLiveProperty,compactAed,locationOf,mediaUrl} from '@/lib/live-properties';
export const dynamic='force-dynamic';
// Shared by generateMetadata and the page so each request hits the API once.
const fetchProperty=cache(getLiveProperty);
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
 const {slug}=await params;const r=await fetchProperty(slug);
 // Never let outages or unpublished records become crawlable thin pages.
 if(r.status!=='ok')return {title:'Property details unavailable',robots:{index:false,follow:true}};
 const p=r.p;
 const title=p.seo_title||`${p.title}, ${locationOf(p)} | ${p.price_from?'From ':''}${compactAed(p.price_aed)}`;
 const description=(p.seo_description||p.description?.trim()||`${p.title} in ${locationOf(p)}. Request verified details and a viewing with ${BUSINESS.name}.`).replace(/\s+/g,' ').slice(0,155);
 const cover=p.media[0];
 return pageMetadata({path:`/properties/${encodeURIComponent(p.slug)}`,title,description,socialTitle:p.developer?`${p.title} by ${p.developer} | ${locationOf(p)}`:undefined,...(cover?{image:{url:mediaUrl(cover.id),alt:cover.alt||p.title}}:{})});
}
export default async function PropertyDetail({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 const r=await fetchProperty(slug);
 if(r.status==='missing')notFound();
 if(r.status==='error')return <main className="page-shell container"><h1>Property temporarily unavailable</h1><p>Please try again in a moment.</p><Link href="/properties">Back to properties</Link></main>;
 const site=await getCms('site');
 return <ListingDetail p={r.p} whatsapp={site.fields['business.whatsapp']}/>;
}
