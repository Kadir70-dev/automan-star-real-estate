import Link from 'next/link';
import {ArrowLeft,BedDouble,Bath,Building2,Check,Expand,MapPin,MessageCircle} from 'lucide-react';
import Enquiry from '@/components/Enquiry';
import ListingGallery from '@/components/ListingGallery';
import ListingMap from '@/components/ListingMap';
import {BUSINESS,SITE_URL,jsonLdHtml,breadcrumbJsonLd} from '@/lib/seo';
import {type LivePropertyDetail,CATEGORY_LABEL,STATUS_LABEL,compactAed,isOffPlan,locationOf,mediaUrl} from '@/lib/live-properties';

export function listingJsonLd(p:LivePropertyDetail){
 const url=`${SITE_URL}/properties/${encodeURIComponent(p.slug)}`;
 return {
  '@context':'https://schema.org','@type':'RealEstateListing',
  name:p.developer?`${p.title} by ${p.developer}`:p.title,url,description:p.description,
  image:p.media.map(m=>`${SITE_URL}${mediaUrl(m.id)}`),
  ...(p.updated_at?{dateModified:p.updated_at}:{}),
  about:{'@type':'Residence',name:p.title,address:{'@type':'PostalAddress',addressLocality:p.community,addressRegion:p.emirate,addressCountry:'AE'}},
  offers:{'@type':'Offer',url,priceCurrency:'AED',price:Number(p.price_aed),...(p.price_from?{priceSpecification:{'@type':'PriceSpecification',minPrice:Number(p.price_aed),priceCurrency:'AED'}}:{}),offeredBy:{'@id':`${SITE_URL}/#agency`}},
  ...(p.developer?{provider:{'@type':'Organization',name:p.developer}}:{}),
 };
}

// WhatsApp deep link prefilled with the listing; shown only once a number is
// saved in Admin → Global Settings (business.whatsapp).
function whatsappHref(raw:string|undefined,p:LivePropertyDetail){
 const digits=(raw||'').replace(/\D/g,'');
 if(digits.length<8)return null;
 const text=`Hello ${BUSINESS.name}, I'm interested in ${p.title}${p.developer?` by ${p.developer}`:''} (${locationOf(p)}), ${p.price_from?'starting from ':''}${compactAed(p.price_aed)}. Please share availability, floor plans and the payment plan.`;
 return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

// Pure view shared by the public page and the admin preview (preview=true
// shows a banner, skips structured data and disables the enquiry form).
export default function ListingDetail({p,whatsapp,preview=false}:{p:LivePropertyDetail;whatsapp?:string;preview?:boolean}){
 const wa=preview?null:whatsappHref(whatsapp,p);
 const offPlan=isOffPlan(p);
 const back:[string,string]=offPlan?['Dubai off-plan properties','/off-plan']:['Dubai property listings','/properties'];
 const images=p.media.map((m,i)=>({src:mediaUrl(m.id),alt:m.alt||`${p.title} photo ${i+1}`}));
 const label=[p.title,p.developer,locationOf(p)].filter(Boolean).join(' · ');
 const specs=[
  {v:compactAed(p.price_aed),k:p.price_from?'STARTING PRICE':'PRICE'},
  {v:STATUS_LABEL[p.construction_status||'']||'Ready',k:'STATUS'},
  ...(p.community_size?[{v:p.community_size,k:'COMMUNITY SIZE'}]:[]),
  ...(p.bedrooms!=null?[{v:String(p.bedrooms),k:'BEDROOMS',i:<BedDouble/>}]:[]),
  ...(p.bathrooms!=null?[{v:String(p.bathrooms),k:'BATHROOMS',i:<Bath/>}]:[]),
  ...(p.area_sqft?[{v:p.area_sqft.toLocaleString('en-AE'),k:'SQ.FT.',i:<Expand/>}]:[]),
 ];
 return <main className="detail-page page-shell project-detail">
  {!preview&&<script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(breadcrumbJsonLd([back,[p.title,`/properties/${encodeURIComponent(p.slug)}`]]))}/>}
  {!preview&&<script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(listingJsonLd(p))}/>}
  <div className="container">
   {preview&&<p className="listing-preview-banner" role="status">PREVIEW — this is how the listing will look on the website.</p>}
   <div className="detail-top"><Link href={back[1]} className="back-link"><ArrowLeft size={16}/> BACK TO {offPlan?'OFF-PLAN':'PROPERTIES'}</Link><span>{[STATUS_LABEL[p.construction_status||''],p.developer,p.reference_code].filter(Boolean).join(' · ').toUpperCase()}</span></div>
   {images.length?<ListingGallery images={images} title={p.title}/>:<div className="live-gallery-empty">Photos coming soon</div>}
   {offPlan&&<p className="demo-disclosure">Images are developer renders. Pricing, availability and payment plans are subject to confirmation by the developer.</p>}
   <div className="detail-layout">
    <div>
     <p className="eyebrow dark-eyebrow">{[STATUS_LABEL[p.construction_status||''],CATEGORY_LABEL[p.category||'']].filter(Boolean).join(' / ').toUpperCase()}</p>
     <h1 className="display-heading">{p.title}</h1>
     <p className="detail-location"><MapPin size={17}/> {locationOf(p)}{p.developer?` · by ${p.developer}`:''}</p>
     <div className="detail-specs project-specs">{specs.map(s=><div key={s.k}>{'i' in s&&s.i}<strong>{s.v}</strong><span>{s.k}</span></div>)}</div>
     {p.description&&<div className="detail-section"><p className="eyebrow dark-eyebrow">ABOUT</p><h2>About {p.title}</h2>{p.description.split(/\n{2,}/).map((para,i)=><p key={i}>{para}</p>)}</div>}
     {!!p.unit_mix?.length&&<div className="detail-section"><p className="eyebrow dark-eyebrow">PROPERTY TYPES</p><h2>Homes available</h2><div className="amenities">{p.unit_mix.map(u=><span key={u}><Building2 size={16}/>{u}</span>)}</div></div>}
     {!!p.highlights?.length&&<div className="detail-section"><p className="eyebrow dark-eyebrow">HIGHLIGHTS</p><h2>Lifestyle &amp; amenities</h2><div className="amenities">{p.highlights.map(h=><span key={h}><Check size={16}/>{h}</span>)}</div></div>}
     <div className="detail-section"><p className="eyebrow dark-eyebrow">LOCATION</p><h2>{locationOf(p)}</h2><ListingMap title={p.title} community={p.community} emirate={p.emirate}/></div>
    </div>
    <aside className="detail-sidebar"><div className="enquiry-panel">
     <p className="eyebrow dark-eyebrow">REGISTER YOUR INTEREST</p>
     <span className="asking-label">{p.price_from?'STARTING FROM':'ASKING PRICE'}</span>
     <strong className="detail-price">{compactAed(p.price_aed)}</strong>
     <p>Ask our team about availability, floor plans and payment options for {p.title}.</p>
     {wa&&<a className="button project-whatsapp" href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle size={17} aria-hidden="true"/> WHATSAPP ABOUT THIS PROPERTY</a>}
     {preview?<p className="st-muted">The enquiry form appears here on the live page.</p>:<Enquiry property={label} propertyId={p.id} defaultMessage={`I'm interested in ${p.title} (${locationOf(p)}). Please share availability, floor plans and the payment plan.`}/>}
    </div></aside>
   </div>
  </div>
 </main>;
}
