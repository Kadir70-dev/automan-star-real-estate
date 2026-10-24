import ComingSoonListings from '@/components/ComingSoonListings';import {COMING_SOON} from '@/lib/coming-soon';import Link from 'next/link';
import {Breadcrumbs,SeoGuide} from '@/components/SeoGuide';import {pageMetadata} from '@/lib/seo';
export const metadata=pageMetadata({path:'/buy',title:'Buy Property in Dubai',description:'Looking to buy an apartment, villa or townhouse in Dubai? Get practical buying guidance and shortlists from Automan Star Real Estate in Business Bay.'});
export default function Page(){return <main className="final-collection page-shell"><Breadcrumbs items={[['Buy property in Dubai','/buy']]}/><div className="container"><p className="eyebrow dark-eyebrow">THE AUTOMAN COLLECTION</p><h1 className="display-heading">Buy property <em>in Dubai.</em></h1><p>Apartments, villas and townhouses in Dubai, with straight advice on location, building quality, running costs and the practical steps of buying.</p><Link className="button button-gold" href="/properties?purpose=Buy">EXPLORE BUY LISTINGS ↗</Link><ComingSoonListings items={COMING_SOON.buy}/>
<SeoGuide id="buying-in-dubai" title="Buying a property in Dubai" intro="Choosing a Dubai property starts with how you plan to use it: a primary home, a second residence or a long-term investment. Compare communities, commute times, layouts and total ownership costs before narrowing your shortlist." items={[
 {title:'Define your requirements',copy:'Share your preferred area, budget, property type and timeline so we can focus on suitable options.'},
 {title:'Review the property details',copy:'Check documentation, building condition, service charges, amenities and any developer or handover information.'},
 {title:'Understand the process',copy:'Discuss viewings, how to make an offer and the steps required before committing to a purchase.'},
]} cta={{lead:'Interested in off-plan instead?',href:'/off-plan',label:'Read our off-plan buying guide'}}/>
</div></main>}
