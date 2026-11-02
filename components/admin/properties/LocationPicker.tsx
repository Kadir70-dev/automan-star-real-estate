'use client';
import {useEffect,useRef,useState} from 'react';
import {Crosshair,Search,X} from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';
import {locateArea} from '@/lib/locations';

// Admin map pin: click the map or drag the pin. Optional address search uses
// OpenStreetMap Nominatim (UAE only, on Enter, so it stays within fair use).
const STYLE='https://tiles.openfreemap.org/styles/liberty';
const UAE:[number,number]=[54.6,24.6];
type Pin={lat:number;lng:number}|null;
const inUae=(lat:number,lng:number)=>lat>=22.4&&lat<=26.4&&lng>=51.4&&lng<=56.6;
const round=(n:number)=>Math.round(n*1e6)/1e6;

export default function LocationPicker({lat,lng,community,emirate,disabled,onChange}:{lat:number|null;lng:number|null;community:string;emirate:string;disabled?:boolean;onChange:(p:Pin)=>void}){
 const box=useRef<HTMLDivElement>(null);
 const map=useRef<import('maplibre-gl').Map|null>(null),marker=useRef<import('maplibre-gl').Marker|null>(null),lib=useRef<typeof import('maplibre-gl')|null>(null);
 const change=useRef(onChange);change.current=onChange;
 const lock=useRef(disabled);lock.current=disabled;
 const[q,setQ]=useState(''),[msg,setMsg]=useState(''),[busy,setBusy]=useState(false);

 function place(p:{lat:number;lng:number},emit=true){
  const m=map.current,ml=lib.current;if(!m||!ml)return;
  if(!inUae(p.lat,p.lng)){setMsg('Please choose a location inside the UAE.');return}
  setMsg('');
  if(!marker.current){
   const el=document.createElement('div');el.className='lm-pin';el.innerHTML='<span></span>';
   const mk=new ml.Marker({element:el,draggable:!lock.current}).setLngLat([p.lng,p.lat]).addTo(m);marker.current=mk;
   mk.on('dragend',()=>{const ll=mk.getLngLat();place({lat:ll.lat,lng:ll.lng})});
  }else marker.current.setLngLat([p.lng,p.lat]);
  if(emit)change.current({lat:round(p.lat),lng:round(p.lng)});
 }

 useEffect(()=>{
  let dead=false;
  (async()=>{
   const ml=(await import('maplibre-gl')).default as typeof import('maplibre-gl');if(dead||!box.current)return;lib.current=ml;
   const area=locateArea(community,emirate);
   const m=new ml.Map({container:box.current,style:STYLE,center:lat!=null&&lng!=null?[lng,lat]:area?.c||UAE,zoom:lat!=null?15:area?.z??7,attributionControl:{compact:true}});
   map.current=m;m.addControl(new ml.NavigationControl({showCompass:false}),'top-right');
   m.on('load',()=>{if(lat!=null&&lng!=null)place({lat,lng},false)});
   m.on('click',e=>{if(!lock.current)place({lat:e.lngLat.lat,lng:e.lngLat.lng})});
  })().catch(()=>setMsg('The map could not load. You can still save the listing without a pin.'));
  return()=>{dead=true;map.current?.remove();map.current=null;marker.current=null};
 // Map is created once; later prop changes are applied through the handlers above.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[]);

 async function search(){
  if(q.trim().length<3)return;setBusy(true);setMsg('');
  try{
   const r=await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ae&q=${encodeURIComponent(q)}`,{headers:{'Accept-Language':'en'}});
   const [hit]=await r.json() as {lat:string;lon:string}[];
   if(!hit){setMsg('No match. Try the community or building name, or tap the map.');return}
   const p={lat:Number(hit.lat),lng:Number(hit.lon)};map.current?.flyTo({center:[p.lng,p.lat],zoom:16});place(p);
  }catch{setMsg('Search is unavailable right now. Tap the map to place the pin.')}finally{setBusy(false)}
 }
 function centreOnArea(){const a=locateArea(community,emirate);if(a)map.current?.flyTo({center:a.c,zoom:a.z});else setMsg('Enter the community first, or search an address.')}
 function clear(){marker.current?.remove();marker.current=null;onChange(null);setMsg('')}

 return <div className="pm-loc">
  {!disabled&&<div className="pm-loc-bar">
   <label className="pm-loc-search"><Search size={15} aria-hidden="true"/><span className="pm-sr">Search address</span>
    <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();void search()}}} placeholder="Search building, street or area, then press Enter"/></label>
   <button type="button" className="pm-btn" onClick={centreOnArea}><Crosshair size={15}/> Go to community</button>
   {lat!=null&&<button type="button" className="pm-btn pm-danger-text" onClick={clear}><X size={15}/> Clear pin</button>}
  </div>}
  <div ref={box} className="pm-loc-map" role="application" aria-label="Map: tap to place the property pin"/>
  <p className="st-muted pm-loc-help" aria-live="polite">{busy?'Searching…':msg||(lat!=null?`Pin set at ${lat.toFixed(5)}, ${lng?.toFixed(5)}. Drag the pin to adjust.`:'No pin yet: tap the map where the property is. Without a pin the website shows the community area.')}</p>
 </div>;
}
