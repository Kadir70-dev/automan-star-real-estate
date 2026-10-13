'use client';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
const ThreeArchitecture = dynamic(() => import('./ThreeArchitecture'), { ssr:false });
const chapters = [
  { number:'01', kicker:'THE ARCHITECTURAL VISION', title:'A new perspective.', copy:'Sculpted volumes, a luminous silhouette, and a deeper look at what makes an address iconic.' },
  { number:'02', kicker:'LIGHT & MATERIAL', title:'A study in reflection.', copy:'Move through the scene and watch the glass and metal surfaces respond to the light.' },
  { number:'03', kicker:'DESIGNED TO INSPIRE', title:'Beyond the skyline.', copy:'A cinematic expression of ambition. Explore the collection when you are ready to discover your own space.' },
];
export default function ArchitecturalStory() {
 const ref = useRef<HTMLElement>(null);
 const [visible,setVisible] = useState(false);
 const reduced = useReducedMotion();
 useEffect(()=>{
  const el=ref.current; if(!el)return;
  const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting)setVisible(true)},{rootMargin:'450px'});
  observer.observe(el);return()=>observer.disconnect();
 },[]);
 return <section id="architecture-story" ref={ref} className="architecture-story" aria-label="Three-dimensional architectural story">
  <div className="architecture-story-stage">
   <div className="story-model" aria-hidden="true">{visible && !reduced ? <ThreeArchitecture story/> : <div className="architecture-static-fallback"><span className="architecture-static-tower short"/><span className="architecture-static-tower tall"/><span className="architecture-static-tower mid"/></div>}</div>
   <div className="story-model-caption">CONCEPTUAL ARCHITECTURE · NOT AN ACTUAL PROPERTY</div>
  </div>
  <div className="story-chapters">{chapters.map(c=><article key={c.number} className="story-chapter"><span className="story-chapter-number">{c.number} / 03</span><span className="story-chapter-kicker">{c.kicker}</span><h2>{c.title}</h2><p>{c.copy}</p></article>)}</div>
 </section>;
}
