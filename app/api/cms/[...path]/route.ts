import {NextRequest,NextResponse} from 'next/server';
export const runtime='nodejs';
type Ctx={params:Promise<{path:string[]}>};
async function forward(req:NextRequest,ctx:Ctx){
 const {path}=await ctx.params;
 const admin=path[0]==='admin';
 const key=admin?(path[1]||''):(path[1]||'');
 if (!/^[a-z0-9][a-z0-9_-]{0,79}$/.test(key) && !(admin&&path.length===2&&path[1]==='pages')) return NextResponse.json({error:'Not found'},{status:404});
 const allowed=(admin && ((path.length===2&&path[1]==='pages'&&req.method==='GET')||(path[1]==='pages'&&path.length===3&&req.method==='GET')||(path[1]==='pages'&&path.length===4&&((path[3]==='draft'&&req.method==='PUT')||(path[3]==='publish'&&req.method==='POST')))) || (!admin && path.length===2&&path[0]==='pages'&&req.method==='GET');
 if(!allowed)return NextResponse.json({error:'Not found'},{status:404});
 if(!['GET','HEAD'].includes(req.method)){
   const origin=req.headers.get('origin');
   if(req.headers.get('sec-fetch-site')==='cross-site'||(origin&&origin!==new URL(req.url).origin))return NextResponse.json({error:'Cross-origin request blocked'},{status:403});
 }
 const base=process.env.BACKEND_INTERNAL_URL;
 if(!base)return NextResponse.json({error:'CMS backend not configured'},{status:503});
 const dest=admin?('/api/v1/cms/admin/'+path.slice(1).join('/')):('/api/v1/cms/public/'+path.join('/'));
 try{
   const response=await fetch(base+dest,{method:req.method,headers:{'Cookie':req.headers.get('cookie')||'','Content-Type':'application/json'},body:req.method==='PUT'||req.method==='POST'?await req.text():undefined,cache:'no-store',signal:AbortSignal.timeout(10000)});
   return new NextResponse(await response.text(),{status:response.status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'CMS backend unavailable'},{status:503});}
}
export async function GET(r:NextRequest,c:Ctx){return forward(r,c)}
export async function PUT(r:NextRequest,c:Ctx){return forward(r,c)}
export async function POST(r:NextRequest,c:Ctx){return forward(r,c)}
