import {NextRequest,NextResponse} from 'next/server';
import {relayHeaders} from '@/lib/backend-relay';
import {isSameOrigin,publicOrigin} from '@/lib/same-origin';
import {sameSiteSource,withSource} from '@/lib/crm-relay';
import {notifyEnquiryWhatsApp} from '@/lib/whatsapp-enquiry';

export const runtime='nodejs';

export async function POST(req:NextRequest){
 if(!isSameOrigin(req))return NextResponse.json({error:'Request blocked.'},{status:403});
 const base=process.env.BACKEND_INTERNAL_URL;
 if(!base)return NextResponse.json({error:'CRM service is not configured'},{status:503});
 let raw:string;
 try{
  raw=await req.text();
  if(raw.length>8192)return NextResponse.json({error:'Request too large'},{status:413});
 }catch{return NextResponse.json({error:'Invalid request'},{status:400})}
 raw=withSource(raw,sameSiteSource(req.headers.get('referer'),publicOrigin(req)));
 try{
  const response=await fetch(`${base}/api/v1/leads`,{
   method:'POST',headers:{'Content-Type':'application/json',...relayHeaders(req)},
   body:raw,cache:'no-store',signal:AbortSignal.timeout(8000),
  });
  const result=await response.text();
  // Notify only after the Go CRM confirms successful storage.
  // Notification errors do not invalidate an already-recorded enquiry.
  if(response.ok){
   try{
    const data=JSON.parse(raw) as Record<string,unknown>;
    await notifyEnquiryWhatsApp({
     name:typeof data.name==='string'?data.name:'',
     email:typeof data.email==='string'?data.email:'',
     phone:typeof data.phone==='string'?data.phone:'',
     topic:typeof data.property==='string'?data.property:'General enquiry',
     note:typeof data.message==='string'?data.message:'New website enquiry',
    });
   }catch{
    console.error('[crm/leads] WhatsApp notification failed');
   }
  }
  return new NextResponse(result,{status:response.status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
 }catch{
  return NextResponse.json({error:'CRM service unavailable. Please try again later.'},{status:503});
 }
}
