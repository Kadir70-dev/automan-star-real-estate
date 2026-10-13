import {getLiveProperties} from '@/lib/live-properties';
import LivePropertyCatalog from '@/components/LivePropertyCatalog';
export const dynamic='force-dynamic';
export const metadata={title:'Available UAE Properties | Automan Star'};
export default async function Properties({searchParams}:{searchParams:Promise<{purpose?:string;location?:string}>}){
 const [{data,error},params]=await Promise.all([getLiveProperties(),searchParams]);
 const initialPurpose=params.purpose==='Buy'?'sale':params.purpose==='Rent'?'rent':'';
 return <main className="page-shell properties-page"><div className="container"><p className="eyebrow dark-eyebrow">THE AUTOMAN COLLECTION / UAE</p><h1 className="display-heading">Explore <em>available properties.</em></h1><p>Listings shown here are sourced from our published property database.</p>{error?<div role="alert" className="live-error">{error}</div>:<LivePropertyCatalog items={data} initialPurpose={initialPurpose} initialQuery={params.location||''}/>}</div></main>;
}
