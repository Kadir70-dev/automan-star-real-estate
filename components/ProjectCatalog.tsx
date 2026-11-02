'use client';
import {useMemo,useState} from 'react';
import ProjectCard from '@/components/ProjectCard';
import {PROJECTS,matchProject} from '@/lib/projects';

// Search + filters over published developer projects on /properties.
export default function ProjectCatalog({initialQuery='',initialType='',initialPurpose=''}:{initialQuery?:string;initialType?:string;initialPurpose?:string}){
 const [query,setQuery]=useState(initialQuery),[type,setType]=useState(initialType),[purpose,setPurpose]=useState(initialPurpose),[max,setMax]=useState('');
 const results=useMemo(()=>PROJECTS.filter(p=>matchProject(p,{query,type,purpose,maxPrice:Number(max)||undefined})),[query,type,purpose,max]);
 const reset=()=>{setQuery('');setType('');setPurpose('');setMax('')};
 return <section className="project-catalog" aria-labelledby="projects-title">
  <h2 id="projects-title" className="project-catalog-title">Featured projects</h2>
  <div className="live-filter-bar" role="search" aria-label="Filter projects">
   <label>LOCATION / KEYWORD<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Sharjah, Azizi, villa..."/></label>
   <label>LOOKING TO<select value={purpose} onChange={e=>setPurpose(e.target.value)}><option value="">All</option><option value="Buy">Buy</option><option value="Off-plan">Off-plan</option></select></label>
   <label>PROPERTY TYPE<select value={type} onChange={e=>setType(e.target.value)}><option value="">All types</option>{['Apartment','Townhouse','Villa'].map(v=><option key={v}>{v}</option>)}</select></label>
   <label>MAXIMUM PRICE<select value={max} onChange={e=>setMax(e.target.value)}><option value="">Any price</option><option value="2000000">AED 2,000,000</option><option value="3000000">AED 3,000,000</option><option value="5000000">AED 5,000,000</option><option value="10000000">AED 10,000,000</option></select></label>
  </div>
  <p aria-live="polite" className="project-count">{results.length?`${results.length} project${results.length===1?'':'s'} found`:'No featured projects match these filters.'}{!results.length&&<> <button className="project-reset" onClick={reset}>Show all projects</button></>}</p>
  {results.length>0&&<div className="cs-grid">{results.map((p,i)=><ProjectCard key={p.slug} project={p} priority={i===0}/>)}</div>}
 </section>;
}
