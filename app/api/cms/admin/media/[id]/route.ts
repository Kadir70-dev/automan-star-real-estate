import {NextRequest,NextResponse} from 'next/server';
export const runtime='nodejs';
type Ctx={params:Promise<{id:string}>};
export async function PATCH(req:NextRequest,ctx:Ctx){
 const {id}=await ctx.params;
 if(!/^[\da-f]{8}(-[\da-f]{4}){3}-[\da-f]{12}$/i.test(id))return NextResponse.json({error:'Invalid media ID'},{status:400});
 const origin=req.headers.get('origin');
 if(req.headers.get('sec-fetch-site')==='cross-site'||(origin&&origin!==new URL(req.url).origin))
  return NextResponse.json({error:'Cross-origin request blocked'},{status:403});
 const base=process.env.BACKEND_INTERNAL_URL;
 if(!base)return NextResponse.json({error:'CMS backend not configured'},{status:503});
 try{
  const body=await req.text();
  if(body.length>2048)return NextResponse.json({error:'Request too large'},{status:413});
  const response=await fetch(base+'/api/v1/cms/admin/media/'+id,{method:'PATCH',headers:{'Content-Type':'application/json',Cookie:req.headers.get('cookie')||''},body,cache:'no-store',signal:AbortSignal.timeout(12000)});
  return new NextResponse(await response.text(),{status:response.status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'CMS media service unavailable'},{status:503})}
}
