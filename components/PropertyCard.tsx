'use client';
import Link from 'next/link';
import Image from 'next/image';
import {Heart,BedDouble,Bath,Expand,GitCompareArrows} from 'lucide-react';
import {Property,money} from '@/lib/data';
import {useState,useEffect} from 'react';
function readIds(key:string):number[]{try{return JSON.parse(localStorage.getItem(key)||'[]')}catch{return []}}
function toggleId(key:string,id:number){const ids=readIds(key);const next=ids.includes(id)?ids.filter(x=>x!==id):[...ids,id];try{localStorage.setItem(key,JSON.stringify(next))}catch{}return next.includes(id)}
export default function PropertyCard({property,index=0}:{property:Property,index?:number}){
 const isDemo=/illustrative/i.test(property.description||'');
 const [saved,setSaved]=useState(false);
 const [compared,setCompared]=useState(false);
 useEffect(()=>{setSaved(readIds('automan-wishlist').includes(property.id));setCompared(readIds('automan-compare').includes(property.id))},[property.id]);
 const href=`/demo-properties/${property.slug}`;
 return <article className={'property-card pc'+(isDemo?' pc-demo':'')}>
  <div className="property-card-image">
   <Image src={property.image} alt={property.title} fill sizes="(max-width: 720px) 100vw, (max-width: 1200px) 50vw, 33vw" priority={index<3}/>
   <span className="pc-badge">{isDemo?'Concept listing':property.tag}</span>
   {property.featured===false&&<span className="pc-badge pc-badge-soon">Coming soon</span>}
   <button className={'heart '+(saved?'saved':'')} aria-pressed={saved} aria-label={saved?`Remove ${property.title} from saved`:`Save ${property.title}`} onClick={()=>setSaved(toggleId('automan-wishlist',property.id))}><Heart size={17} fill={saved?'currentColor':'none'}/></button>
  </div>
  <div className="property-card-body">
   <p className="pc-meta">{property.community}, {property.type}</p>
   <h3><Link href={href} className="pc-link">{property.title}</Link></h3>
   <p className="pc-price">{money(property.price)}{isDemo&&<small> illustrative</small>}</p>
   <div className="specs"><span><BedDouble size={16} aria-hidden="true"/>{property.beds} beds</span><span><Bath size={16} aria-hidden="true"/>{property.baths} baths</span><span><Expand size={16} aria-hidden="true"/>{property.area.toLocaleString()} sq ft</span></div>
   <button aria-pressed={compared} onClick={()=>setCompared(toggleId('automan-compare',property.id))} className="pc-compare"><GitCompareArrows size={14} aria-hidden="true"/> {compared?'Remove from compare':'Add to compare'}</button>
  </div>
 </article>;
}
