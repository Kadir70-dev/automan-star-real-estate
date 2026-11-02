'use client';
import {useMemo,useState} from 'react';
import ListingCard from '@/components/ListingCard';
import {type LiveProperty,matchListing} from '@/lib/live-properties';

// Search + filters over published listings on /properties.
export default function ListingCatalog({items,initialQuery='',initialType='',initialPurpose=''}:{items:LiveProperty[];initialQuery?:string;initialType?:string;initialPurpose?:string}){
 const [query,setQuery]=useState(initialQuery),[type,setType]=useState(initialType),[purpose,setPurpose]=useState(initialPurpose),[max,setMax]=useState(''),[sort,setSort]=useState('newest');
 const results=useMemo(()=>items.filter(p=>matchListing(p,{query,type,purpose,maxPrice:Number(max)||undefined})).sort((a,b)=>sort==='low'?Number(a.price_aed)-Number(b.price_aed):sort==='high'?Number(b.price_aed)-Number(a.price_aed):0),[items,query,type,purpose,max,sort]);
 const reset=()=>{setQuery('');setType('');setPurpose('');setMax('')};
 return <section className="project-catalog" aria-labelledby="listings-title">
  <h2 id="listings-title" className="project-catalog-title">Available properties</h2>
  <div className="live-filter-bar" role="search" aria-label="Filter properties">
   <label>LOCATION / KEYWORD<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Sharjah, Marina, villa..."/></label>
   <label>LOOKING TO<select value={purpose} onChange={e=>setPurpose(e.target.value)}><option value="">All</option><option value="Buy">Buy</option><option value="Off-plan">Off-plan</option></select></label>
   <label>PROPERTY TYPE<select value={type} onChange={e=>setType(e.target.value)}><option value="">All types</option>{['Apartment','Townhouse','Villa','Penthouse','Office','Retail'].map(v=><option key={v} value={v.toLowerCase()}>{v}</option>)}</select></label>
   <label>MAXIMUM PRICE<select value={max} onChange={e=>setMax(e.target.value)}><option value="">Any price</option><option value="2000000">AED 2,000,000</option><option value="3000000">AED 3,000,000</option><option value="5000000">AED 5,000,000</option><option value="10000000">AED 10,000,000</option></select></label>
   <label>SORT<select value={sort} onChange={e=>setSort(e.target.value)}><option value="newest">Featured &amp; newest</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></label>
  </div>
  <p aria-live="polite" className="project-count">{results.length?`${results.length} propert${results.length===1?'y':'ies'} found`:'No properties match these filters.'}{!results.length&&<> <button className="project-reset" onClick={reset}>Show all properties</button></>}</p>
  {results.length>0&&<div className="cs-grid">{results.map((p,i)=><ListingCard key={p.id} item={p} priority={i===0}/>)}</div>}
 </section>;
}
