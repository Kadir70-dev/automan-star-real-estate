import {getCms,cmsText,cmsMetadata} from '@/lib/cms';
import Image from 'next/image';
import Link from 'next/link';
import ArchitecturalStory from '@/components/ArchitecturalStory';
import Hero from '@/components/Hero';
import PropertyCard from '@/components/PropertyCard';
import {communities,properties} from '@/lib/data';
import {LEADERSHIP} from '@/lib/leadership';
import './home.css';
import type {Metadata} from 'next';
import {pageMetadata} from '@/lib/seo';

const baseMetadata:Metadata={
 ...pageMetadata({path:'/',title:'Automan Star Real Estate',description:'Dubai real estate agency in Business Bay. Automan Star Real Estate helps you buy apartments, villas, off-plan and commercial property in Dubai.',socialTitle:'Automan Star Real Estate | Dubai Real Estate Agency'}),
 title:{absolute:'Automan Star Real Estate | Dubai Real Estate Agency, Business Bay'},
};

export async function generateMetadata():Promise<Metadata>{return cmsMetadata(await getCms('home'),baseMetadata)}

const services=[
 {href:'/buy',title:'Ready homes',copy:'Apartments, villas and townhouses ready for handover now.'},
 {href:'/off-plan',title:'Off-plan',copy:'New launches from Dubai developers, with payment plans reviewed line by line.'},
 {href:'/commercial',title:'Commercial',copy:'Offices and retail units for owner-occupiers and investors.'},
];

export default async function Home(){const cms=await getCms("home");return <main className="home">
 <Hero cms={cms}/>
 <ArchitecturalStory/>

 <section className="home-collection" aria-labelledby="collection-title">
  <div className="container">
   <div className="home-head">
    <h2 id="collection-title" data-cms-field="collection.title">{cmsText(cms,'collection.title','A preview of the collection')}</h2>
    <Link href="/properties" className="ds-link">See all properties</Link>
   </div>
   <div className="home-cards">{properties.filter(p=>p.featured).slice(0,3).map((p,i)=><PropertyCard property={p} index={i} key={p.id}/>)}</div>
   <p className="home-note" data-cms-field="collection.note">{cmsText(cms,'collection.note','These are concept listings for illustration. Verified listings are published on the properties page as they become available.')}</p>
  </div>
 </section>

 <section className="home-services" aria-labelledby="services-title">
  <div className="container home-services-grid">
   <div className="home-services-image"><Image data-cms-image="services.image" unoptimized src={cmsText(cms,'services.image','https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=80')} alt="Living room with floor-to-ceiling windows" fill sizes="(max-width: 900px) 100vw, 45vw"/></div>
   <div>
    <h2 id="services-title" data-cms-field="services.title">{cmsText(cms,'services.title','What we help you buy')}</h2>
    <ul className="home-services-list">{services.map(s=><li key={s.href}><Link href={s.href}><strong>{s.title}</strong><span>{s.copy}</span></Link></li>)}</ul>
   </div>
  </div>
 </section>

 <section className="home-areas" aria-labelledby="areas-title">
  <div className="container">
   <div className="home-head"><h2 id="areas-title" data-cms-field="areas.title">{cmsText(cms,'areas.title','Where our clients buy')}</h2></div>
   <div className="home-areas-grid">{communities.map(c=><Link key={c.name} className="home-area" href={'/properties?location='+encodeURIComponent(c.name)}>
    <Image src={c.image} fill alt="" sizes="(max-width: 700px) 100vw, 33vw"/>
    <span>{c.name}</span>
   </Link>)}</div>
  </div>
 </section>

 <section className="home-team" aria-labelledby="team-title">
  <div className="container home-team-grid">
   <h2 id="team-title" data-cms-field="team.title">{cmsText(cms,'team.title','You will work directly with the partners.')}</h2>
   <ul className="home-team-list">{LEADERSHIP.map(l=><li key={l.name}><span className="home-team-mark" aria-hidden="true">{l.initials}</span><span><strong>{l.name}</strong><small>{l.role}</small></span></li>)}</ul>
   <div className="home-team-office">
    <p>Office 2401, The Prism Tower<br/>Business Bay, Dubai</p>
    <a className="ds-link" href="https://maps.google.com/?q=The+Prism+Tower+Business+Bay+Dubai" target="_blank" rel="noopener noreferrer">Open in Maps</a>
   </div>
  </div>
 </section>

 <section className="home-tour" aria-labelledby="tour-title">
  <div className="container home-tour-inner">
   <div><h2 id="tour-title">Walk through a concept residence in 3D.</h2><p>Move between rooms, switch finishes and check the view from different floors. Illustrative only.</p></div>
   <Link href="/experience" className="ds-btn ds-btn-line">Open the 3D residence</Link>
  </div>
 </section>
</main>}
