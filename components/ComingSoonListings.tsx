import Image from 'next/image';
import Link from 'next/link';
import {ArrowUpRight} from 'lucide-react';
import type {ComingSoonItem} from '@/lib/coming-soon';

export default function ComingSoonListings({items}:{items:ComingSoonItem[]}){
 return <section className="cs-section" aria-label="Upcoming listings">
  <div className="cs-grid">{items.map((item,i)=><article className="cs-card" key={item.title+i}>
   <div className="cs-media">
    <Image src={item.image} alt="" fill sizes="(max-width:530px) 100vw, (max-width:900px) 50vw, 33vw"/>
    <span className="cs-badge">COMING SOON</span>
   </div>
   <div className="cs-body">
    <p className="cs-label">{item.label}</p>
    <h3>{item.title}</h3>
    <p className="cs-note">Details &amp; pricing coming soon</p>
    <Link href="/contact" className="cs-link" aria-label={`Register interest: ${item.title}`}>REGISTER INTEREST <ArrowUpRight size={15}/></Link>
   </div>
  </article>)}</div>
  <p className="cs-disclaimer">Images are illustrative. Verified listings will be published here soon — contact our team to be the first to know.</p>
 </section>;
}
