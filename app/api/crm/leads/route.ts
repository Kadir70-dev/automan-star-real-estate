import {NextRequest,NextResponse} from 'next/server';
import {validateEnquiry,type EnquiryLead} from '@/lib/enquiry-lead';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Contacts must be saved successfully to at least one service before the API
// confirms success. Netlify Forms is the production default; the Go CRM is
// optional until the backend is deployed. Notifications are configured in the
// Netlify site's Forms dashboard, not in this endpoint.
type StoredLead = EnquiryLead & { submittedAt:string; sourceUrl:string };

function reply(body:object,status:number){
  return NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}});
}
function sameOrigin(req:NextRequest){
  if(req.headers.get('sec-fetch-site')==='cross-site')return false;
  const origin=req.headers.get('origin');
  return !origin||origin===new URL(req.url).origin;
}
function safeSource(referer:string|null,siteOrigin:string){
  if(!referer)return siteOrigin+'/contact';
  try{
    const url=new URL(referer);
    if(url.origin!==siteOrigin)return siteOrigin+'/contact';
    url.hash='';
    return url.toString().slice(0,500);
  }catch{return siteOrigin+'/contact';}
}

async function storeWithNetlify(lead:StoredLead){
  if(process.env.LEAD_NETLIFY_FORMS==='off')return null;
  const onNetlify=Boolean(process.env.NETLIFY||process.env.SITE_ID||process.env.DEPLOY_URL||process.env.URL);
  if(!onNetlify&&!process.env.LEAD_FORMS_ORIGIN)return null;

  // Prefer the permanent Netlify site URL for production; use the relevant
  // preview URL for draft deploys. Unlike request headers, these are trusted
  // deployment config values.
  const target=process.env.LEAD_FORMS_ORIGIN||
    (process.env.CONTEXT==='production'
      ? (process.env.URL||process.env.DEPLOY_URL)
      : (process.env.DEPLOY_URL||process.env.URL));
  if(!target)return null;
  const url=new URL('/__forms.html',target);
  if(url.protocol!=='https:'&&url.hostname!=='localhost')throw new Error('Unsafe form origin');
  const body=new URLSearchParams({
    'form-name':'enquiry',
    name:lead.name,
    email:lead.email,
    message:lead.message,
    property:lead.property,
    submitted_at:lead.submittedAt,
    source_url:lead.sourceUrl,
    company:'',
  });
  const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body,redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(8000)});
  if(res.status>=200&&res.status<400)return true;
  throw new Error('Netlify form rejected request: '+res.status);
}
async function storeWithCrm(lead:StoredLead){
  const base=process.env.BACKEND_INTERNAL_URL;
  if(!base)return null;
  const res=await fetch(new URL('/api/v1/leads',base),{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    cache:'no-store',
    signal:AbortSignal.timeout(8000),
    body:JSON.stringify({name:lead.name,email:lead.email,message:lead.message,property:lead.property}),
  });
  if(res.ok)return true;
  throw new Error('CRM rejected request: '+res.status);
}
export async function POST(req:NextRequest){
  if(!sameOrigin(req))return reply({error:'Request blocked.'},403);
  if(!req.headers.get('content-type')?.includes('application/json'))return reply({error:'Unsupported request.'},415);
  let raw:unknown;
  try {
    const body=await req.text();
    if(body.length>8192)return reply({error:'Request too large.'},413);
    raw=JSON.parse(body);
  } catch {return reply({error:'Invalid request.'},400);}
  if(typeof raw==='object'&&raw!==null&&!Array.isArray(raw)){
    const company=(raw as Record<string,unknown>).company;
    // Honeypot: silently discard automated submissions.
    if(typeof company==='string'&&company.trim())return reply({ok:true},200);
  }
  const validated=validateEnquiry(raw);
  if(!validated.ok)return reply({error:validated.error},422);
  const origin=new URL(req.url).origin;
  const lead:StoredLead={...validated.lead,submittedAt:new Date().toISOString(),sourceUrl:safeSource(req.headers.get('referer'),origin)};

  const [forms,crm]=await Promise.allSettled([storeWithNetlify(lead),storeWithCrm(lead)]);
  const stored:string[]=[];
  if(forms.status==='fulfilled'&&forms.value===true)stored.push('netlify-forms');
  else if(forms.status==='rejected')console.error('[enquiry] Netlify store failed:',(forms.reason as Error).message);
  if(crm.status==='fulfilled'&&crm.value===true)stored.push('crm');
  else if(crm.status==='rejected')console.error('[enquiry] CRM store failed:',(crm.reason as Error).message);

  if(stored.length===0)return reply({
    error:'We could not save your enquiry right now. Please try again or email saud@automanstarrealty.com.',
  },503);
  return reply({ok:true,stored},201);
}
