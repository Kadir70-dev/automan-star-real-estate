'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
type Page={key:string;path:string;title:string;draft_revision:number;published_revision:number|null};
type Detail={key:string;path:string;title:string;draft:Record<string,unknown>;draft_revision:number;published_revision:number|null};
type Staff={id:string;name:string;role:string};
const home={heading:'Buy well in Dubai.',description:'Apartments, villas, off-plan and commercial property, advised from our office in Business Bay.',primary_button:{label:'Browse properties',href:'/properties'}};
async function api(url:string,init?:RequestInit){
 const res=await fetch(url,{cache:'no-store',...init});
 const data=await res.json().catch(()=>({}));
 if(!res.ok)throw new Error(data.error||'Request failed');
 return data;
}
export default function CMSAdmin(){
 const [staff,setStaff]=useState<Staff|null>(null),[email,setEmail]=useState(''),[password,setPassword]=useState('');
 const [pages,setPages]=useState<Page[]>([]),[selected,setSelected]=useState<Detail|null>(null),[raw,setRaw]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 async function refresh(){
  const who=await api('/api/staff/me').catch(()=>null);
  if(!who?.staff){setStaff(null);return;}
  setStaff(who.staff);
  if(who.staff.role==='admin'){const list=await api('/api/cms/admin/pages');setPages(list.data||[]);}
 }
 useEffect(()=>{void refresh().catch(e=>setMessage(String(e)))},[]);
 async function login(e:React.FormEvent){e.preventDefault();setBusy(true);setMessage('');try{await api('/api/staff/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});setPassword('');await refresh();}catch(e){setMessage(String(e))}finally{setBusy(false)}}
 async function load(key:string){
  try{let detail:Detail;
  if(pages.some(p=>p.key===key)){detail=await api('/api/cms/admin/pages/'+key)}
  else {detail={key,path:'/',title:'Homepage',draft:home,draft_revision:0,published_revision:null}}
  setSelected(detail);setRaw(JSON.stringify(detail.draft,null,2));setMessage('');
  }catch(e){setMessage(String(e))}
 }
 async function save(publish:boolean){
  if(!selected)return;
  setBusy(true);setMessage('');
  try{
   const content=JSON.parse(raw);
   if(!content||typeof content!=='object'||Array.isArray(content))throw new Error('Content must be a JSON object');
   const stored=await api('/api/cms/admin/pages/'+selected.key+'/draft',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({path:selected.path,title:selected.title,content,expected_revision:selected.draft_revision})});
   if(publish)await api('/api/cms/admin/pages/'+selected.key+'/publish',{method:'POST'});
   setSelected({...selected,draft:content,draft_revision:stored.draft_revision,published_revision:publish?stored.draft_revision:selected.published_revision});
   await refresh();
   setMessage(publish?'Published. Public site cache refreshes shortly.':'Draft saved; public site unchanged.');
  }catch(e){setMessage(e instanceof Error?e.message:'Save failed')}finally{setBusy(false)}
 }
 const sidebar={background:'#f8f6f0',borderRight:'1px solid #ded9cb',padding:28};
 const button={border:'1px solid #b9a88a',padding:'12px 18px',borderRadius:8,cursor:'pointer',background:'#fff',color:'#203034'};
 const field={width:'100%',padding:12,border:'1px solid #c8c9c6',borderRadius:8,background:'#fff',color:'#203034'};
 if(!staff)return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#f9f8f4',padding:24}}><form onSubmit={login} style={{background:'white',padding:40,borderRadius:16,width:'min(100%,460px)',display:'grid',gap:18,boxShadow:'0 20px 60px #13252b1a'}}><Link href='/'>← Website</Link><h1>Automan Content Studio</h1><p>Administrator sign in</p><input type='email' aria-label='Email' required style={field} value={email} onChange={e=>setEmail(e.target.value)} placeholder='Email'/><input type='password' aria-label='Password' required style={field} value={password} onChange={e=>setPassword(e.target.value)} placeholder='Password'/><button style={button} disabled={busy}>Sign in</button>{message&&<p role='alert'>{message}</p>}</form></main>;
 if(staff.role!=='admin')return <main style={{padding:60}}><h1>Administrator access required</h1><Link href='/'>Return to website</Link></main>;
 return <main style={{minHeight:'100vh',display:'grid',gridTemplateColumns:'minmax(200px,280px) 1fr',color:'#203034',background:'#fff'}}>
  <aside style={sidebar}><Link href='/'>← Public website</Link><h2 style={{marginTop:36}}>Content Studio</h2><p style={{opacity:.65}}>Logged in: {staff.name}</p><nav aria-label='CMS navigation' style={{display:'grid',gap:12,marginTop:30}}>
   <button type='button' onClick={()=>void load('home')} style={{...button,textAlign:'left'}}>Homepage</button>
   {pages.filter(p=>p.key!=='home').map(p=><button type='button' style={{...button,textAlign:'left'}} key={p.key} onClick={()=>void load(p.key)}>{p.title||p.path}</button>)}
   <Link href='/dashboard/properties'>Property management</Link>
  </nav></aside>
  <section style={{padding:'clamp(22px,4vw,60px)',maxWidth:1100}}>
   <h1>Website content</h1><p style={{opacity:.7}}>Content editor v1 · Existing design preserved · Admin-only</p>
   {!selected?<p>Select Homepage to begin editing its published hero content.</p>:<div style={{display:'grid',gap:18,marginTop:24}}>
    <h2>{selected.title} <small style={{fontWeight:400}}>({selected.path})</small></h2>
    <p>Draft revision {selected.draft_revision} · Published {selected.published_revision??'not yet'}</p>
    <label htmlFor='cms-json'>Content fields (JSON)</label>
    <textarea id='cms-json' spellCheck={false} value={raw} onChange={e=>setRaw(e.target.value)} rows={19} style={{...field,fontFamily:'monospace',lineHeight:1.5}}/>
    <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
     <button type='button' disabled={busy} onClick={()=>void save(false)} style={button}>Save draft</button>
     <button type='button' disabled={busy} onClick={()=>void save(true)} style={{...button,background:'#173b41',color:'white'}}>Save & Publish</button>
     <Link href={selected.path} target='_blank' rel='noopener noreferrer' style={{...button,display:'inline-block'}}>View public page</Link>
    </div>
    {message&&<p role='status'>{message}</p>}
   </div>}
  </section>
 </main>;
}
