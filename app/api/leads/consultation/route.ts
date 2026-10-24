import {NextRequest,NextResponse} from 'next/server';
import {validateLead,type CleanLead} from '@/lib/consultation-lead';
export const runtime='nodejs';
export const dynamic='force-dynamic';

/*
 Consultation popup lead endpoint.
 Storage (at least one must confirm, otherwise the visitor sees an error):
  - Netlify Forms "consultation" (default on Netlify; set LEAD_NETLIFY_FORMS=off to disable)
  - Existing Go CRM when BACKEND_INTERNAL_URL is set (POST /api/v1/leads)
 Notification (optional, server-side only):
  - Resend email when RESEND_API_KEY, LEAD_NOTIFY_TO and LEAD_NOTIFY_FROM are set
 No personal data is ever logged.
*/

const WINDOW_MS=10*60*1000,MAX_PER_WINDOW=5,MIN_FILL_MS=1500;
const hits=new Map<string,number[]>(); // best-effort, per warm function instance

function json(body:object,status:number,extra?:HeadersInit){return NextResponse.json(body,{status,headers:{'Cache-Control':'no-store',...extra}})}
function clientIp(req:NextRequest){return req.headers.get('x-nf-client-connection-ip')||req.headers.get('x-forwarded-for')?.split(',')[0].trim()||'unknown'}
function rateLimited(ip:string){
 const now=Date.now(),recent=(hits.get(ip)||[]).filter(t=>now-t<WINDOW_MS);
 recent.push(now);hits.set(ip,recent);
 if(hits.size>5000)for(const [k,v] of hits)if(!v.some(t=>now-t<WINDOW_MS))hits.delete(k);
 return recent.length>MAX_PER_WINDOW;
}
function sameOrigin(req:NextRequest){
 if(req.headers.get('sec-fetch-site')==='cross-site')return false;
 const origin=req.headers.get('origin');
 return !origin||origin===new URL(req.url).origin;
}
function cleanSource(raw:unknown,siteOrigin:string){
 try{const u=new URL(String(raw));if(u.origin!==siteOrigin)return siteOrigin+'/';u.hash='';return u.toString().slice(0,500)}catch{return siteOrigin+'/'}
}
function escapeHtml(s:string){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!))}

type Lead=CleanLead&{submittedAt:string;sourceUrl:string};

async function toNetlifyForms(lead:Lead,siteOrigin:string){
 if(process.env.LEAD_NETLIFY_FORMS==='off')return null;
 const onNetlify=Boolean(process.env.NETLIFY||process.env.SITE_ID||process.env.DEPLOY_URL||process.env.URL);
 if(!onNetlify&&!process.env.LEAD_FORMS_ORIGIN)return null;
 const base=process.env.LEAD_FORMS_ORIGIN||process.env.DEPLOY_URL||siteOrigin;
 const body=new URLSearchParams({'form-name':'consultation',name:lead.name,email:lead.email,phone:lead.phoneE164,country:lead.country,interest:lead.interest,submitted_at:lead.submittedAt,source_url:lead.sourceUrl,consent:'yes'});
 const r=await fetch(base.replace(/\/$/,'')+'/__forms.html',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body,redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(8000)});
 if(r.status>=200&&r.status<400)return true;
 throw new Error('netlify-forms status '+r.status);
}

async function toCrm(lead:Lead){
 const base=process.env.BACKEND_INTERNAL_URL;
 if(!base)return null;
 const r=await fetch(`${base}/api/v1/leads`,{method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',signal:AbortSignal.timeout(8000),
  body:JSON.stringify({name:lead.name,email:lead.email,phone:lead.phoneE164,property:'Consultation popup',message:`Interested in: ${lead.interest}\nSource page: ${lead.sourceUrl}\nSubmitted: ${lead.submittedAt}`.slice(0,3000)})});
 if(r.ok)return true;
 throw new Error('crm status '+r.status);
}

async function sendEmail(lead:Lead){
 const key=process.env.RESEND_API_KEY,to=process.env.LEAD_NOTIFY_TO,from=process.env.LEAD_NOTIFY_FROM;
 if(!key||!to||!from)return null;
 const rows:[string,string][]=[['Name',lead.name],['Email',lead.email],['Phone',lead.phoneE164],['Interested in',lead.interest],['Submitted (UTC)',lead.submittedAt],['Source page',lead.sourceUrl]];
 const html=`<h2 style="font-family:Georgia,serif">New private consultation request</h2><table cellpadding="6" style="font-family:Arial,sans-serif;font-size:14px">${rows.map(([k,v])=>`<tr><td style="color:#777">${k}</td><td><b>${escapeHtml(v)}</b></td></tr>`).join('')}</table>`;
 const text=rows.map(([k,v])=>`${k}: ${v}`).join('\n');
 const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},cache:'no-store',signal:AbortSignal.timeout(8000),
  body:JSON.stringify({from,to:to.split(',').map(s=>s.trim()).filter(Boolean),reply_to:lead.email,subject:`New consultation request — ${lead.interest}`,html,text})});
 if(r.ok)return true;
 throw new Error('email status '+r.status);
}

export async function POST(req:NextRequest){
 if(!sameOrigin(req))return json({error:'Request blocked.'},403);
 if(!req.headers.get('content-type')?.includes('application/json'))return json({error:'Unsupported request.'},415);
 let data:Record<string,unknown>;
 try{const raw=await req.text();if(raw.length>4096)return json({error:'Request too large.'},413);data=JSON.parse(raw);if(!data||typeof data!=='object'||Array.isArray(data))throw 0}catch{return json({error:'Invalid request.'},400)}

 // Spam protection: hidden honeypot + minimum time-to-fill. Bots get a neutral response and nothing is stored.
 if(typeof data.company==='string'&&data.company.trim())return json({ok:true},200);
 if(typeof data.elapsedMs!=='number'||data.elapsedMs<MIN_FILL_MS)return json({error:'Please take a moment to review your details and submit again.'},422);

 if(rateLimited(clientIp(req)))return json({error:'Too many requests. Please try again in a few minutes.'},429,{'Retry-After':'600'});

 const result=validateLead({name:data.name as string,email:data.email as string,country:data.country as string,phone:data.phone as string,interest:data.interest as string,consent:data.consent as boolean});
 if(!result.ok)return json({error:'Please correct the highlighted fields.',fields:result.errors},422);

 const siteOrigin=new URL(req.url).origin;
 const lead:Lead={...result.lead,submittedAt:new Date().toISOString(),sourceUrl:cleanSource(data.sourceUrl,siteOrigin)};

 const [forms,crm]=await Promise.allSettled([toNetlifyForms(lead,siteOrigin),toCrm(lead)]);
 const stored:string[]=[];
 if(forms.status==='fulfilled'&&forms.value)stored.push('netlify-forms');else if(forms.status==='rejected')console.error('[consultation] storage failed:',(forms.reason as Error).message);
 if(crm.status==='fulfilled'&&crm.value)stored.push('crm');else if(crm.status==='rejected')console.error('[consultation] storage failed:',(crm.reason as Error).message);
 if(!stored.length){
  const configured=!(forms.status==='fulfilled'&&forms.value===null&&crm.status==='fulfilled'&&crm.value===null);
  if(!configured)console.error('[consultation] no lead storage configured');
  return json({error:'We could not submit your request right now. Please try again shortly or email saud@automanstarrealty.com.'},503);
 }

 let notified=false;
 try{notified=Boolean(await sendEmail(lead))}catch(e){console.error('[consultation] notification failed:',(e as Error).message)}
 return json({ok:true,stored,notified},201);
}
