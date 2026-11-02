'use client';
import {useEffect,useRef,useState} from 'react';
import {MapPin,Navigation,ExternalLink} from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';
import './listing-map.css';
import {locateArea} from '@/lib/locations';

// Interactive area map (MapLibre + OpenFreeMap vector tiles: no API key/token).
// The library loads only when the section scrolls into view; without WebGL or
// a known area it degrades to the static card with a Google Maps link.
const STYLE='https://tiles.openfreemap.org/styles/positron';
function circle([lng,lat]:[number,number],km:number){
 const pts=Array.from({length:65},(_,i)=>{const a=i/64*2*Math.PI;return [lng+km/(111.32*Math.cos(lat*Math.PI/180))*Math.cos(a),lat+km/110.57*Math.sin(a)]});
 return {type:'Feature' as const,properties:{},geometry:{type:'Polygon' as const,coordinates:[pts]}};
}

export default function ListingMap({title,community,emirate,lat,lng}:{title:string;community:string;emirate:string;lat?:number|null;lng?:number|null}){
 const box=useRef<HTMLDivElement>(null),[state,setState]=useState<'idle'|'ready'|'failed'>('idle');
 const exact=lat!=null&&lng!=null;
 const spot=exact?{c:[lng,lat] as [number,number],z:15}:locateArea(community,emirate);
 const place=`${community}, ${emirate}, UAE`;
 const gmaps=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${title}, ${place}`)}`;
 const directions=spot?`https://www.google.com/maps/dir/?api=1&destination=${spot.c[1]},${spot.c[0]}`:gmaps;

 useEffect(()=>{
  const el=box.current;if(!el||!spot)return;
  let map:import('maplibre-gl').Map|undefined,dead=false;
  const io=new IntersectionObserver(async([e])=>{
   if(!e.isIntersecting)return;io.disconnect();
   try{
    const ml=(await import('maplibre-gl')).default;if(dead)return;
    const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
    map=new ml.Map({container:el,style:STYLE,center:spot.c,zoom:spot.z-2.2,pitch:0,attributionControl:{compact:true},cooperativeGestures:true,maxZoom:17});
    map.addControl(new ml.NavigationControl({showCompass:false}),'top-right');
    map.addControl(new ml.FullscreenControl(),'top-right');
    const pin=document.createElement('div');pin.className='lm-pin';pin.innerHTML='<span></span>';pin.setAttribute('aria-hidden','true');
    new ml.Marker({element:pin,anchor:'center'}).setLngLat(spot.c).addTo(map);
    map.on('load',()=>{
     if(!map)return;
     if(!exact&&spot.z>=13){
      map.addSource('area',{type:'geojson',data:circle(spot.c,1.4)});
      map.addLayer({id:'area-fill',type:'fill',source:'area',paint:{'fill-color':'#c6a878','fill-opacity':.14}});
      map.addLayer({id:'area-line',type:'line',source:'area',paint:{'line-color':'#a18860','line-width':1.5,'line-dasharray':[2,2]}});
     }
     setState('ready');
     map.easeTo({center:spot.c,zoom:spot.z,padding:el.clientWidth>600?{left:340,top:0,right:0,bottom:0}:{top:0,left:0,right:0,bottom:0},pitch:reduce?0:42,bearing:reduce?0:-12,duration:reduce?0:2600});
    });
    map.on('error',ev=>{if(!map?.loaded())console.warn('map',ev.error?.message)});
   }catch{if(!dead)setState('failed')}
  },{rootMargin:'200px'});
  io.observe(el);
  return()=>{dead=true;io.disconnect();map?.remove()};
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[spot?.c[0],spot?.c[1],spot?.z,exact]);

 if(!spot||state==='failed')return <div className="map-placeholder"><MapPin size={25}/><p>{place}</p><a target="_blank" rel="noopener noreferrer" href={gmaps}>VIEW ON GOOGLE MAPS ↗</a></div>;
 return <div className={'lm '+state}>
  <div ref={box} className="lm-canvas" role="region" aria-label={`Map of ${place}`}/>
  {state==='idle'&&<div className="lm-skeleton" aria-hidden="true"/>}
  <div className="lm-card">
   <span className="lm-eyebrow">{exact?'LOCATION':spot.z>=13?'APPROXIMATE AREA':'EMIRATE'}</span>
   <strong>{community}</strong>
   <small>{emirate}, United Arab Emirates</small>
   <div className="lm-actions">
    <a href={directions} target="_blank" rel="noopener noreferrer"><Navigation size={14}/> Directions</a>
    <a href={gmaps} target="_blank" rel="noopener noreferrer"><ExternalLink size={14}/> Google Maps</a>
   </div>
   <p className="lm-note">{exact?'Pin shows the project location. Unit details are shared on enquiry.':'Area shown for orientation. The exact unit or plot location is shared on enquiry.'}</p>
  </div>
 </div>;
}
