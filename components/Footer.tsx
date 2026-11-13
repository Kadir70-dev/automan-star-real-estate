'use client';
import type {CmsDocument} from '@/lib/cms';
import {LEADERSHIP} from '@/lib/leadership';
import Link from 'next/link';
import {Instagram,Linkedin,Mail} from 'lucide-react';
import {usePrefs} from '@/components/Prefs';
export default function Footer({site}:{site?:CmsDocument}={}){const {t,dir,lang}=usePrefs();const L=(field:string,key:Parameters<typeof t>[0],fallback:string)=>lang==='en'?(site?.fields[field]||fallback):t(key);return <footer className="ds-footer">
 <div className="container">
  <div className="ds-footer-lead">
   <h2 >{lang==='en'?(site?.fields['footer.heading']??'Thinking about a property in Dubai? Start with a conversation.'):t('footer.heading')}</h2>
   <Link href={site?.fields['footer.cta.href']||'/contact'} className="ds-btn ds-btn-sand">{L('footer.cta','footer.cta','Contact the team')}</Link>
  </div>
  <div className="ds-footer-grid">
   <div className="ds-footer-brand">
    <p className="ds-footer-name">{site?.fields['business.name']||'Automan Star Real Estate'}</p>
    <address>{site?.fields['business.address']||<>Office 2401, The Prism Tower<br/>Business Bay, Dubai, UAE</>}</address>
    <ul aria-label="Leadership">{LEADERSHIP.map((l,i)=><li key={l.name}><strong>{site?.fields[`leadership.${i}.name`]||l.name}</strong><span>{site?.fields[`leadership.${i}.role`]||l.role}</span></li>)}</ul>
   </div>
   <nav aria-label="Explore" dir={dir}><h3>{t('footer.explore')}</h3><Link href={site?.fields['nav.properties.href']||'/properties'}>{L('nav.properties','footer.all','All properties')}</Link><Link href={site?.fields['nav.buy.href']||'/buy'}>{L('nav.buy','nav.buy','Buy')}</Link><Link href={site?.fields['nav.off-plan.href']||'/off-plan'}>{L('nav.off-plan','nav.off-plan','Off-plan')}</Link><Link href={site?.fields['nav.commercial.href']||'/commercial'}>{L('nav.commercial','nav.commercial','Commercial')}</Link><Link href={site?.fields['nav.experience.href']||'/experience'}>{L('nav.experience','nav.experience','3D residence')}</Link></nav>
   <nav aria-label="Buyer tools" dir={dir}><h3>{t('footer.tools')}</h3><Link href="/calculators/mortgage">{t('footer.mortgage')}</Link><Link href="/calculators/property-costs">{t('footer.costs')}</Link><Link href="/neighbourhoods">{t('footer.areas')}</Link></nav>
   <nav aria-label="More" dir={dir}><h3>{t('footer.more')}</h3><Link href="/saved">{t('footer.saved')}</Link><Link href="/compare">{t('footer.compare')}</Link><Link href={site?.fields['nav.about.href']||'/about'}>{t('footer.aboutUs')}</Link><Link href={site?.fields['nav.privacy.href']||'/privacy'}>{t('footer.privacy')}</Link></nav>
   <div><h3>{t('footer.contact')}</h3><a href={'mailto:'+(site?.fields['footer.email']||'saud@automanstarrealty.com')}><Mail size={15} aria-hidden="true"/> {site?.fields['footer.email']||'saud@automanstarrealty.com'}</a><a href={site?.fields['social.linkedin']||'https://www.linkedin.com/in/saud-kondekar-52238823a'} target="_blank" rel="noopener noreferrer"><Linkedin size={15} aria-hidden="true"/> LinkedIn</a><a href={site?.fields['social.instagram']||'https://www.instagram.com/investwithsaud'} target="_blank" rel="noopener noreferrer"><Instagram size={15} aria-hidden="true"/> Instagram</a>{site?.fields['business.phone']&&<a href={'tel:'+site.fields['business.phone'].replace(/[^+\d]/g,'')}>{site.fields['business.phone']}</a>}</div>
  </div>
  <div className="ds-footer-base"><span>© {new Date().getFullYear()} Automan Star Real Estate, Dubai.</span><Link href="/dashboard">Team dashboard</Link></div>
 </div>
</footer>}
