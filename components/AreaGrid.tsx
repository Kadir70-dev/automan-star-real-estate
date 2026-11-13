'use client';
import Link from 'next/link';
import {useState} from 'react';
import {ArrowUpRight,Building2,TrainFront} from 'lucide-react';
import type {Neighbourhood} from '@/lib/neighbourhoods';

export function AreaCard({n,index}:{n:Neighbourhood;index?:number}){
 return <Link href={`/neighbourhoods/${n.slug}`} className="area-card">
  <span className="area-art" aria-hidden="true"><span>{n.name.replace(/\s*\(.*\)/,'').split(/[\s,]+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('')}</span></span>
  <span className="area-index">{index!==undefined&&<>{String(index+1).padStart(2,'0')} · </>}{n.emirate.toUpperCase()}</span>
  <h2>{n.name}</h2>
  <p>{n.tagline}</p>
  <ul className="area-facts"><li><Building2 size={14} aria-hidden="true"/>{n.homeTypes.join(', ')}</li><li><TrainFront size={14} aria-hidden="true"/>{n.metro}</li></ul>
  <span className="area-more">Read the guide <ArrowUpRight size={15} aria-hidden="true"/></span>
 </Link>;
}

export default function AreaGrid({areas}:{areas:Neighbourhood[]}){
 const emirates=['All',...new Set(areas.map(a=>a.emirate))];
 const [filter,setFilter]=useState('All');
 const shown=areas.filter(a=>filter==='All'||a.emirate===filter);
 return <>
  <div className="area-filter" role="group" aria-label="Filter by emirate">{emirates.map(e=><button key={e} type="button" aria-pressed={filter===e} onClick={()=>setFilter(e)}>{e}<span>{e==='All'?areas.length:areas.filter(a=>a.emirate===e).length}</span></button>)}</div>
  <div className="area-grid" aria-live="polite">{shown.map(n=><AreaCard key={n.slug} n={n} index={areas.indexOf(n)}/>)}</div>
 </>;
}
