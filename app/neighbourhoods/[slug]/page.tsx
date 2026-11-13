import Link from 'next/link';
import {notFound} from 'next/navigation';
import {ArrowUpRight,Building2,Check,Compass,Home,MapPin,Sun,TrainFront} from 'lucide-react';
import {Breadcrumbs} from '@/components/SeoGuide';
import {AreaCard} from '@/components/AreaGrid';
import {NEIGHBOURHOODS,findNeighbourhood} from '@/lib/neighbourhoods';
import {pageMetadata} from '@/lib/seo';
export const dynamicParams=false;
export function generateStaticParams(){return NEIGHBOURHOODS.map(n=>({slug:n.slug}))}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){
 const n=findNeighbourhood((await params).slug);
 if(!n)return {};
 return pageMetadata({path:`/neighbourhoods/${n.slug}`,title:`${n.name} Area Guide`,description:`${n.tagline}. Homes, lifestyle, transport and who ${n.name} suits, from Automan Star Real Estate.`.slice(0,160)});
}
export default async function Page({params}:{params:Promise<{slug:string}>}){
 const n=findNeighbourhood((await params).slug);
 if(!n)notFound();
 const i=NEIGHBOURHOODS.indexOf(n);
 const others=[1,2,3].map(k=>NEIGHBOURHOODS[(i+k)%NEIGHBOURHOODS.length]);
 const short=n.name.replace(/ \(.*\)/,'');
 return <main className="page-shell area-page"><Breadcrumbs items={[['Neighbourhood guides','/neighbourhoods'],[n.name,`/neighbourhoods/${n.slug}`]]}/><div className="container">
  <header className="area-hero">
   <p className="eyebrow"><Link href="/neighbourhoods">NEIGHBOURHOOD GUIDES</Link> / {n.emirate.toUpperCase()}</p>
   <h1 className="display-heading">{n.name}</h1>
   <p className="area-tagline">{n.tagline}</p>
   <ul className="area-quick">
    <li><MapPin size={18} aria-hidden="true"/><span>Emirate</span><b>{n.emirate}</b></li>
    <li><Building2 size={18} aria-hidden="true"/><span>Homes</span><b>{n.homeTypes.join(', ')}</b></li>
    <li><TrainFront size={18} aria-hidden="true"/><span>Transport</span><b>{n.metro}</b></li>
   </ul>
  </header>
  <p className="calc-lede area-intro">{n.intro}</p>
  <div className="area-detail">
   <div className="area-sections">
    <section><Home size={22} aria-hidden="true"/><div><h2>Homes</h2><p>{n.homes}</p></div></section>
    <section><Sun size={22} aria-hidden="true"/><div><h2>Lifestyle</h2><p>{n.lifestyle}</p></div></section>
    <section><Compass size={22} aria-hidden="true"/><div><h2>Getting around</h2><p>{n.transport}</p></div></section>
   </div>
   <aside className="area-aside">
    <h2>Who it suits</h2><ul className="area-suits">{n.suits.map(s=><li key={s}><Check size={16} aria-hidden="true"/>{s}</li>)}</ul>
    <h2>Nearby landmarks</h2><ul className="area-tags">{n.landmarks.map(s=><li key={s}>{s}</li>)}</ul>
    <div className="area-cta">
     {n.listing&&<Link className="ds-btn ds-btn-sand" href={n.listing}>View the project <ArrowUpRight size={16} aria-hidden="true"/></Link>}
     <Link className="ds-btn area-btn-dark" href="/contact">Ask about {short}</Link>
     <Link className="ds-link" href="/calculators/property-costs">Estimate buying costs</Link>
    </div>
   </aside>
  </div>
  <section className="area-others"><div className="area-others-head"><h2>More neighbourhood guides</h2><Link className="ds-link" href="/neighbourhoods">All guides</Link></div><div className="area-grid">{others.map(o=><AreaCard key={o.slug} n={o}/>)}</div></section>
 </div></main>;
}
