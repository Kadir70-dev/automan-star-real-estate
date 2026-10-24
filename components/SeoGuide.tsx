import Link from 'next/link';
import {breadcrumbJsonLd,jsonLdHtml} from '@/lib/seo';
export type GuideItem={title:string;copy:string};
// Server-rendered buyer guidance shown under the listing area of service pages.
export function SeoGuide({id,title,intro,items,cta}:{id:string;title:string;intro:string;items:GuideItem[];cta:{lead:string;href:string;label:string}}){
 return <section className="seo-guide" aria-labelledby={id}>
  <h2 id={id}>{title}</h2>
  <p>{intro}</p>
  <div className="seo-guide-grid">{items.map(i=><div key={i.title}><h3>{i.title}</h3><p>{i.copy}</p></div>)}</div>
  <p>{cta.lead} <Link href={cta.href}>{cta.label}</Link></p>
 </section>;
}
export function Breadcrumbs({items}:{items:[name:string,path:string][]}){
 return <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(breadcrumbJsonLd(items))}/>;
}
