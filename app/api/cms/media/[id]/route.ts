import {NextRequest,NextResponse} from 'next/server';
export const runtime='nodejs';
export async function GET(_r:NextRequest,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 if(!/^[a-f0-9-]{36}$/i.test(id))return new NextResponse(null,{status:404});
 const base=process.env.BACKEND_INTERNAL_URL;
 if(!base)return new NextResponse(null,{status:503});
 try{
  const response=await fetch(base+'/api/v1/cms/public/media/'+id,{signal:AbortSignal.timeout(8000)});
  if(!response.ok)return new NextResponse(null,{status:response.status});
  const mime=response.headers.get('content-type')||'';
  if(!['image/png','image/jpeg','image/webp'].includes(mime))return new NextResponse(null,{status:415});
  return new NextResponse(await response.arrayBuffer(),{status:200,headers:{'Content-Type':mime,'Cache-Control':'public,max-age=300','X-Content-Type-Options':'nosniff'}});
 }catch{return new NextResponse(null,{status:503})}
}
