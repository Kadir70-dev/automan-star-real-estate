'use client';
import {useEffect,useRef} from 'react';

// Frame-break founder portrait: a blurred office plate inside the frame and the
// transparent Saud + chair cutout layered over it, overflowing the frame edges.
// Desktop fine pointers get a subtle rAF parallax; touch and reduced motion stay static.
export default function FounderPortrait({alt}:{alt:string}){
 const ref=useRef<HTMLElement>(null);
 useEffect(()=>{
  const el=ref.current;
  if(!el||!matchMedia('(hover:hover) and (pointer:fine)').matches||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  let raf=0,tx=0,ty=0,x=0,y=0;
  const tick=()=>{x+=(tx-x)*.08;y+=(ty-y)*.08;el.style.setProperty('--fx',x.toFixed(4));el.style.setProperty('--fy',y.toFixed(4));raf=Math.abs(tx-x)+Math.abs(ty-y)>.001?requestAnimationFrame(tick):0};
  const kick=()=>{if(!raf)raf=requestAnimationFrame(tick)};
  const move=(e:PointerEvent)=>{const r=el.getBoundingClientRect();tx=Math.max(-1,Math.min(1,(e.clientX-r.left)/r.width*2-1));ty=Math.max(-1,Math.min(1,(e.clientY-r.top)/r.height*2-1));kick()};
  const leave=()=>{tx=0;ty=0;kick()};
  const zone=el.closest('section')||el;
  zone.addEventListener('pointermove',move as EventListener,{passive:true});zone.addEventListener('pointerleave',leave);
  return()=>{cancelAnimationFrame(raf);zone.removeEventListener('pointermove',move as EventListener);zone.removeEventListener('pointerleave',leave)};
 },[]);
 return <figure ref={ref} className="founder-portrait founder-pop">
  <div className="founder-frame">
   {/* eslint-disable-next-line @next/next/no-img-element -- decorative background plate, served as-is */}
   <img className="founder-plate" src="/founder/saud-office-bg.webp" alt="" width={800} height={1000} loading="lazy" decoding="async"/>
  </div>
  <div className="founder-subject">
   <span className="founder-contact" aria-hidden="true"/>
   {/* eslint-disable-next-line @next/next/no-img-element -- transparent cutout must not be cropped by next/image fill */}
   <img data-cms-image="team.image" src="/founder/saud-fg.webp" alt={alt} width={900} height={1350} loading="lazy" decoding="async"/>
  </div>
 </figure>;
}
