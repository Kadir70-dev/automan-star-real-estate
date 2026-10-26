import {getCms,cmsText,cmsMetadata} from '@/lib/cms';
import ComingSoonListings from '@/components/ComingSoonListings';import {COMING_SOON} from '@/lib/coming-soon';import Link from 'next/link';
import {Breadcrumbs,SeoGuide} from '@/components/SeoGuide';import {pageMetadata} from '@/lib/seo';
const baseMetadata=pageMetadata({path:'/off-plan',title:'Dubai Off-Plan Properties',description:'Considering an off-plan property in Dubai? Review developers, payment plans, handover timelines and due diligence with Automan Star Real Estate.'});
export async function generateMetadata(){return cmsMetadata(await getCms('off-plan'),baseMetadata)}
export default async function Page(){const cms=await getCms('off-plan');return <main className="final-collection page-shell"><Breadcrumbs items={[['Dubai off-plan properties','/off-plan']]}/><div className="container"><p className="eyebrow dark-eyebrow">EXPLORE DUBAI & UAE</p><h1 className="display-heading" data-cms-field="page.heading">{cms.fields['page.heading']??<>Dubai off-plan <em>properties.</em></>}</h1><p data-cms-field="page.copy">{cmsText(cms,'page.copy',"Upcoming developments and new launches in Dubai. Developer, handover and payment plan details are published only after verification.")}</p><Link href="/contact" className="button button-gold">ENQUIRE WITH OUR TEAM ↗</Link><ComingSoonListings items={COMING_SOON['off-plan']}/>
<SeoGuide id="off-plan-dubai" title="What to review before buying off-plan in Dubai" intro="Off-plan properties are bought before construction is complete. Make sure the project, completion timeline and financial commitments fit your goals before you make a reservation." items={[
 {title:'Developer and project checks',copy:'Review official developer and project information, including the relevant registrations and the project’s documented status.'},
 {title:'Payment and handover terms',copy:'Understand the booking amount, payment milestones, expected handover and what the agreement says about delays or changes.'},
 {title:'Total cost of ownership',copy:'Ask about applicable fees, service charges, financing eligibility and any restrictions on future use or resale.'},
]} cta={{lead:'Availability and payment plans must be verified for each project.',href:'/contact',label:'Ask our team for current information'}}/>
</div></main>}
