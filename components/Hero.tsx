import {cmsText,type CmsDocument} from '@/lib/cms';
import Link from 'next/link';
import SearchBar from './SearchBar';
import HeroBannerSlider from './HeroBannerSlider';
export default function Hero({cms}:{cms:CmsDocument}){return <section className="hero-ds" aria-labelledby="hero-title">
 <HeroBannerSlider/>
 <div className="hero-ds-shade" aria-hidden="true"/>
 <div className="container hero-ds-inner">
  <div className="hero-ds-copy">
   <h1 id="hero-title" data-cms-field="hero.title">{cmsText(cms,'hero.title','Buy well in Dubai.')}</h1>
   <p data-cms-field="hero.description">{cmsText(cms,'hero.description','Apartments, villas, off-plan and commercial property, advised from our office in Business Bay.')}</p>
   <div className="hero-ds-actions"><Link href="/properties" className="ds-btn ds-btn-sand">Browse properties</Link><Link href="/contact" className="ds-btn ds-btn-glass">Book a consultation</Link></div>
  </div>
  <SearchBar/>
 </div>
</section>}
