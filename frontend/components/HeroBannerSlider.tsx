'use client';
import {useEffect,useState} from 'react';
import {ChevronLeft,ChevronRight,Pause,Play} from 'lucide-react';
const slides=[
 {label:'DUBAI SKYLINE',image:'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=2200&q=82'},
 {label:'ARCHITECTURAL ELEGANCE',image:'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=2200&q=82'},
 {label:'A DIFFERENT PERSPECTIVE',image:'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2200&q=82'},
];
export default function HeroBannerSlider(){
 const [index,setIndex]=useState(0);
 const [paused,setPaused]=useState(false);
 const [reduced,setReduced]=useState(true);
 useEffect(()=>{const m=window.matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(m.matches);update();m.addEventListener('change',update);return()=>m.removeEventListener('change',update)},[]);
 useEffect(()=>{if(paused||reduced)return;const t=window.setInterval(()=>setIndex(i=>(i+1)%slides.length),6500);return()=>window.clearInterval(t)},[paused,reduced]);
 const change=(direction:number)=>setIndex(i=>(i+direction+slides.length)%slides.length);
 return <div className="luxury-banner" aria-label="Architectural image slideshow" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onFocusCapture={()=>setPaused(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget))setPaused(false)}}>
  {slides.map((slide,i)=><div key={slide.label} className={'luxury-banner-image'+(i===index?' is-active':'')} style={{backgroundImage:`url("${slide.image}")`}} aria-hidden="true"/>)}
  <div className="luxury-banner-controls" aria-label="Slideshow controls">
   <span className="luxury-banner-number">0{index+1}<span> / 0{slides.length}</span></span>
   <span className="luxury-banner-name" aria-live="off">{slides[index].label}</span>
   <button type="button" onClick={()=>change(-1)} aria-label="Previous banner"><ChevronLeft size={16}/></button>
   <button type="button" onClick={()=>setPaused(p=>!p)} aria-label={paused?'Play slideshow':'Pause slideshow'}>{paused?<Play size={14}/>:<Pause size={14}/>}</button>
   <button type="button" onClick={()=>change(1)} aria-label="Next banner"><ChevronRight size={16}/></button>
  </div>
  <div className="luxury-banner-progress" aria-hidden="true"><span key={index+'-'+paused+'-'+reduced} className={!paused&&!reduced?'is-running':''}/></div>
 </div>;
}
