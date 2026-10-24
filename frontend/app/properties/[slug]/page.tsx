import {notFound} from 'next/navigation';
import Link from 'next/link';
import Enquiry from '@/components/Enquiry';
import LivePropertyGallery from '@/components/LivePropertyGallery';
type Detail={id:string;slug:string;title:string;description:string;emirate:string;community:string;category:string;listing_type:string;construction_status:string;price_aed:string;reference_code:string;bedrooms:number|null;bathrooms:number|null;area_sqft:number|null;media:{id:string;alt:string;is_cover:boolean}[]};
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 const base=process.env.BACKEND_INTERNAL_URL||'http://localhost:8080';
 try {
  // The public backend route returns published properties only.
  const res=await fetch(`${base}/api/v1/properties/${encodeURIComponent(slug)}`,{cache:'no-store',signal:AbortSignal.timeout(5000)});
  if(!res.ok) throw new Error('Published listing unavailable');
  const p=await res.json() as Detail;
  if(!p.title||!p.slug||!p.community||!p.emirate) throw new Error('Incomplete listing');
  const title=`${p.title} in ${p.community}, ${p.emirate}`;
  const description=(p.description?.trim()||`Explore ${p.title} in ${p.community}, ${p.emirate}. Request verified details and a viewing with Automan Star Real Estate.`).replace(/\s+/g,' ').slice(0,155);
  const canonical=`/properties/${encodeURIComponent(p.slug)}`;
  return {
   title,
   description,
   alternates:{canonical},
   openGraph:{title,description,url:canonical,type:'article' as const},
   robots:{index:true,follow:true},
  };
 } catch {
  // Do not let transient API failures create crawlable, thin property pages.
  return {title:'Property details unavailable',robots:{index:false,follow:false}};
 }
}
export default async function PropertyDetail({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 const base=process.env.BACKEND_INTERNAL_URL||'http://localhost:8080';
 let p:Detail;
 try{const res=await fetch(`${base}/api/v1/properties/${encodeURIComponent(slug)}`,{cache:'no-store',signal:AbortSignal.timeout(5000)});if(res.status===404)notFound();if(!res.ok)throw new Error('Property service error');p=await res.json() as Detail;}catch(e){if(e&&typeof e==='object'&&'digest' in e)throw e;return <main className="page-shell container"><h1>Property temporarily unavailable</h1><p>Please try again when the property service is online.</p><Link href="/properties">Back to properties</Link></main>}
 return <main className="page-shell detail-page"><div className="container"><p><Link href="/properties">← BACK TO PROPERTIES</Link></p><p className="eyebrow dark-eyebrow">{p.reference_code} · {p.community} · {p.emirate}</p><h1 className="display-heading">{p.title}</h1><LivePropertyGallery images={p.media}/><div className="detail-layout"><div><div className="detail-specs"><div><strong>{p.bedrooms??'—'}</strong><span>BEDROOMS</span></div><div><strong>{p.bathrooms??'—'}</strong><span>BATHROOMS</span></div><div><strong>{p.area_sqft?.toLocaleString('en-AE')??'—'}</strong><span>SQ.FT.</span></div></div><div className="detail-section"><h2>About this property</h2><p>{p.description||'Please contact us for further property details.'}</p></div><div className="detail-section"><h2>Property information</h2><p>Type: {p.category} · {p.construction_status.replaceAll('_',' ')} · {p.listing_type}</p></div></div><aside className="detail-sidebar"><div className="enquiry-panel"><span className="asking-label">ASKING PRICE</span><strong className="detail-price">AED {Number(p.price_aed).toLocaleString('en-AE')}</strong><Enquiry property={p.title}/></div></aside></div></div></main>;
}
