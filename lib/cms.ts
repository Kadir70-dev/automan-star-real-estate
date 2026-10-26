import type {Metadata} from 'next';
export type CmsSEO={title:string;description:string;og_image:string;canonical:string;robots:string};
export type CmsDocument={fields:Record<string,string>;seo:CmsSEO};
const emptySEO:CmsSEO={title:'',description:'',og_image:'',canonical:'',robots:''};
export const EMPTY_CMS:CmsDocument={fields:{},seo:emptySEO};
// Server-only CMS read: fails closed to the exact existing hardcoded content.
// No content is fetched from an unconfigured or user-supplied URL.
export async function getCms(slug:string):Promise<CmsDocument>{
 if(!/^(home|about|contact|buy|off-plan|commercial|properties|experience|privacy|site)$/.test(slug))return EMPTY_CMS;
 const base=process.env.BACKEND_INTERNAL_URL;
 if(!base)return EMPTY_CMS;
 try{
  const response=await fetch(base+'/api/v1/cms/public/'+slug,{cache:'no-store',signal:AbortSignal.timeout(4000)});
  if(!response.ok)return EMPTY_CMS;
  const data=await response.json() as {document?:Partial<CmsDocument>};
  const doc=data?.document;
  if(!doc||!doc.fields||typeof doc.fields!=='object')return EMPTY_CMS;
  const fields:Record<string,string>={};
  for(const [key,val] of Object.entries(doc.fields))if(typeof val==='string')fields[key]=val;
  return {fields,seo:{...emptySEO,...(doc.seo||{})}};
 }catch{return EMPTY_CMS}
}
export const cmsText=(doc:CmsDocument,key:string,fallback:string):string=>doc.fields[key]??fallback;
export function cmsMetadata(doc:CmsDocument,defaults:Metadata):Metadata{
 const seo=doc.seo;
 const title=seo.title?.trim();
 const description=seo.description?.trim();
 const og=seo.og_image?.trim();
 const canonical=seo.canonical?.trim();
 return {
  ...defaults,
  ...(title?{title}:{ }),
  ...(description?{description}:{ }),
  ...(canonical&&canonical.startsWith('/')&&!canonical.startsWith('//')?{alternates:{...defaults.alternates,canonical}}:{}),
  ...(seo.robots==='noindex'?{robots:{index:false,follow:false}}:{}),
  openGraph:{...defaults.openGraph,...(title?{title}:{}),...(description?{description}:{}),...(og?{images:[og]}:{})},
  twitter:{...defaults.twitter,...(title?{title}:{}),...(description?{description}:{}),...(og?{images:[og]}:{})},
 };
}
