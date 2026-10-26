import {NextRequest,NextResponse} from 'next/server';
export const runtime='nodejs';
async function mediaProxy(req:NextRequest){
 const base=process.env.BACKEND_INTERNAL_URL;
 if(!base)return NextResponse.json({error:'CMS backend not configured'},{status:503});
 if(req.method==='POST'){
  const origin=req.headers.get('origin');
  if(req.headers.get('sec-fetch-site')==='cross-site'||(origin&&origin!==new URL(req.url).origin))
   return NextResponse.json({error:'Cross-origin request blocked'},{status:403});
  if(!req.headers.get('content-type')?.startsWith('multipart/form-data'))return NextResponse.json({error:'Expected image upload'},{status:415});
  const size=Number(req.headers.get('content-length')||0);
  if(size>11*1024*1024)return NextResponse.json({error:'Image is too large'},{status:413});
 }
 try{
  const payload=req.method==='POST'?await req.arrayBuffer():undefined;
  if(payload&&payload.byteLength>11*1024*1024)return NextResponse.json({error:'Image is too large'},{status:413});
  const response=await fetch(base+'/api/v1/cms/admin/media',{method:req.method,headers:{Cookie:req.headers.get('cookie')||'',...(req.method==='POST'?{'Content-Type':req.headers.get('content-type')||''}:{})},body:payload,cache:'no-store',signal:AbortSignal.timeout(20000)});
  return new NextResponse(await response.text(),{status:response.status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'CMS media service unavailable'},{status:503})}
}
export async function GET(r:NextRequest){return mediaProxy(r)}
export async function POST(r:NextRequest){return mediaProxy(r)}
