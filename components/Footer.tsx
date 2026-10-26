import type {CmsDocument} from '@/lib/cms';
import {LEADERSHIP} from '@/lib/leadership';
import Link from 'next/link';
import {Instagram,Linkedin,Mail} from 'lucide-react';
export default function Footer({site}:{site?:CmsDocument}={}){return <footer className="ds-footer">
 <div className="container">
  <div className="ds-footer-lead">
   <h2 data-cms-field="footer.heading">{site?.fields['footer.heading']??'Thinking about a property in Dubai? Start with a conversation.'}</h2>
   <Link href="/contact" className="ds-btn ds-btn-sand">{site?.fields['footer.cta']||'Contact the team'}</Link>
  </div>
  <div className="ds-footer-grid">
   <div className="ds-footer-brand">
    <p className="ds-footer-name">{site?.fields['business.name']||'Automan Star Real Estate'}</p>
    <address>{site?.fields['business.address']||<>Office 2401, The Prism Tower<br/>Business Bay, Dubai, UAE</>}</address>
    <ul aria-label="Leadership">{LEADERSHIP.map((l,i)=><li key={l.name}><strong>{site?.fields[`leadership.${i}.name`]||l.name}</strong><span>{site?.fields[`leadership.${i}.role`]||l.role}</span></li>)}</ul>
   </div>
   <nav aria-label="Explore"><h3>Explore</h3><Link href="/properties">{site?.fields['nav.properties']||'All properties'}</Link><Link href="/buy">{site?.fields['nav.buy']||'Buy'}</Link><Link href="/off-plan">{site?.fields['nav.off-plan']||'Off-plan'}</Link><Link href="/commercial">{site?.fields['nav.commercial']||'Commercial'}</Link><Link href="/experience">{site?.fields['nav.experience']||'3D residence'}</Link></nav>
   <nav aria-label="More"><h3>More</h3><Link href="/saved">Saved properties</Link><Link href="/compare">Compare</Link><Link href="/about">About us</Link><Link href="/privacy">Privacy policy</Link></nav>
   <div><h3>Contact</h3><a href={'mailto:'+(site?.fields['footer.email']||'saud@automanstarrealty.com')}><Mail size={15} aria-hidden="true"/> {site?.fields['footer.email']||'saud@automanstarrealty.com'}</a><a href={site?.fields['social.linkedin']||'https://www.linkedin.com/in/saud-kondekar-52238823a'} target="_blank" rel="noopener noreferrer"><Linkedin size={15} aria-hidden="true"/> LinkedIn</a><a href={site?.fields['social.instagram']||'https://www.instagram.com/investwithsaud'} target="_blank" rel="noopener noreferrer"><Instagram size={15} aria-hidden="true"/> Instagram</a>{site?.fields['business.phone']&&<a href={'tel:'+site.fields['business.phone'].replace(/[^+\d]/g,'')}>{site.fields['business.phone']}</a>}</div>
  </div>
  <div className="ds-footer-base"><span>© {new Date().getFullYear()} Automan Star Real Estate, Dubai.</span><Link href="/dashboard">Team dashboard</Link></div>
 </div>
</footer>}
