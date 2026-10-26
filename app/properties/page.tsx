import {getCms,cmsText,cmsMetadata} from '@/lib/cms';
import {getLiveProperties} from '@/lib/live-properties';
import LivePropertyCatalog from '@/components/LivePropertyCatalog';
import ComingSoonListings from '@/components/ComingSoonListings';
import {COMING_SOON,COMING_SOON_MIXED} from '@/lib/coming-soon';
export const dynamic='force-dynamic';
import {Breadcrumbs} from '@/components/SeoGuide';import {pageMetadata} from '@/lib/seo';
const baseMetadata=pageMetadata({path:'/properties',title:'Dubai Property Listings',description:'Browse Dubai property listings from Automan Star Real Estate. Verified listings are published as they become available; enquire about apartments, villas and investments.'});
export async function generateMetadata(){return cmsMetadata(await getCms('properties'),baseMetadata)}
export default async function Properties({searchParams}:{searchParams:Promise<{purpose?:string;location?:string}>}){
 const [{data,error},params]=await Promise.all([getLiveProperties(),searchParams]);
 const initialPurpose=params.purpose==='Buy'?'sale':'';
 return <main className="page-shell properties-page"><Breadcrumbs items={[['Dubai property listings','/properties']]}/><div className="container"><p className="eyebrow dark-eyebrow">THE AUTOMAN COLLECTION / UAE</p><h1 className="display-heading">Dubai property <em>listings.</em></h1><p>Listings shown here are sourced from our published property database.</p>{error||!data.length?<ComingSoonListings items={initialPurpose==='sale'?COMING_SOON.buy:COMING_SOON_MIXED}/>:<LivePropertyCatalog items={data.filter(p=>p.listing_type!=='rent')} initialPurpose={initialPurpose} initialQuery={params.location||''}/>}</div></main>;
}
