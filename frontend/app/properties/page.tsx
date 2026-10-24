import {getLiveProperties} from '@/lib/live-properties';
import LivePropertyCatalog from '@/components/LivePropertyCatalog';
export const dynamic='force-dynamic';
export const metadata = {
  title: 'Dubai Property Listings',
  description: 'Browse the Automan Star property collection in Dubai. Verified listing details appear when published; enquire about your preferred home or investment.',
  alternates: { canonical: '/properties' },
  openGraph: { title: 'Dubai Property Listings | Automan Star Real Estate', description: 'Discover Dubai property listings and speak directly with our real estate team.', url: '/properties' },
};
export default async function Properties({searchParams}:{searchParams:Promise<{purpose?:string;location?:string}>}){
 const [{data,error},params]=await Promise.all([getLiveProperties(),searchParams]);
 const initialPurpose=params.purpose==='Buy'?'sale':params.purpose==='Rent'?'rent':'';
 return <main className="page-shell properties-page"><div className="container"><p className="eyebrow dark-eyebrow">THE AUTOMAN COLLECTION / UAE</p><h1 className="display-heading">Explore <em>available properties.</em></h1><p>Listings shown here are sourced from our published property database.</p>{error?<div role="alert" className="live-error">{error}</div>:<LivePropertyCatalog items={data} initialPurpose={initialPurpose} initialQuery={params.location||''}/>}</div></main>;
}
