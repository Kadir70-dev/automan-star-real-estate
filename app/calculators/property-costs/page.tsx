import Link from 'next/link';
import {Breadcrumbs,SeoGuide} from '@/components/SeoGuide';
import {CostCalculator} from '@/components/Calculators';
import {T} from '@/components/Prefs';
import {pageMetadata} from '@/lib/seo';
export const metadata=pageMetadata({path:'/calculators/property-costs',title:'Dubai Property Purchase Cost Calculator',description:'Calculate Dubai property buying costs: 4% DLD transfer fee, trustee, agency and mortgage fees, total cash needed and rental yield.'});
export default function Page(){return <main className="page-shell calc-page"><Breadcrumbs items={[['Property calculators','/calculators'],['Property cost calculator','/calculators/property-costs']]}/><div className="container">
 <header className="tool-hero">
  <p className="eyebrow dark-eyebrow"><Link href="/calculators">BUYER TOOLS</Link> / COSTS</p>
  <h1 className="display-heading"><T k="cost.title"/></h1>
  <p className="calc-lede"><T k="cost.lede"/></p>
 </header>
 <CostCalculator/>
 <SeoGuide id="costs-guide" title="What you pay on top of the price" intro="In Dubai the largest buying cost is the Dubai Land Department transfer fee of 4% of the price. Ready homes also carry trustee and agency fees, and a mortgage adds registration and bank charges." items={[
  {title:'Ready homes',copy:'Expect the 4% DLD fee, the DLD admin fee, a registration trustee fee and the agency fee, usually 2% plus VAT.'},
  {title:'Off-plan homes',copy:'Off-plan purchases are registered with the developer through DLD, with the 4% fee and an admin charge. There is normally no agency fee to the buyer when you buy direct from the launch.'},
  {title:'Rental yield',copy:'Gross yield is annual rent divided by the price. Net yield subtracts service charges; also budget for maintenance, vacancy and letting fees.'},
 ]} cta={{lead:'Next, estimate the monthly payment.',href:'/calculators/mortgage',label:'Open the mortgage calculator'}}/>
</div></main>}
