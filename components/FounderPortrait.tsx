'use client';
import {useEffect,useRef} from 'react';

// Frameless founder figure: the transparent Saud + chair cutout on the section's
// own background, with a gold halo, floor shadow and 3D motion. Desktop fine
// pointers tilt it in 3D (rAF-eased); touch and reduced motion stay static.
export default function FounderPortrait({alt}:{alt:string}){
 const ref=useRef<HTMLElement>(null);
 useEffect(()=>{
  const el=ref.current;
  if(!el||!matchMedia('(hover:hover) and (pointer:fine)').matches||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  let raf=0,tx=0,ty=0,x=0,y=0;
  const tick=()=>{x+=(tx-x)*.07;y+=(ty-y)*.07;el.style.setProperty('--fx',x.toFixed(4));el.style.setProperty('--fy',y.toFixed(4));raf=Math.abs(tx-x)+Math.abs(ty-y)>.001?requestAnimationFrame(tick):0};
  const kick=()=>{if(!raf)raf=requestAnimationFrame(tick)};
  const move=(e:PointerEvent)=>{const r=el.getBoundingClientRect();tx=Math.max(-1,Math.min(1,(e.clientX-r.left)/r.width*2-1));ty=Math.max(-1,Math.min(1,(e.clientY-r.top)/r.height*2-1));kick()};
  const leave=()=>{tx=0;ty=0;kick()};
  const zone=el.closest('section')||el;
  zone.addEventListener('pointermove',move as EventListener,{passive:true});zone.addEventListener('pointerleave',leave);
  return()=>{cancelAnimationFrame(raf);zone.removeEventListener('pointermove',move as EventListener);zone.removeEventListener('pointerleave',leave)};
 },[]);
 return <figure ref={ref} className="founder-portrait founder-pop">
  <span className="founder-halo" aria-hidden="true"/>
  <span className="founder-floor" aria-hidden="true"/>
  <div className="founder-subject">
   {/* eslint-disable-next-line @next/next/no-img-element -- transparent cutout must not be cropped by next/image fill */}
   <img data-cms-image="team.image" src="/founder/saud-fg.webp" alt={alt} width={900} height={1350} loading="lazy" decoding="async"/>
  </div>
 </figure>;
}
