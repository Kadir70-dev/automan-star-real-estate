import type {CmsDocument} from '@/lib/cms';
'use client';
import Link from 'next/link';
import Image from 'next/image';
import {usePathname} from 'next/navigation';
import {useEffect,useState} from 'react';
import {Menu,X} from 'lucide-react';
const nav:[string,string][]=[['/properties','Properties'],['/buy','Buy'],['/off-plan','Off-plan'],['/commercial','Commercial'],['/experience','3D residence'],['/about','About']];
export default function Header({site}:{site:CmsDocument}){
 const [open,setOpen]=useState(false);
 const [scrolled,setScrolled]=useState(false);
 const pathname=usePathname();
 useEffect(()=>{const watch=()=>setScrolled(window.scrollY>26);watch();window.addEventListener('scroll',watch,{passive:true});return()=>window.removeEventListener('scroll',watch)},[]);
 useEffect(()=>setOpen(false),[pathname]);
 useEffect(()=>{if(!open)return;const esc=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false)};window.addEventListener('keydown',esc);document.documentElement.classList.add('nav-locked');return()=>{window.removeEventListener('keydown',esc);document.documentElement.classList.remove('nav-locked')}},[open]);
 const isActive=(href:string)=>pathname===href||pathname.startsWith(href+'/');
 return <header className={'site-header ds-header'+(scrolled?' header-scrolled':'')+(open?' header-open':'')}>
  <div className="nav-inner container">
   <Link className="brand" href="/" onClick={()=>setOpen(false)} aria-label="AMS Realty, Automan Star Real Estate home"><Image className="brand-logo" data-cms-image="header.logo" src={site.fields['header.logo']||'/saudlogo-nav-mark.png'} alt="AMS Realty" width={223} height={129} priority unoptimized/></Link>
   <nav id="main-navigation" className={'navigation'+(open?' open':'')} aria-label="Primary navigation">
    {nav.map(([href,name])=><Link key={href} href={href} onClick={()=>setOpen(false)} className={isActive(href)?'active':''} aria-current={isActive(href)?'page':undefined}>{name}</Link>)}
    <Link href="/contact" className="nav-mobile-contact" onClick={()=>setOpen(false)}>Contact</Link>
   </nav>
   <Link href="/contact" className="ds-btn ds-btn-line nav-cta">Contact</Link>
   <button className="mobile-toggle" onClick={()=>setOpen(!open)} aria-controls="main-navigation" aria-expanded={open} aria-label={open?'Close menu':'Open menu'}>{open?<X/>:<Menu/>}</button>
  </div>
 </header>;
}
