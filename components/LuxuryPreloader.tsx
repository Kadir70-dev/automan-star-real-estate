'use client';
import {useEffect,useState} from 'react';
export default function LuxuryPreloader(){
 const [visible,setVisible]=useState(false);
 useEffect(()=>{
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  try {if(sessionStorage.getItem('automan-preloader-seen'))return;sessionStorage.setItem('automan-preloader-seen','1')}catch{return}
  setVisible(true);
  const timer=window.setTimeout(()=>setVisible(false),1450);
  return ()=>window.clearTimeout(timer);
 },[]);
 if(!visible)return null;
 return <div className="luxury-preloader" role="status" aria-label="Loading Automan Star Real Estate">
  <div className="luxury-preloader-brand"><span className="luxury-preloader-monogram">A<span>✳</span></span><span className="luxury-preloader-title">AUTOMAN <b>STAR</b><small>REAL ESTATE</small></span></div>
  <div className="luxury-preloader-track"><span/></div>
  <span className="luxury-preloader-caption">CURATED LIVING · DUBAI</span>
 </div>;
}
