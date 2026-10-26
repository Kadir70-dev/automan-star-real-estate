import 'server-only';
export type CMSHome={heading?:string;description?:string;primary_button?:{label?:string;href?:string}};
export async function publishedCMS<T extends object>(key:string):Promise<T|null>{
 const base=process.env.BACKEND_INTERNAL_URL;
 if(!base||!/^[a-z0-9][a-z0-9_-]{0,79}$/.test(key))return null;
 try {
   const res=await fetch(`${base}/api/v1/cms/public/pages/${key}`,{next:{revalidate:30},signal:AbortSignal.timeout(3000)});
   if(!res.ok)return null;
   const data=await res.json();
   return data.content && typeof data.content==='object' && !Array.isArray(data.content)?data.content as T:null;
 }catch{return null;}
}
