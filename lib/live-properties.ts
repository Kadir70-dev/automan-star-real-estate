// Listings published from /admin/properties (Go API + PostgreSQL). Server reads
// are uncached so publish/unpublish/delete show on the website immediately.
export type LiveProperty = {
 id:string;slug:string;title:string;emirate:string;community:string;
 listing_type:string;price_aed:string;
 reference_code?:string;category?:string;construction_status?:string;
 bedrooms?:number|null;bathrooms?:number|null;area_sqft?:number|null;
 developer?:string;price_from?:boolean;community_size?:string;
 unit_mix?:string[];highlights?:string[];seo_title?:string;seo_description?:string;
 featured?:boolean;cover_id?:string|null;cover_alt?:string;updated_at?:string;
};
export type LiveMedia={id:string;alt:string;is_cover:boolean};
export type LivePropertyDetail=LiveProperty&{description:string;media:LiveMedia[]};

const base=()=>process.env.BACKEND_INTERNAL_URL||'http://localhost:8080';

export async function getLiveProperties():Promise<{data:LiveProperty[];error?:string}> {
 try {
  const res=await fetch(`${base()}/api/v1/properties`,{cache:'no-store',signal:AbortSignal.timeout(5000)});
  if(!res.ok) throw new Error(`Go API returned ${res.status}`);
  const json=await res.json() as {data?:LiveProperty[]};
  return {data:Array.isArray(json.data)?json.data:[]};
 } catch {return {data:[],error:'Live property service is unavailable. Please try again later.'};}
}

export type DetailResult={status:'ok';p:LivePropertyDetail}|{status:'missing'}|{status:'error'};
export async function getLiveProperty(slug:string):Promise<DetailResult>{
 try{
  const res=await fetch(`${base()}/api/v1/properties/${encodeURIComponent(slug)}`,{cache:'no-store',signal:AbortSignal.timeout(5000)});
  if(res.status===404||res.status===400)return {status:'missing'};
  if(!res.ok)return {status:'error'};
  return {status:'ok',p:await res.json() as LivePropertyDetail};
 }catch{return {status:'error'}}
}

export const mediaUrl=(id:string)=>`/api/media/${id}`;
export const isOffPlan=(p:LiveProperty)=>p.construction_status==='off_plan'||p.construction_status==='under_construction';
export const CATEGORY_LABEL:Record<string,string>={apartment:'Apartment',villa:'Villa',townhouse:'Townhouse',penthouse:'Penthouse',office:'Office',retail:'Retail',other:'Property'};
export const STATUS_LABEL:Record<string,string>={ready:'Ready',off_plan:'Off-plan',under_construction:'Under construction'};
export const locationOf=(p:LiveProperty)=>`${p.community}, ${p.emirate}`;
// 2090000 -> "AED 2.09M"; below a million the full figure is shown.
export function compactAed(value:number|string){
 const n=Number(value);
 return n>=1e6?`AED ${Number((n/1e6).toFixed(2))}M`:`AED ${new Intl.NumberFormat('en-AE').format(n)}`;
}
export const priceText=(p:LiveProperty)=>`${p.price_from?'From ':''}${compactAed(p.price_aed)}`;

export type ListingFilter={query?:string;type?:string;purpose?:string;maxPrice?:number};
// Shared by server pages and the /properties catalog so URL filters behave the same.
export function matchListing(p:LiveProperty,f:ListingFilter){
 const hay=`${p.title} ${p.developer||''} ${p.community} ${p.emirate} ${CATEGORY_LABEL[p.category||'']||''} ${(p.unit_mix||[]).join(' ')}`.toLowerCase();
 const words=(v?:string)=>(v||'').toLowerCase().split(/[\s,]+/).filter(Boolean);
 const type=(f.type||'').toLowerCase();
 const typeOk=!type||p.category===type||(p.unit_mix||[]).some(u=>u.toLowerCase().includes(type));
 const purposeOk=!f.purpose||f.purpose==='All'||((f.purpose==='Buy'||f.purpose==='sale')&&p.listing_type==='sale')||(f.purpose==='Off-plan'&&isOffPlan(p));
 return words(f.query).every(w=>hay.includes(w))&&typeOk&&purposeOk&&(!f.maxPrice||Number(p.price_aed)<=f.maxPrice);
}
