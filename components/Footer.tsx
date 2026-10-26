import type {CmsDocument} from '@/lib/cms';
import {LEADERSHIP} from '@/lib/leadership';
import Link from 'next/link';
import {Instagram,Linkedin,Mail} from 'lucide-react';
export default function Footer({site}:{site:CmsDocument}){return <footer className="ds-footer">
 <div className="container">
  <div className="ds-footer-lead">
   <h2>{site.fields['footer.heading']??'Thinking about a property in Dubai? Start with a conversation.'}</h2>
   <Link href="/contact" className="ds-btn ds-btn-sand">Contact the team</Link>
  </div>
  <div className="ds-footer-grid">
   <div className="ds-footer-brand">
    <p className="ds-footer-name">Automan Star Real Estate</p>
    <address>Office 2401, The Prism Tower<br/>Business Bay, Dubai, UAE</address>
    <ul aria-label="Leadership">{LEADERSHIP.map(l=><li key={l.name}><strong>{l.name}</strong><span>{l.role}</span></li>)}</ul>
   </div>
   <nav aria-label="Explore"><h3>Explore</h3><Link href="/properties">All properties</Link><Link href="/buy">Buy</Link><Link href="/off-plan">Off-plan</Link><Link href="/commercial">Commercial</Link><Link href="/experience">3D residence</Link></nav>
   <nav aria-label="More"><h3>More</h3><Link href="/saved">Saved properties</Link><Link href="/compare">Compare</Link><Link href="/about">About us</Link><Link href="/privacy">Privacy policy</Link></nav>
   <div><h3>Contact</h3><a href={'mailto:'+(site.fields['footer.email']||'saud@automanstarrealty.com')}><Mail size={15} aria-hidden="true"/> {site.fields['footer.email']||'saud@automanstarrealty.com'}</a><a href="https://www.linkedin.com/in/saud-kondekar-52238823a" target="_blank" rel="noopener noreferrer"><Linkedin size={15} aria-hidden="true"/> LinkedIn</a><a href="https://www.instagram.com/investwithsaud" target="_blank" rel="noopener noreferrer"><Instagram size={15} aria-hidden="true"/> Instagram</a></div>
  </div>
  <div className="ds-footer-base"><span>© {new Date().getFullYear()} Automan Star Real Estate, Dubai.</span><Link href="/dashboard">Team dashboard</Link></div>
 </div>
</footer>}
