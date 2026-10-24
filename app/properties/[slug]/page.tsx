import {notFound} from 'next/navigation';
import Link from 'next/link';
import type {Metadata} from 'next';
import {cache} from 'react';
import Enquiry from '@/components/Enquiry';
import LivePropertyGallery from '@/components/LivePropertyGallery';
import {Breadcrumbs} from '@/components/SeoGuide';
import {BUSINESS,pageMetadata} from '@/lib/seo';
type Detail={id:string;slug:string;title:string;description:string;emirate:string;community:string;category:string;listing_type:string;construction_status:string;price_aed:string;reference_code:string;bedrooms:number|null;bathrooms:number|null;area_sqft:number|null;media:{id:string;alt:string;is_cover:boolean}[]};
type Fetched={status:'ok';p:Detail}|{status:'missing'}|{status:'error'};
export const dynamic='force-dynamic';
// Shared by generateMetadata and the page so each request hits the API once.
const fetchProperty=cache(async(slug:string):Promise<Fetched>=>{
 const base=process.env.BACKEND_INTERNAL_URL||'http://localhost:8080';
 try{const res=await fetch(`${base}/api/v1/properties/${encodeURIComponent(slug)}`,{cache:'no-store',signal:AbortSignal.timeout(5000)});if(res.status===404)return {status:'missing'};if(!res.ok)return {status:'error'};return {status:'ok',p:await res.json() as Detail};}catch{return {status:'error'};}
});
const isComplete=(p:Detail)=>Boolean(p.title&&p.slug&&p.community&&p.emirate);
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
 const {slug}=await params;const r=await fetchProperty(slug);
 // Never let outages or incomplete records become crawlable thin pages.
 if(r.status!=='ok'||!isComplete(r.p))return {title:'Property details unavailable',robots:{index:false,follow:true}};
 const p=r.p;const title=`${p.title} in ${p.community}, ${p.emirate}`;
 const description=(p.description?.trim()||`${p.title} in ${p.community}, ${p.emirate}. Request verified details and a viewing with ${BUSINESS.name}.`).replace(/\s+/g,' ').slice(0,155);
 return pageMetadata({path:`/properties/${encodeURIComponent(p.slug)}`,title,description});
}
export default async function PropertyDetail({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 const r=await fetchProperty(slug);
 if(r.status==='missing')notFound();
 if(r.status==='error')return <main className="page-shell container"><h1>Property temporarily unavailable</h1><p>Please try again when the property service is online.</p><Link href="/properties">Back to properties</Link></main>;
 const p=r.p;
 return <main className="page-shell detail-page">{isComplete(p)&&<Breadcrumbs items={[['Dubai property listings','/properties'],[p.title,`/properties/${encodeURIComponent(p.slug)}`]]}/>}<div className="container"><p><Link href="/properties">← BACK TO PROPERTIES</Link></p><p className="eyebrow dark-eyebrow">{p.reference_code} · {p.community} · {p.emirate}</p><h1 className="display-heading">{p.title}</h1><LivePropertyGallery images={p.media}/><div className="detail-layout"><div><div className="detail-specs"><div><strong>{p.bedrooms??'—'}</strong><span>BEDROOMS</span></div><div><strong>{p.bathrooms??'—'}</strong><span>BATHROOMS</span></div><div><strong>{p.area_sqft?.toLocaleString('en-AE')??'—'}</strong><span>SQ.FT.</span></div></div><div className="detail-section"><h2>About this property</h2><p>{p.description||'Please contact us for further property details.'}</p></div><div className="detail-section"><h2>Property information</h2><p>Type: {p.category} · {p.construction_status.replaceAll('_',' ')} · {p.listing_type}</p></div></div><aside className="detail-sidebar"><div className="enquiry-panel"><span className="asking-label">ASKING PRICE</span><strong className="detail-price">AED {Number(p.price_aed).toLocaleString('en-AE')}</strong><Enquiry property={p.title}/></div></aside></div></div></main>;
}
