import Link from 'next/link';
import {ArrowUpRight,Landmark,MapPinned,ReceiptText} from 'lucide-react';
import {Breadcrumbs} from '@/components/SeoGuide';
import {T} from '@/components/Prefs';
import {pageMetadata} from '@/lib/seo';
export const metadata=pageMetadata({path:'/calculators',title:'Dubai Property Calculators',description:'Free Dubai mortgage and property purchase cost calculators: monthly payments, DLD fees, agency fees and rental yield, in AED or your own currency.'});
export default function Page(){return <main className="page-shell calc-page"><Breadcrumbs items={[['Property calculators','/calculators']]}/><div className="container">
 <header className="tool-hero">
 <p className="eyebrow dark-eyebrow">BUYER TOOLS</p>
 <h1 className="display-heading">Plan your purchase <em>with real numbers.</em></h1>
 <p className="calc-lede">Work out a monthly mortgage payment, the fees on top of the price and the rental yield before you start viewing. Switch the currency at the top of the page to see figures in USD, INR, GBP and more.</p>
 </header>
 <div className="calc-cards">
  <Link href="/calculators/mortgage" className="calc-card"><span className="calc-card-icon"><Landmark size={24} aria-hidden="true"/></span><h2><T k="mort.title"/></h2><p>Monthly payment, loan amount and total interest, with typical UAE down payment rules for residents, nationals and non-residents.</p><span className="calc-card-go">Open calculator <ArrowUpRight size={16} aria-hidden="true"/></span></Link>
  <Link href="/calculators/property-costs" className="calc-card"><span className="calc-card-icon"><ReceiptText size={24} aria-hidden="true"/></span><h2><T k="cost.title"/></h2><p>DLD transfer fee, trustee and agency fees, mortgage registration and the cash you need on the day, plus gross and net rental yield.</p><span className="calc-card-go">Open calculator <ArrowUpRight size={16} aria-hidden="true"/></span></Link>
 </div>
 <Link href="/neighbourhoods" className="calc-band"><MapPinned size={26} aria-hidden="true"/><span><b>Still choosing an area?</b> Read our neighbourhood guides to Dubai and Sharjah.</span><ArrowUpRight size={20} aria-hidden="true"/></Link>
</div></main>}
