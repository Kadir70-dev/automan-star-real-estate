'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
type Staff={id:string;name:string;role:string};
type Counts={properties:number;leads:number;visits:number};
const pages:[string,string,string][]=[
 ['/dashboard/properties','Property manager','Create, publish and archive verified property listings'],
 ['/dashboard/leads','Enquiries','Review and update real customer enquiries'],
 ['/dashboard/visits','Viewing requests','Review viewing requests and appointment status'],
 ['/admin','Content Studio','Update website pages, media and SEO (admin only)']
];
export default function StaffDashboard({mode='overview'}:{mode?:'overview'|'settings'|'documents'}){
 const[staff,setStaff]=useState<Staff|null>(null);
 const[counts,setCounts]=useState<Counts|null>(null);
 const[error,setError]=useState('');
 const[loading,setLoading]=useState(true);
 useEffect(()=>{
  let active=true;
  (async()=>{
   try{
    const me=await fetch('/api/staff/me',{cache:'no-store'});
    if(!me.ok)throw Error('Sign in to view your team workspace.');
    const payload=await me.json() as {staff:Staff};
    if(!active)return;
    setStaff(payload.staff);
    if(mode!=='overview')return;
    const [p,l,v]=await Promise.all(['properties','leads','visits'].map(async name=>{
     const response=await fetch('/api/staff/'+name,{cache:'no-store'});
     if(!response.ok)throw Error('Unable to load live dashboard metrics.');
     const result=await response.json() as {data?:unknown[]};
     return result.data?.length??0;
    }));
    if(active)setCounts({properties:p,leads:l,visits:v});
   }catch(e){if(active)setError(e instanceof Error?e.message:'Dashboard unavailable')}
   finally{if(active)setLoading(false)}
  })();
  return()=>{active=false};
 },[mode]);
 return <main className="p1-admin" style={{minHeight:'100vh'}}>
 <aside className="p1-sidebar"><p className="p1-kicker">AUTOMAN STAR / TEAM</p><h2>Control centre<span>.</span></h2>
 <nav aria-label="Staff workspace">
 <Link href="/dashboard">Overview</Link><Link href="/dashboard/properties">Properties</Link><Link href="/dashboard/leads">Enquiries</Link>
 <Link href="/dashboard/visits">Viewings</Link><Link href="/dashboard/documents">Documents</Link><Link href="/dashboard/settings">Settings</Link>
 </nav><Link href="/" style={{color:'inherit'}}>Return to website</Link>
 </aside>
 <section className="p1-admin-main" style={{padding:'min(6vw,60px)',width:'100%'}}>
 <p className="p1-kicker">STAFF-ONLY / POSTGRESQL</p>
 <h1>{mode==='overview'?'Team overview':mode==='documents'?'Private documents':'Workspace settings'}</h1>
 {loading&&<p>Checking staff access…</p>}
 {error&&<p role="alert">{error} <Link href="/dashboard/properties">Staff sign-in</Link></p>}
 {staff&&<><p>Signed in as {staff.name} ({staff.role}). This dashboard never displays sample leads or demo KPIs.</p>
 {mode==='overview'&&<>
 {counts?<div className="p1-stat-grid">
 <div className="p1-panel"><h2>{counts.properties}</h2><p>Property records</p></div>
 <div className="p1-panel"><h2>{counts.leads}</h2><p>Real enquiries</p></div>
 <div className="p1-panel"><h2>{counts.visits}</h2><p>Viewing requests</p></div>
 </div>:!error&&<p>Loading live counts from PostgreSQL…</p>}
 <div className="p1-stat-grid">{pages.filter(p=>p[0]!=='/admin'||staff.role==='admin').map(([href,title,copy])=><div className="p1-panel" key={href}><h2>{title}</h2><p>{copy}</p><Link href={href}>Open {title} →</Link></div>)}</div>
 </>}
 {mode==='documents'&&<div className="p1-panel"><h2>Property documents</h2><p>Private documents are managed against real property records. Staff permissions are checked before every upload and download.</p><Link href="/dashboard/properties">Manage property documents →</Link></div>}
 {mode==='settings'&&<div className="p1-panel"><h2>Settings and permissions</h2><p>Website content, contact details, navigation and SEO can only be changed by administrators. Staff roles and credentials are managed through the authenticated backend, not browser-local demo settings.</p>{staff.role==='admin'&&<Link href="/admin">Open CMS site settings →</Link>}</div>}
 </>}
 </section></main>;
}
