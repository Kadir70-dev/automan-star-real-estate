import Link from 'next/link';
import {breadcrumbJsonLd,jsonLdHtml} from '@/lib/seo';
export type GuideItem={title:string;copy:string};
// Server-rendered buyer guidance shown under the listing area of service pages.
export function SeoGuide({id,title,intro,items,cta,fieldPrefix}:{id:string;title:string;intro:string;items:GuideItem[];cta:{lead:string;href:string;label:string};fieldPrefix?:string}){
 return <section className="seo-guide" aria-labelledby={id}>
  <h2 id={id} data-cms-field={fieldPrefix?fieldPrefix+'.title':undefined}>{title}</h2>
  <p data-cms-field={fieldPrefix?fieldPrefix+'.intro':undefined}>{intro}</p>
  <div className="seo-guide-grid">{items.map((i,index)=><div key={index}><h3 data-cms-field={fieldPrefix?fieldPrefix+'.'+index+'.title':undefined}>{i.title}</h3><p data-cms-field={fieldPrefix?fieldPrefix+'.'+index+'.copy':undefined}>{i.copy}</p></div>)}</div>
  <p><span data-cms-field={fieldPrefix?fieldPrefix+'.cta.lead':undefined}>{cta.lead}</span> <Link data-cms-field={fieldPrefix?fieldPrefix+'.cta.label':undefined} href={cta.href}>{cta.label}</Link></p>
 </section>;
}
export function Breadcrumbs({items}:{items:[name:string,path:string][]}){
 return <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(breadcrumbJsonLd(items))}/>;
}
