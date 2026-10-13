export type LiveProperty = {
 id:string;slug:string;title:string;emirate:string;community:string;
 listing_type:string;price_aed:string;
};
export async function getLiveProperties():Promise<{data:LiveProperty[];error?:string}> {
 const base=process.env.BACKEND_INTERNAL_URL||'http://localhost:8080';
 try {
  const res=await fetch(`${base}/api/v1/properties`,{cache:'no-store',signal:AbortSignal.timeout(5000)});
  if(!res.ok) throw new Error(`Go API returned ${res.status}`);
  const json=await res.json() as {data?:LiveProperty[]};
  return {data:Array.isArray(json.data)?json.data:[]};
 } catch {return {data:[],error:'Live property service is unavailable. Please try again later.'};}
}
