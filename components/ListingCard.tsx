import Link from 'next/link';
import Image from 'next/image';
import {BedDouble,Building2,MapPin} from 'lucide-react';
import {type LiveProperty,CATEGORY_LABEL,STATUS_LABEL,locationOf,mediaUrl,priceText} from '@/lib/live-properties';

// Card for a listing published from /admin/properties; shares the .pc styles.
export default function ListingCard({item:p,priority=false,href}:{item:LiveProperty;priority?:boolean;href?:string}){
 const badge=p.construction_status&&p.construction_status!=='ready'?STATUS_LABEL[p.construction_status]:CATEGORY_LABEL[p.category||'']||'For sale';
 const spec=p.unit_mix?.length?p.unit_mix.join(' · '):[p.bedrooms!=null&&`${p.bedrooms} bed${p.bedrooms===1?'':'s'}`,CATEGORY_LABEL[p.category||'']].filter(Boolean).join(' · ');
 return <article className="property-card pc pc-project">
  <div className="property-card-image">
   {p.cover_id?<Image src={mediaUrl(p.cover_id)} alt={p.cover_alt||p.title} fill unoptimized sizes="(max-width: 720px) 100vw, (max-width: 1200px) 50vw, 33vw" priority={priority}/>:<span className="pc-noimage" aria-hidden="true">AUTOMAN STAR</span>}
   <span className="pc-badge">{badge.toUpperCase()}</span>
  </div>
  <div className="property-card-body">
   <p className="pc-meta"><MapPin size={14} aria-hidden="true"/> {locationOf(p)}{p.developer?` · ${p.developer}`:''}</p>
   <h3><Link href={href||`/properties/${encodeURIComponent(p.slug)}`} className="pc-link">{p.title}</Link></h3>
   <p className="pc-price">{p.price_from&&<small>Starting from </small>}{priceText({...p,price_from:false})}</p>
   {spec&&<div className="specs"><span>{p.unit_mix?.length?<Building2 size={16} aria-hidden="true"/>:<BedDouble size={16} aria-hidden="true"/>}{spec}</span></div>}
  </div>
 </article>;
}

// Server-friendly grid used on Buy and Off-plan.
export function FeaturedListings({items,title}:{items:LiveProperty[];title:string}){
 if(!items.length)return null;
 return <section className="project-feature" aria-labelledby="featured-listings">
  <h2 id="featured-listings" className="project-catalog-title">{title}</h2>
  <div className="cs-grid">{items.map((p,i)=><ListingCard key={p.id} item={p} priority={i===0}/>)}</div>
 </section>;
}
