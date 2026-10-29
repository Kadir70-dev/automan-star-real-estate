'use client';
import {useCallback,useEffect,useRef,useState} from 'react';

const SEEN_KEY='automan-door-entrance-v1';
type Phase='ready'|'walking'|'opening'|'leaving'|'gone';

/** Lightweight original CSS-3D foyer. Homepage only; no WebGL or external assets. */
export default function EntranceDoor(){
 const [phase,setPhase]=useState<Phase>('ready');
 const timers=useRef<number[]>([]);
 const enterRef=useRef<HTMLButtonElement>(null);
 const skipRef=useRef<HTMLButtonElement>(null);
 const overlayRef=useRef<HTMLDivElement>(null);
 const previousFocus=useRef<HTMLElement|null>(null);
 const clearTimers=useCallback(()=>{timers.current.forEach(id=>window.clearTimeout(id));timers.current=[];},[]);
 const finish=useCallback(()=>{
  clearTimers();
  try{sessionStorage.setItem(SEEN_KEY,'1')}catch{/* private mode */}
  // Keeps the overlay invisible on client-side return navigation, before effects run.
  document.documentElement.setAttribute('data-automan-door-skip','1');
  setPhase('gone');
  window.dispatchEvent(new Event('automan:entrance-finished'));
  const old=previousFocus.current;
  if(old&&document.contains(old))old.focus({preventScroll:true});
 },[clearTimers]);
 const start=useCallback(()=>{
  if(phase!=='ready')return;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){finish();return;}
  setPhase('walking');
  timers.current.push(window.setTimeout(()=>setPhase('opening'),900));
  timers.current.push(window.setTimeout(()=>setPhase('leaving'),3100));
  timers.current.push(window.setTimeout(finish,3700));
 },[phase,finish]);

 useEffect(()=>{
  previousFocus.current=document.activeElement as HTMLElement|null;
  let seen=false;try{seen=sessionStorage.getItem(SEEN_KEY)==='1'}catch{}
  if(seen||matchMedia('(prefers-reduced-motion: reduce)').matches){finish();return;}
  enterRef.current?.focus({preventScroll:true});
  return clearTimers;
 },[finish,clearTimers]);
 const active=phase!=='gone';
 useEffect(()=>{
  if(!active)return;
  const body=document.body,overflow=body.style.overflow;
  body.style.overflow='hidden';
  // Inert the page behind this modal, including siblings in the route and site chrome.
  // This stops screen readers and keyboard navigation from reaching hidden controls.
  const inerted:Array<{el:HTMLElement;previous:boolean}>=[];
  let current:HTMLElement|null=overlayRef.current;
  while(current&&current!==body){
   const parent:HTMLElement|null=current.parentElement;
   if(!parent)break;
   for(const child of Array.from(parent.children)){
    if(child!==current&&child instanceof HTMLElement){
     inerted.push({el:child,previous:child.inert});
     child.inert=true;
    }
   }
   current=parent;
  }
  const onKey=(e:KeyboardEvent)=>{
   if(e.key==='Escape'){e.preventDefault();finish();return;}
   if(e.key!=='Tab')return;
   const buttons=[enterRef.current,skipRef.current].filter((el):el is HTMLButtonElement=>!!el&&!el.disabled&&el.offsetParent!==null);
   if(!buttons.length)return;
   const first=buttons[0],last=buttons[buttons.length-1];
   if(e.shiftKey&&(document.activeElement===first||!buttons.includes(document.activeElement as HTMLButtonElement))){e.preventDefault();last.focus();}
   else if(!e.shiftKey&&(document.activeElement===last||!buttons.includes(document.activeElement as HTMLButtonElement))){e.preventDefault();first.focus();}
  };
  document.addEventListener('keydown',onKey);
  return ()=>{
   body.style.overflow=overflow;
   inerted.forEach(({el,previous})=>{el.inert=previous;});
   document.removeEventListener('keydown',onKey);
  };
 },[active,finish]);
 if(phase==='gone')return null;
 return <div ref={overlayRef} data-automan-entrance="" className={'as-entrance as-entrance--'+phase} role="dialog" aria-modal="true" aria-labelledby="as-entrance-title" aria-describedby="as-entrance-copy">
  <div className="as-entrance-ambient" aria-hidden="true"/>
  <div className="as-entrance-perspective" aria-hidden="true">
   <div className="as-entrance-scene">
    <div className="as-entrance-ceiling"/>
    <div className="as-entrance-floor"/>
    <div className="as-entrance-wall as-entrance-wall--left"><i/><i/><i/></div>
    <div className="as-entrance-wall as-entrance-wall--right"><i/><i/><i/></div>
    <div className="as-entrance-backwall">
     <div className="as-entrance-portal">
      <div className="as-entrance-lintel"/><div className="as-entrance-light"/>
      <div className="as-entrance-doorframe">
       <div className="as-entrance-door as-entrance-door--left"><span className="as-entrance-door-inlay"/><span className="as-entrance-handle"/></div>
       <div className="as-entrance-door as-entrance-door--right"><span className="as-entrance-door-inlay"/><span className="as-entrance-handle"/></div>
      </div>
     </div>
    </div>
    <span className="as-entrance-walllight as-entrance-walllight--left"/>
    <span className="as-entrance-walllight as-entrance-walllight--right"/>
   </div>
  </div>
  <div className="as-entrance-ui">
   <div className="as-entrance-brand" aria-hidden="true"><span className="as-entrance-brand-mark">A<span>✳</span></span><span>AUTOMAN STAR <small>REAL ESTATE · DUBAI</small></span></div>
   <div className="as-entrance-message">
    <p className="as-entrance-eyebrow">AN INVITATION INSIDE</p>
    <h2 id="as-entrance-title">A new perspective<br/><em>on Dubai living.</em></h2>
    <p id="as-entrance-copy">Step inside a more considered property experience.</p>
    <button type="button" className="as-entrance-enter" ref={enterRef} onClick={start} disabled={phase!=='ready'}><span>{phase==='ready'?'Enter the experience':'Entering…'}</span><span aria-hidden="true">↗</span></button>
   </div>
   <button type="button" ref={skipRef} className="as-entrance-skip" onClick={finish}>Skip introduction <span aria-hidden="true">→</span></button>
   <span className="as-entrance-index" aria-hidden="true">01 / AUTOMAN STAR</span>
  </div>
 </div>;
}
