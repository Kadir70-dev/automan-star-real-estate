import {NextRequest,NextResponse} from 'next/server';
import {isSameOrigin} from '@/lib/same-origin';
export const runtime='nodejs';
type Ctx={params:Promise<{path:string[]}>};
const slugOK=/^(home|about|contact|buy|off-plan|commercial|properties|experience|privacy|site)$/;
async function proxy(request:NextRequest,context:Ctx){
 const {path}=await context.params;
 let route:string|null=null;
 if(path.length===2&&path[0]==='public'&&slugOK.test(path[1])&&request.method==='GET'){
  route='/api/v1/cms/public/'+path[1];
 }else if(path[0]==='admin'&&path.length>=2&&slugOK.test(path[1])){
  const suffix=path.length===3?path[2]:'';
  const allowed=(path.length===2&&request.method==='GET')||
   (path.length===3&&((suffix==='draft'&&request.method==='PUT')||(suffix==='publish'&&request.method==='POST')||(suffix==='versions'&&request.method==='GET')||(suffix==='rollback'&&request.method==='POST')));
  if(allowed)route='/api/v1/cms/admin/pages/'+path[1]+(suffix?'/'+suffix:'');
 }
 if(!route)return NextResponse.json({error:'Not found'},{status:404});
 if(!['GET','HEAD'].includes(request.method)){
  if(!isSameOrigin(request))
   return NextResponse.json({error:'Cross-origin request blocked'},{status:403});
 }
 const base=process.env.BACKEND_INTERNAL_URL;
 if(!base)return NextResponse.json({error:'CMS backend not configured'},{status:503});
 try{
  const response=await fetch(base+route,{method:request.method,headers:{'Content-Type':'application/json',Cookie:request.headers.get('cookie')||''},
   body:['POST','PUT'].includes(request.method)?await request.text():undefined,cache:'no-store',signal:AbortSignal.timeout(12000)});
  return new NextResponse(await response.text(),{status:response.status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'CMS API temporarily unavailable'},{status:503})}
}
export async function GET(r:NextRequest,c:Ctx){return proxy(r,c)}
export async function PUT(r:NextRequest,c:Ctx){return proxy(r,c)}
export async function POST(r:NextRequest,c:Ctx){return proxy(r,c)}
