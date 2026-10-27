import {NextRequest, NextResponse} from 'next/server';
import {isSameOrigin} from '@/lib/same-origin';
import {relayHeaders} from '@/lib/backend-relay';
export const runtime='nodejs';
type Ctx={params:Promise<{path:string[]}>};
async function forward(req:NextRequest,ctx:Ctx){
 const {path}=await ctx.params;
 if(!['GET','HEAD'].includes(req.method)){
  if(!isSameOrigin(req))return NextResponse.json({error:'Cross-origin request blocked'},{status:403});
 }
 // Signed-out probe for public pages (e.g. the inline CMS editor): answers 200 with
 // staff:null instead of a 401 so visitors' consoles stay clean. /me is unchanged.
 if(path.length===1&&path[0]==='session'&&req.method==='GET')return sessionProbe(req);
 const uuid=/^[a-f0-9-]{36}$/i;
 const allowed=(path.length===1&&['login','logout','me','properties','leads','visits'].includes(path[0])) ||
 (path[0]==='properties'&&path.length>=2&&uuid.test(path[1])&&(
 path.length===2||(path.length===3&&['status','media','documents'].includes(path[2]))||
 (path.length===5&&path[2]==='media'&&uuid.test(path[3])&&['cover','order'].includes(path[4]))||
 (path.length===4&&path[2]==='media'&&uuid.test(path[3])))) ||
 (['leads','visits'].includes(path[0])&&path.length===3&&uuid.test(path[1])&&path[2]==='status') ||
 (path[0]==='documents'&&path.length===3&&uuid.test(path[1])&&path[2]==='download');
 if(!allowed)return NextResponse.json({error:'Not found'},{status:404});
 const base=process.env.BACKEND_INTERNAL_URL;
 if(!base)return NextResponse.json({error:'Backend not configured'},{status:503});
 const target=['login','logout','me'].includes(path[0])?`/api/v1/staff/${path.join('/')}`:`/api/v1/admin/${path.join('/')}`;
 try{
  const multipart=req.headers.get('content-type')?.startsWith('multipart/form-data');const headers:Record<string,string>={Cookie:req.headers.get('cookie')||'',...relayHeaders(req)};if(multipart)headers['Content-Type']=req.headers.get('content-type')||'';else headers['Content-Type']='application/json';const response=await fetch(`${base}${target}`,{method:req.method,headers,body:['POST','PUT','PATCH'].includes(req.method)?(multipart?await req.arrayBuffer():await req.text()):undefined,cache:'no-store',signal:AbortSignal.timeout(20000)});
  const binary=path[0]==='documents'&&path[2]==='download';const out=new NextResponse(binary?await response.arrayBuffer():await response.text(),{status:response.status,headers:{'Content-Type':binary?(response.headers.get('content-type')||'application/octet-stream'):'application/json','Cache-Control':'no-store',...(binary?{'Content-Disposition':response.headers.get('content-disposition')||'attachment'}:{})}});
  const cookie=response.headers.get('set-cookie');if(cookie){const value=cookie.match(/automan_staff=([^;]*)/)?.[1]||'';out.cookies.set('automan_staff',value,{httpOnly:true,sameSite:'strict',secure:process.env.NODE_ENV==='production',path:'/',maxAge:path[0]==='logout'?0:43200});}
  return out;
 }catch{return NextResponse.json({error:'Backend unavailable'},{status:503})}
}
async function sessionProbe(req:NextRequest){
 const signedOut=()=>NextResponse.json({staff:null},{headers:{'Cache-Control':'no-store'}});
 const base=process.env.BACKEND_INTERNAL_URL;
 if(!base||!req.cookies.get('automan_staff')?.value)return signedOut();
 try{
  const response=await fetch(`${base}/api/v1/staff/me`,{headers:{Cookie:req.headers.get('cookie')||''},cache:'no-store',signal:AbortSignal.timeout(8000)});
  if(!response.ok)return signedOut();
  return NextResponse.json(await response.json(),{headers:{'Cache-Control':'no-store'}});
 }catch{return signedOut()}
}
export async function GET(r:NextRequest,c:Ctx){return forward(r,c)}
export async function POST(r:NextRequest,c:Ctx){return forward(r,c)}
export async function PUT(r:NextRequest,c:Ctx){return forward(r,c)}
export async function PATCH(r:NextRequest,c:Ctx){return forward(r,c)}
export async function DELETE(r:NextRequest,c:Ctx){return forward(r,c)}
