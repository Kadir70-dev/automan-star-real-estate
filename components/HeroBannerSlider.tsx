'use client';
import Image from 'next/image';
import {useEffect,useState} from 'react';
import {Pause,Play} from 'lucide-react';
const slides=[
 {alt:'Downtown Dubai skyline at dusk',image:'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=2400&q=80'},
 {alt:'Dubai Marina towers along the water',image:'https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=2400&q=80'},
 {alt:'Contemporary villa with a private pool',image:'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=2400&q=80'},
];
export default function HeroBannerSlider({customSlides}:{customSlides?:{image:string;alt:string}[]}){
 const displaySlides=customSlides&&customSlides.length?customSlides:slides;
 const [index,setIndex]=useState(0);
 const [paused,setPaused]=useState(false);
 const [reduced,setReduced]=useState(true);
 useEffect(()=>{const m=window.matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(m.matches);update();m.addEventListener('change',update);return()=>m.removeEventListener('change',update)},[]);
 useEffect(()=>{if(paused||reduced)return;const t=window.setInterval(()=>setIndex(i=>(i+1)%displaySlides.length),7000);return()=>window.clearInterval(t)},[paused,reduced]);
 return <div className="hero-media">
  {displaySlides.map((slide,i)=><div key={slide.image} className={'hero-media-frame'+(i===index?' is-active':'')} aria-hidden={i!==index}>
   <Image src={slide.image} alt={slide.alt} fill priority={i===0} loading={i===0?undefined:'lazy'} sizes="100vw"/>
  </div>)}
  <div className="hero-media-controls">
   <div className="hero-media-dots" role="group" aria-label="Choose image">{displaySlides.map((s,i)=><button key={s.image} type="button" aria-label={`Show image ${i+1}: ${s.alt}`} aria-pressed={i===index} onClick={()=>setIndex(i)}><span className={i===index&&!paused&&!reduced?'is-running':''}/></button>)}</div>
   {!reduced&&<button type="button" className="hero-media-pause" onClick={()=>setPaused(p=>!p)} aria-label={paused?'Play slideshow':'Pause slideshow'}>{paused?<Play size={13}/>:<Pause size={13}/>}</button>}
  </div>
 </div>;
}
