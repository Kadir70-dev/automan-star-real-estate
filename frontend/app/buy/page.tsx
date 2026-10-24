import Link from 'next/link';export const metadata = {
  title: 'Buy Property in Dubai',
  description: 'Looking to buy an apartment, villa or townhouse in Dubai? Explore buying options and request tailored guidance from Automan Star Real Estate.',
  alternates: { canonical: '/buy' },
  openGraph: { title: 'Buy Property in Dubai | Automan Star Real Estate', description: 'Explore Dubai property purchases with practical guidance from a Business Bay real estate team.', url: '/buy' },
};export default function Page(){return <main className="final-collection page-shell"><div className="container"><p className="eyebrow dark-eyebrow">THE AUTOMAN COLLECTION</p><h1 className="display-heading">Buy <em>exceptionally.</em></h1><p>Discover residences curated for purchase in the UAE.</p><Link className="button button-gold" href="/properties?purpose=Buy">EXPLORE BUY LISTINGS ↗</Link></div></main>}
