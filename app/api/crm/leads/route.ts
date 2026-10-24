import {NextRequest,NextResponse} from 'next/server';
import {enquiryFormBody,validateEnquiry} from '@/lib/enquiry-lead';

export const runtime='nodejs';
export const dynamic='force-dynamic';

const WINDOW_MS=10*60*1000;
const MAX_PER_WINDOW=5;
const recentRequests=new Map<string,number[]>(); // best effort per function instance

function response(body:object,status:number,headers?:HeadersInit) {
 return NextResponse.json(body,{status,headers:{'Cache-Control':'no-store',...headers}});
}
function limited(req:NextRequest) {
 const ip=req.headers.get('x-nf-client-connection-ip')||
          req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
 const now=Date.now();
 const events=(recentRequests.get(ip)||[]).filter(t=>now-t<WINDOW_MS);
 events.push(now);
 recentRequests.set(ip,events);
 if(recentRequests.size>5000)for(const [key,values] of recentRequests)if(!values.some(t=>now-t<WINDOW_MS))recentRequests.delete(key);
 return events.length>MAX_PER_WINDOW;
}
function validOrigin(req:NextRequest){
 if(req.headers.get('sec-fetch-site')==='cross-site')return false;
 const origin=req.headers.get('origin');
 return !origin||origin===new URL(req.url).origin;
}
function verifiedSource(raw:unknown,origin:string){
 try{
  const source=new URL(String(raw));
  if(source.origin!==origin)return origin+'/';
  source.hash='';
  return source.toString().slice(0,500);
 }catch{return origin+'/';}
}
function formsBase(origin:string) {
 // On production, never post leads to DEPLOY_URL (which may refer to an old draft deploy).
 const isPreview=['deploy-preview','branch-deploy'].includes(process.env.CONTEXT||'');
 return (process.env.LEAD_FORMS_ORIGIN||
  (isPreview?process.env.DEPLOY_URL:process.env.URL)||origin).replace(/\/$/,'');
}
async function saveToNetlify(body:URLSearchParams,origin:string):Promise<boolean|null> {
 if(process.env.LEAD_NETLIFY_FORMS==='off')return null;
 const deployed=Boolean(process.env.NETLIFY||process.env.SITE_ID||process.env.URL||process.env.DEPLOY_URL||process.env.LEAD_FORMS_ORIGIN);
 if(!deployed)return null;
 const res=await fetch(formsBase(origin)+'/__forms.html',{
  method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
  body:body.toString(),redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(8000),
 });
 if(res.status>=200&&res.status<400)return true;
 throw new Error('Netlify Forms HTTP '+res.status);
}
async function saveToCrm(lead:{name:string;email:string;message:string;property:string}):Promise<boolean|null>{
 if(!process.env.BACKEND_INTERNAL_URL)return null;
 const res=await fetch(process.env.BACKEND_INTERNAL_URL.replace(/\/$/,'')+'/api/v1/leads',{
  method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(lead),
  cache:'no-store',signal:AbortSignal.timeout(8000),
 });
 if(res.ok)return true;
 throw new Error('CRM HTTP '+res.status);
}

export async function POST(req:NextRequest) {
 if(!validOrigin(req))return response({error:'Request blocked.'},403);
 if(!req.headers.get('content-type')?.includes('application/json'))return response({error:'Use a JSON request.'},415);
 let data:Record<string,unknown>;
 try{
  const raw=await req.text();
  if(raw.length>8192)return response({error:'Request too large.'},413);
  data=JSON.parse(raw);
  if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('Invalid data');
 }catch{return response({error:'Invalid request.'},400);}
 // Honeypot: do not store obvious automated submissions.
 if(typeof data.company==='string'&&data.company.trim())return response({ok:true},200);
 if(limited(req))return response({error:'Too many requests. Please try again later.'},429,{'Retry-After':'600'});
 const parsed=validateEnquiry(data);
 if(!parsed.ok)return response({error:'Please check your details.',fields:parsed.errors},422);

 const origin=new URL(req.url).origin;
 const formBody=enquiryFormBody(parsed.lead,verifiedSource(data.sourceUrl,origin),new Date().toISOString());
 const [forms,crm]=await Promise.allSettled([saveToNetlify(formBody,origin),saveToCrm(parsed.lead)]);
 const stored=(forms.status==='fulfilled'&&forms.value===true)||(crm.status==='fulfilled'&&crm.value===true);
 if(!stored){
  // Error details here contain no lead PII.
  if(forms.status==='rejected')console.error('[enquiry] Netlify storage failure:',String(forms.reason));
  if(crm.status==='rejected')console.error('[enquiry] CRM storage failure:',String(crm.reason));
  return response({error:'We could not record your enquiry right now. Please email saud@automanstarrealty.com or try again.'},503);
 }
 if(forms.status==='rejected')console.error('[enquiry] Optional Netlify copy failed.');
 if(crm.status==='rejected')console.error('[enquiry] Optional CRM copy failed.');
 return response({ok:true},201);
}
