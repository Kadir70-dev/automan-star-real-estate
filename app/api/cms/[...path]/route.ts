import {NextRequest,NextResponse} from 'next/server';
export const runtime='nodejs';
type Ctx={params:Promise<{path:string[]}>};
const keyPattern=/^[a-z0-9][a-z0-9_-]{0,79}$/;
const idPattern=/^[a-f0-9-]{36}$/i;
async function forward(req:NextRequest,ctx:Ctx){
 const {path}=await ctx.params, admin=path[0]==='admin';
 const method=req.method;
 const isAdminPages=admin&&path[1]==='pages'&&(
  (path.length===2&&method==='GET')||
  (path.length===3&&keyPattern.test(path[2])&&method==='GET')||
  (path.length===4&&keyPattern.test(path[2])&&((path[3]==='draft'&&method==='PUT')||(path[3]==='publish'&&method==='POST')))
 );
 const isAdminMedia=admin&&path[1]==='media'&&(
  (path.length===2&&['GET','POST'].includes(method))||
  (path.length===4&&idPattern.test(path[2])&&path[3]==='alt'&&method==='PATCH')
 );
 const isPublic=!admin&&method==='GET'&&path.length===2&&(
  (path[0]==='pages'&&keyPattern.test(path[1]))||
  (path[0]==='media'&&idPattern.test(path[1]))
 );
 if(!(isAdminPages||isAdminMedia||isPublic))return NextResponse.json({error:'Not found'},{status:404});
 if(!['GET','HEAD'].includes(method)){
  const origin=req.headers.get('origin');
  if(req.headers.get('sec-fetch-site')==='cross-site'||(origin&&origin!==new URL(req.url).origin))return NextResponse.json({error:'Cross-origin request blocked'},{status:403});
 }
 const base=process.env.BACKEND_INTERNAL_URL;
 if(!base)return NextResponse.json({error:'CMS backend not configured'},{status:503});
 const dest=admin?('/api/v1/cms/admin/'+path.slice(1).join('/')):('/api/v1/cms/public/'+path.join('/'));
 try {
  const multipart=req.headers.get('content-type')?.startsWith('multipart/form-data')&&isAdminMedia&&method==='POST';
  const headers:Record<string,string>={Cookie:req.headers.get('cookie')||''};
  if(multipart)headers['Content-Type']=req.headers.get('content-type')||'';
  else if(method!=='GET')headers['Content-Type']='application/json';
  const body=['POST','PUT','PATCH'].includes(method)?(multipart?await req.arrayBuffer():await req.text()):undefined;
  const response=await fetch(base+dest,{method,headers,body,cache:'no-store',signal:AbortSignal.timeout(30000)});
  if(isPublic&&path[0]==='media'){
   return new NextResponse(await response.arrayBuffer(),{status:response.status,headers:{'Content-Type':response.headers.get('content-type')||'application/octet-stream','Cache-Control':'public, max-age=300','X-Content-Type-Options':'nosniff'}});
  }
  return new NextResponse(await response.text(),{status:response.status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'CMS backend unavailable'},{status:503});}
}
export async function GET(r:NextRequest,c:Ctx){return forward(r,c)}
export async function PUT(r:NextRequest,c:Ctx){return forward(r,c)}
export async function POST(r:NextRequest,c:Ctx){return forward(r,c)}
export async function PATCH(r:NextRequest,c:Ctx){return forward(r,c)}
