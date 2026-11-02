import Link from 'next/link';
import {ArrowLeft,Building2,Check,MapPin,MessageCircle} from 'lucide-react';
import Enquiry from '@/components/Enquiry';
import ProjectGallery from '@/components/ProjectGallery';
import ProjectCard from '@/components/ProjectCard';
import {Breadcrumbs} from '@/components/SeoGuide';
import {getCms} from '@/lib/cms';
import {BUSINESS,SITE_URL,jsonLdHtml} from '@/lib/seo';
import {type Project,PROJECTS,compactAed,projectLocation,projectPath} from '@/lib/projects';

export function projectJsonLd(p:Project){
 const url=`${SITE_URL}${projectPath(p)}`;
 return {
  '@context':'https://schema.org','@type':'RealEstateListing',
  name:`${p.name} by ${p.developer}`,url,description:p.description,
  image:p.gallery.map(i=>`${SITE_URL}${i.src}`),
  about:{'@type':'Residence',name:p.name,address:{'@type':'PostalAddress',addressLocality:p.community,addressRegion:p.emirate,addressCountry:'AE'}},
  offers:{'@type':'Offer',url,priceCurrency:'AED',price:p.startingPrice,priceSpecification:{'@type':'PriceSpecification',minPrice:p.startingPrice,priceCurrency:'AED'},offeredBy:{'@id':`${SITE_URL}/#agency`}},
  provider:{'@type':'Organization',name:p.developer},
 };
}

// WhatsApp deep link prefilled with the project; only shown once a number is
// saved in Admin → Global Settings (business.whatsapp).
function whatsappHref(raw:string|undefined,p:Project){
 const digits=(raw||'').replace(/\D/g,'');
 if(digits.length<8)return null;
 const text=`Hello ${BUSINESS.name}, I'm interested in ${p.name} by ${p.developer} (${projectLocation(p)}), starting from ${compactAed(p.startingPrice)}. Please share availability, floor plans and the payment plan.`;
 return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export default async function ProjectDetail({project:p}:{project:Project}){
 const site=await getCms('site');
 const wa=whatsappHref(site.fields['business.whatsapp'],p);
 const label=`${p.name} · ${p.developer} · ${projectLocation(p)}`;
 const others=PROJECTS.filter(o=>o.slug!==p.slug);
 return <main className="detail-page page-shell project-detail">
  <Breadcrumbs items={[['Dubai off-plan properties','/off-plan'],[p.name,projectPath(p)]]}/>
  <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(projectJsonLd(p))}/>
  <div className="container">
   <div className="detail-top"><Link href="/off-plan" className="back-link"><ArrowLeft size={16}/> BACK TO OFF-PLAN</Link><span>{p.status.toUpperCase()} · {p.developer.toUpperCase()}</span></div>
   <ProjectGallery images={p.gallery} title={p.name}/>
   <p className="demo-disclosure">Images are developer renders. Pricing, availability and payment plans are subject to confirmation by the developer.</p>
   <div className="detail-layout">
    <div>
     <p className="eyebrow dark-eyebrow">{p.status.toUpperCase()} / {p.category.toUpperCase()}</p>
     <h1 className="display-heading">{p.name}</h1>
     <p className="detail-location"><MapPin size={17}/> {projectLocation(p)} · by {p.developer}</p>
     <div className="detail-specs project-specs">
      <div><strong>{compactAed(p.startingPrice)}</strong><span>STARTING PRICE</span></div>
      <div><strong>{p.status}</strong><span>STATUS</span></div>
      <div><strong>{p.communitySize}</strong><span>COMMUNITY SIZE</span></div>
     </div>
     <div className="detail-section"><p className="eyebrow dark-eyebrow">THE COMMUNITY</p><h2>About {p.name}</h2><p>{p.description}</p></div>
     <div className="detail-section"><p className="eyebrow dark-eyebrow">PROPERTY TYPES</p><h2>Homes available</h2><div className="amenities">{p.unitMix.map(u=><span key={u}><Building2 size={16}/>{u}</span>)}</div></div>
     <div className="detail-section"><p className="eyebrow dark-eyebrow">HIGHLIGHTS</p><h2>Lifestyle &amp; amenities</h2><div className="amenities">{p.highlights.map(h=><span key={h}><Check size={16}/>{h}</span>)}</div></div>
     <div className="detail-section"><p className="eyebrow dark-eyebrow">LOCATION</p><h2>{projectLocation(p)}</h2><div className="map-placeholder"><MapPin size={25}/><p>{p.community}, {p.emirate}, UAE</p><a target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.name}, ${p.community}, ${p.emirate}`)}`}>VIEW ON GOOGLE MAPS ↗</a></div></div>
    </div>
    <aside className="detail-sidebar"><div className="enquiry-panel">
     <p className="eyebrow dark-eyebrow">REGISTER YOUR INTEREST</p>
     <span className="asking-label">STARTING FROM</span>
     <strong className="detail-price">{compactAed(p.startingPrice)}</strong>
     <p>Ask our team about available units, floor plans and the payment plan for {p.name}.</p>
     {wa&&<a className="button project-whatsapp" href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle size={17} aria-hidden="true"/> WHATSAPP ABOUT {p.name.toUpperCase()}</a>}
     <Enquiry property={label} defaultMessage={`I'm interested in ${p.name} (${projectLocation(p)}). Please share availability, floor plans and the payment plan.`}/>
    </div></aside>
   </div>
   {others.length>0&&<section className="related-section"><div className="section-head"><div><p className="eyebrow dark-eyebrow">KEEP DISCOVERING</p><h2 className="display-heading">More <em>projects.</em></h2></div></div><div className="property-grid">{others.slice(0,3).map(o=><ProjectCard key={o.slug} project={o}/>)}</div></section>}
  </div>
 </main>;
}
