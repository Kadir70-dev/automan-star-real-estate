import Link from 'next/link';

type Property = {id:string;slug:string;title:string;emirate:string;community:string;listing_type:string;price_aed:string};
type Payload = {data:Property[];count:number};

export const dynamic = 'force-dynamic';
export default async function LiveProperties(){
  const base = process.env.BACKEND_INTERNAL_URL || 'http://localhost:8080';
  let payload:Payload|null=null;
  let error='';
  try {
    const response=await fetch(`${base}/api/v1/properties`,{cache:'no-store',signal:AbortSignal.timeout(3500)});
    if(!response.ok) throw new Error(`Backend returned ${response.status}`);
    payload=await response.json() as Payload;
  } catch {error='The Go backend is unavailable. Start Docker Compose and try again.';}
  return <main style={{background:'#f7f5f0',minHeight:'80vh',color:'#131313',padding:'140px 6vw 70px'}}>
    <div style={{maxWidth:1100,margin:'0 auto'}}>
      <p style={{fontSize:12,letterSpacing:3,textTransform:'uppercase'}}>Go API × PostgreSQL</p>
      <h1 style={{fontFamily:'Georgia,serif',fontSize:'clamp(38px,6vw,76px)',margin:'16px 0'}}>Live property inventory</h1>
      <p>These listings are read directly from PostgreSQL through the Go backend. The existing property catalog elsewhere remains illustrative demo content.</p>
      {error&&<p role="alert" style={{background:'#fff1e9',padding:20,borderRadius:12,marginTop:30}}>{error}</p>}
      {payload?.count===0&&<p style={{padding:'35px 0'}}>No published listings yet. This is expected for a fresh database.</p>}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:18,marginTop:30}}>
       {payload?.data.map(p=><article key={p.id} style={{padding:25,background:'white',border:'1px solid #ddd8cc',borderRadius:14}}><small>{p.emirate} / {p.community} / {p.listing_type}</small><h2 style={{fontFamily:'Georgia,serif',fontSize:25,margin:'12px 0'}}>{p.title}</h2><strong>AED {Number(p.price_aed).toLocaleString('en-AE')}</strong></article>)}
      </div>
      <p style={{marginTop:38}}><Link href="/properties" style={{textDecoration:'underline'}}>Back to design-demo property listings</Link></p>
    </div>
  </main>;
}
