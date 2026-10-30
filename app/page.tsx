import {getCms,cmsText,cmsMetadata} from '@/lib/cms';
import Image from 'next/image';
import Link from 'next/link';
import ArchitecturalStory from '@/components/ArchitecturalStory';
import Hero from '@/components/Hero';
import EntranceDoor from '@/components/EntranceDoor';
import PropertyCard from '@/components/PropertyCard';
import {communities,properties} from '@/lib/data';
import {LEADERSHIP} from '@/lib/leadership';
import './home.css';
import './entrance-door.css';
import type {Metadata} from 'next';
import {pageMetadata} from '@/lib/seo';

const FOUNDER=LEADERSHIP[0];

const baseMetadata:Metadata={
 ...pageMetadata({path:'/',title:'Automan Star Real Estate',description:'Dubai real estate agency in Business Bay. Automan Star Real Estate helps you buy apartments, villas, off-plan and commercial property in Dubai.',socialTitle:'Automan Star Real Estate | Dubai Real Estate Agency'}),
 title:{absolute:'Automan Star Real Estate | Dubai Real Estate Agency, Business Bay'},
};

export async function generateMetadata():Promise<Metadata>{return cmsMetadata(await getCms('home'),baseMetadata)}

const services=[
 {key:'buy',href:'/buy',title:'Ready homes',copy:'Apartments, villas and townhouses ready for handover now.'},
 {key:'offplan',href:'/off-plan',title:'Off-plan',copy:'New launches from Dubai developers, with payment plans reviewed line by line.'},
 {key:'commercial',href:'/commercial',title:'Commercial',copy:'Offices and retail units for owner-occupiers and investors.'},
];

export default async function Home(){const cms=await getCms("home");return <main className="home">
 <EntranceDoor/>
 <Hero cms={cms}/>
 <ArchitecturalStory cms={cms}/>

 <section className="home-collection" aria-labelledby="collection-title">
  <div className="container">
   <div className="home-head">
    <h2 id="collection-title" data-cms-field="collection.title">{cmsText(cms,'collection.title','A preview of the collection')}</h2>
    <Link href="/properties" className="ds-link" data-cms-field="collection.cta">{cmsText(cms,'collection.cta','See all properties')}</Link>
   </div>
   <div className="home-cards">{properties.filter(p=>p.featured).slice(0,3).map((p,i)=><PropertyCard property={p} index={i} key={p.id}/>)}</div>
   <p className="home-note" data-cms-field="collection.note">{cmsText(cms,'collection.note','These are concept listings for illustration. Verified listings are published on the properties page as they become available.')}</p>
  </div>
 </section>

 <section className="home-services" aria-labelledby="services-title">
  <div className="container home-services-grid">
   <div className="home-services-image"><Image data-cms-image="services.image" unoptimized src={cmsText(cms,'services.image','https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=80')} alt={cmsText(cms,'services.alt','Living room with floor-to-ceiling windows')} fill sizes="(max-width: 900px) 100vw, 45vw"/></div>
   <div>
    <h2 id="services-title" data-cms-field="services.title">{cmsText(cms,'services.title','What we help you buy')}</h2>
    <ul className="home-services-list">{services.map(s=><li key={s.href}><Link href={s.href}><strong data-cms-field={`services.${s.key}.title`}>{cmsText(cms,`services.${s.key}.title`,s.title)}</strong><span data-cms-field={`services.${s.key}.copy`}>{cmsText(cms,`services.${s.key}.copy`,s.copy)}</span></Link></li>)}</ul>
   </div>
  </div>
 </section>

 <section className="home-areas" aria-labelledby="areas-title">
  <div className="container">
   <div className="home-head"><h2 id="areas-title" data-cms-field="areas.title">{cmsText(cms,'areas.title','Where our clients buy')}</h2></div>
   <div className="home-areas-grid">{communities.map(c=><Link key={c.name} className="home-area" href={'/properties?location='+encodeURIComponent(c.name)}>
    <Image data-cms-image={`areas.${communities.indexOf(c)}.image`} unoptimized src={cmsText(cms,`areas.${communities.indexOf(c)}.image`,c.image)} fill alt={cmsText(cms,`areas.${communities.indexOf(c)}.alt`,c.name)} sizes="(max-width: 700px) 100vw, 33vw"/>
    <span data-cms-field={`areas.${communities.indexOf(c)}.title`}>{cmsText(cms,`areas.${communities.indexOf(c)}.title`,c.name)}</span>
   </Link>)}</div>
  </div>
 </section>

 <section className="home-founder" aria-labelledby="founder-name">
  <div className="container home-founder-grid">
   <figure className="founder-portrait">
    <div className="founder-frame">
     {(()=>{const src=cmsText(cms,'team.image','/saud.jpeg');return <Image data-cms-image="team.image" src={src} unoptimized fill alt={cmsText(cms,'team.alt','Saud Kondekar, Founder and CEO of Automan Star Real Estate, in his Business Bay office')} sizes="(max-width: 800px) 100vw, 42vw"/>})()}
    </div>
   </figure>
   <div className="founder-copy">
    <span className="founder-monogram" aria-hidden="true">{FOUNDER.initials}</span>
    <h2 id="founder-name" data-cms-field="leadership.0.name">{cmsText(cms,'leadership.0.name',FOUNDER.name)}</h2>
    <span className="founder-rule" aria-hidden="true"/>
    <p className="founder-role" data-cms-field="leadership.0.role">{cmsText(cms,'leadership.0.role',FOUNDER.role)}</p>
    <Link href="/contact" className="ds-btn ds-btn-line founder-cta" data-cms-field="team.cta">{cmsText(cms,'team.cta','Speak with Saud')}</Link>
   </div>
  </div>
 </section>

 <section className="home-tour" aria-labelledby="tour-title">
  <div className="container home-tour-inner">
   <div><h2 id="tour-title" data-cms-field="tour.title">{cmsText(cms,'tour.title','Walk through a concept residence in 3D.')}</h2><p data-cms-field="tour.description">{cmsText(cms,'tour.description','Move between rooms, switch finishes and check the view from different floors. Illustrative only.')}</p></div>
   <Link href="/experience" className="ds-btn ds-btn-line" data-cms-field="tour.cta">{cmsText(cms,'tour.cta','Open the 3D residence')}</Link>
  </div>
 </section>
</main>}
