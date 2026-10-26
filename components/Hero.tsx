import Link from 'next/link';
import SearchBar from './SearchBar';
import HeroBannerSlider from './HeroBannerSlider';
import {publishedCMS, type CMSHome} from '@/lib/cms';
import CMSInlineHeroEdit from './CMSInlineHeroEdit';
export default async function Hero(){
 const content=await publishedCMS<CMSHome>('home');
 const heading=typeof content?.heading==='string' && content.heading.trim()?content.heading:'Buy well in Dubai.';
 const description=typeof content?.description==='string' && content.description.trim()?content.description:'Apartments, villas, off-plan and commercial property, advised from our office in Business Bay.';
 const primary=content?.primary_button;
 const allowedHref=typeof primary?.href==='string' && /^\/(?!\/)[a-z0-9\/_-]*$/i.test(primary.href)?primary.href:'/properties';
 const primaryLabel=typeof primary?.label==='string' && primary.label.trim()?primary.label:'Browse properties';
 return <section className="hero-ds" aria-labelledby="hero-title">
 <HeroBannerSlider/>
 <div className="hero-ds-shade" aria-hidden="true"/>
 <div className="container hero-ds-inner">
  <div className="hero-ds-copy">
   <h1 id="hero-title">{heading}</h1>
   <p>{description}</p>
   <div className="hero-ds-actions"><Link href={allowedHref} className="ds-btn ds-btn-sand">{primaryLabel}</Link><Link href="/contact" className="ds-btn ds-btn-glass">Book a consultation</Link></div>
  </div>
  <SearchBar/>
  <CMSInlineHeroEdit/>
 </div>
</section>}
