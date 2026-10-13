'use client';
import {useEffect,useState} from 'react';
import dynamic from 'next/dynamic';
import {useReducedMotion} from 'framer-motion';
const ThreeArchitecture=dynamic(()=>import('./ThreeArchitecture'),{ssr:false,loading:()=>null});

/** Graceful static fallback for unsupported WebGL, motion preferences and small devices. */
export default function ArchitecturalScene(){
 const reduced=useReducedMotion();
 const [enabled,setEnabled]=useState(false);
 useEffect(()=>{
  if(reduced)return;
  const canvas=document.createElement('canvas');
  const ok=!!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  setEnabled(ok);
 },[reduced]);
 return <div className="architecture-stage architecture-webgl-stage" role="img" aria-label="Artistic visualization of modern Dubai-inspired towers, not a real property">
  <div className="architecture-halo"/>
  <div className="architecture-webgl-canvas" aria-hidden="true">
    {enabled?<ThreeArchitecture reduced={!!reduced}/>:<div className="architecture-static-fallback" aria-hidden="true"><span className="architecture-static-tower short"/><span className="architecture-static-tower tall"/><span className="architecture-static-tower mid"/></div>}
  </div>
  <div className="architect-label architect-label-top"><span className="label-key">ARCHITECTURAL STUDY / 01</span><strong>THE ART OF ELEVATION</strong><span>Conceptual 3D visualization · Dubai, UAE</span></div>
  <div className="architect-label architect-label-bottom"><span className="gold-dot"/><span>CRAFTED TO INSPIRE</span></div>
  <div className="architecture-coordinate">25°12′N / 55°16′E</div>
 </div>;
}
