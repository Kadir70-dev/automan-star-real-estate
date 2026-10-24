import ComingSoonListings from '@/components/ComingSoonListings';import {COMING_SOON} from '@/lib/coming-soon';import Link from 'next/link';
import {Breadcrumbs,SeoGuide} from '@/components/SeoGuide';import {pageMetadata} from '@/lib/seo';
export const metadata=pageMetadata({path:'/commercial',title:'Commercial Property in Dubai',description:'Looking for an office, retail unit or commercial investment in Dubai? Discuss your requirements with Automan Star Real Estate in Business Bay.'});
export default function Page(){return <main className="final-collection page-shell"><Breadcrumbs items={[['Commercial property in Dubai','/commercial']]}/><div className="container"><p className="eyebrow dark-eyebrow">EXPLORE DUBAI & UAE</p><h1 className="display-heading">Commercial property <em>in Dubai.</em></h1><p>Offices and retail space that support how your business works. Verified office and retail inventory will be published here when available.</p><Link href="/contact" className="button button-gold">ENQUIRE WITH OUR TEAM ↗</Link><ComingSoonListings items={COMING_SOON.commercial}/>
<SeoGuide id="commercial-property-dubai" title="Finding the right commercial property in Dubai" intro="The right office or retail premises depends on location, access, layout, permitted activity and ongoing costs, not just the asking price." items={[
 {title:'Office requirements',copy:'Consider floor area, team capacity, transport links, parking and fit-out requirements.'},
 {title:'Retail requirements',copy:'Discuss visibility, footfall, access, loading arrangements and whether your activity is permitted at the premises.'},
 {title:'Commercial due diligence',copy:'Review the exact ownership terms, service charges, building rules and relevant approvals before proceeding.'},
]} cta={{lead:'Tell us your preferred area and business needs.',href:'/contact',label:'Contact Automan Star Real Estate'}}/>
</div></main>}
