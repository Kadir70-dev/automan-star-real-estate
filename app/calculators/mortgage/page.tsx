import Link from 'next/link';
import {Breadcrumbs,SeoGuide} from '@/components/SeoGuide';
import {MortgageCalculator} from '@/components/Calculators';
import {T} from '@/components/Prefs';
import {pageMetadata} from '@/lib/seo';
export const metadata=pageMetadata({path:'/calculators/mortgage',title:'Dubai Mortgage Calculator',description:'Estimate your monthly mortgage payment in Dubai. Typical down payments for UAE residents, nationals and non-residents, with results in AED, USD, INR and more.'});
export default function Page(){return <main className="page-shell calc-page"><Breadcrumbs items={[['Property calculators','/calculators'],['Mortgage calculator','/calculators/mortgage']]}/><div className="container">
 <header className="tool-hero">
  <p className="eyebrow dark-eyebrow"><Link href="/calculators">BUYER TOOLS</Link> / MORTGAGE</p>
  <h1 className="display-heading"><T k="mort.title"/></h1>
  <p className="calc-lede"><T k="mort.lede"/></p>
 </header>
 <MortgageCalculator/>
 <SeoGuide id="mortgage-guide" title="How mortgages work for Dubai property" intro="UAE banks lend against a share of the property value and cap the loan term at 25 years. The down payment you need depends on whether you live in the UAE, your nationality and the property price." items={[
  {title:'Down payment',copy:'UAE resident expats usually need at least 20% for a first home up to AED 5 million and 30% above that. UAE nationals typically need 15% and 25%. Non-residents are assessed bank by bank, commonly at 40% or more.'},
  {title:'Rate and term',copy:'Fixed rates are usually offered for one to five years before moving to a variable rate. A longer term lowers the monthly payment but raises the total interest paid.'},
  {title:'Off-plan purchases',copy:'Most banks lend on off-plan homes only close to handover, so construction-stage instalments are usually paid in cash. Plan for this when you compare payment plans.'},
 ]} cta={{lead:'Want the full cost picture?',href:'/calculators/property-costs',label:'Open the property cost calculator'}}/>
</div></main>}
