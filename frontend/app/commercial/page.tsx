import Link from 'next/link';export const metadata = {
  title: 'Commercial Property in Dubai',
  description: 'Looking for commercial real estate in Dubai? Discuss offices, retail spaces and investment needs with Automan Star Real Estate in Business Bay.',
  alternates: { canonical: '/commercial' },
  openGraph: { title: 'Commercial Property in Dubai | Automan Star Real Estate', description: 'Enquire about office and retail property opportunities across Dubai.', url: '/commercial' },
};export default function Page(){return <main className="final-collection page-shell"><div className="container"><p className="eyebrow dark-eyebrow">EXPLORE DUBAI & UAE</p><h1 className="display-heading">Commercial <em>real estate.</em></h1><p>Find spaces to support your business ambitions. Verified office and retail inventory will be published here when provided.</p><div className="final-empty-collection"><strong>Curated listings coming soon</strong><p>No verified inventory is available in this category yet. We will never show invented developer payment plans or listings as real.</p><Link href="/contact" className="button button-gold">ENQUIRE WITH OUR TEAM ↗</Link></div></div></main>}
