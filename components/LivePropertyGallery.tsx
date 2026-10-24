 'use client';
import {useState} from 'react';
export default function LivePropertyGallery({images}:{images:{id:string;alt:string}[]}){
 const [index,setIndex]=useState(0);
 if(!images.length)return <div className="live-gallery-empty">Property photography will be available shortly.</div>;
 const active=images[index];return <div className="live-gallery"><img src={`/api/media/${encodeURIComponent(active.id)}`} alt={active.alt||'Property photograph'} /><div className="live-gallery-controls"><button onClick={()=>setIndex(i=>(i+images.length-1)%images.length)} aria-label="Previous photo">←</button><span>{index+1} / {images.length}</span><button onClick={()=>setIndex(i=>(i+1)%images.length)} aria-label="Next photo">→</button></div></div>;
}
