'use client';
import type {CmsDocument} from '@/lib/cms';
import Link from 'next/link';
import Image from 'next/image';
import {usePathname} from 'next/navigation';
import {useEffect,useState} from 'react';
import {Menu,X} from 'lucide-react';
import {PrefsSwitcher,usePrefs} from '@/components/Prefs';
import type {Key} from '@/lib/i18n';
const nav:[string,string][]=[['/properties','Properties'],['/buy','Buy'],['/off-plan','Off-plan'],['/commercial','Commercial'],['/neighbourhoods','Areas'],['/calculators','Calculators'],['/experience','3D residence'],['/about','About']];
const navKey:Record<string,Key>={'/properties':'nav.properties','/buy':'nav.buy','/off-plan':'nav.off-plan','/commercial':'nav.commercial','/neighbourhoods':'nav.areas','/calculators':'nav.calculators','/experience':'nav.experience','/about':'nav.about'};
export default function Header({site}:{site?:CmsDocument}={}){
 const [open,setOpen]=useState(false);
 const [scrolled,setScrolled]=useState(false);
 const pathname=usePathname();
 const {lang,t,dir}=usePrefs();
 // CMS labels are English; other languages use the built-in interface strings.
 const label=(field:string,key:Key,fallback:string)=>lang==='en'?(site?.fields[field]||fallback):t(key);
 useEffect(()=>{const watch=()=>setScrolled(window.scrollY>26);watch();window.addEventListener('scroll',watch,{passive:true});return()=>window.removeEventListener('scroll',watch)},[]);
 useEffect(()=>setOpen(false),[pathname]);
 useEffect(()=>{if(!open)return;const esc=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false)};window.addEventListener('keydown',esc);document.documentElement.classList.add('nav-locked');return()=>{window.removeEventListener('keydown',esc);document.documentElement.classList.remove('nav-locked')}},[open]);
 const isActive=(href:string)=>pathname===href||pathname.startsWith(href+'/');
 return <header className={'site-header ds-header'+(scrolled?' header-scrolled':'')+(open?' header-open':'')}>
  <div className="nav-inner container">
   <Link className="brand" href="/" onClick={()=>setOpen(false)} aria-label="AMS Realty, Automan Star Real Estate home"><Image className="brand-logo"  src={site?.fields['header.logo']||'/saudlogo-nav-mark.png'} alt={site?.fields['header.logo_alt']||'AMS Realty'} width={223} height={129} priority unoptimized/></Link>
   <nav id="main-navigation" className={'navigation'+(open?' open':'')} aria-label="Primary navigation" dir={dir}>
    {nav.map(([href,name])=><Link key={href} href={site?.fields['nav.'+href.substring(1)+'.href']||href} onClick={()=>setOpen(false)} className={isActive(href)?'active':''} aria-current={isActive(href)?'page':undefined}>{label('nav.'+href.substring(1),navKey[href],name)}</Link>)}
    <Link href={site?.fields['nav.contact.href']||'/contact'} className="nav-mobile-contact" onClick={()=>setOpen(false)}>{label('nav.contact','nav.contact','Contact')}</Link>
    <PrefsSwitcher className="prefs-mobile"/>
   </nav>
   <Link href={site?.fields['nav.contact.href']||'/contact'} className="ds-btn ds-btn-line nav-cta">{label('nav.contact','nav.contact','Contact')}</Link>
   <PrefsSwitcher className="prefs-desktop"/>
   <button className="mobile-toggle" onClick={()=>setOpen(!open)} aria-controls="main-navigation" aria-expanded={open} aria-label={open?'Close menu':'Open menu'}>{open?<X/>:<Menu/>}</button>
  </div>
 </header>;
}
