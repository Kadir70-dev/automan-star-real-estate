'use client';
import Image from 'next/image';
import {useEffect,useState} from 'react';
import {ChevronLeft,ChevronRight,X,Maximize2} from 'lucide-react';
export type GalleryImage={src:string;alt:string};

// Cover + full thumbnail grid + keyboard lightbox, so every image is reachable.
export default function ListingGallery({images,title}:{images:GalleryImage[];title:string}){
 const [active,setActive]=useState<number|null>(null);
 const n=images.length;
 useEffect(()=>{
  if(active===null)return;
  const handle=(e:KeyboardEvent)=>{if(e.key==='Escape')setActive(null);if(e.key==='ArrowRight')setActive(i=>i===null?null:(i+1)%n);if(e.key==='ArrowLeft')setActive(i=>i===null?null:(i-1+n)%n)};
  window.addEventListener('keydown',handle);return()=>window.removeEventListener('keydown',handle);
 },[active,n]);
 return <>
  <div className="final-gallery">
   <button className="final-gallery-main" onClick={()=>setActive(0)} aria-label={`Open ${title} gallery (${n} images)`}><Image src={images[0].src} alt={images[0].alt} fill priority unoptimized sizes="(max-width:900px) 100vw,70vw"/><span><Maximize2 size={16}/> VIEW ALL {n} IMAGES</span></button>
   <div className="final-gallery-side">{[1,2].map(i=><button key={i} onClick={()=>setActive(i%n)} aria-label={`View image ${i+1} of ${n}`}><Image src={images[i%n].src} alt={images[i%n].alt} fill unoptimized sizes="(max-width:900px) 50vw,25vw"/></button>)}</div>
  </div>
  <ul className="project-thumbs" aria-label={`${title} image gallery`}>{images.map((im,i)=><li key={im.src}><button onClick={()=>setActive(i)} aria-label={`View image ${i+1} of ${n}: ${im.alt}`}><Image src={im.src} alt={im.alt} fill unoptimized loading="lazy" sizes="(max-width:600px) 33vw,11vw"/></button></li>)}</ul>
  {active!==null&&<div role="dialog" aria-modal="true" aria-label={`${title} image gallery`} className="final-lightbox">
   <button className="final-lightbox-close" onClick={()=>setActive(null)} aria-label="Close gallery" autoFocus><X/></button>
   <div className="final-lightbox-image"><Image src={images[active].src} alt={images[active].alt} fill unoptimized sizes="95vw" priority/></div>
   <button aria-label="Previous image" onClick={()=>setActive((active-1+n)%n)}><ChevronLeft/></button>
   <span>{active+1} / {n} · DEVELOPER RENDER</span>
   <button aria-label="Next image" onClick={()=>setActive((active+1)%n)}><ChevronRight/></button>
  </div>}
 </>;
}
