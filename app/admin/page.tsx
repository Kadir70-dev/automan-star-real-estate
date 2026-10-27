'use client';
import {useCallback,useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import type {CmsDocument} from '@/lib/cms';
import {ALT_FOR,readLiveValues,STUDIO_SECTIONS} from '@/lib/cms-sections';
import SectionCanvas from '@/components/admin/SectionCanvas';
import MediaManager,{type Media} from '@/components/admin/MediaManager';
import './admin.css';

type Staff={id:string;name:string;role:string};
type PageResponse={slug:string;draft:CmsDocument;published:CmsDocument;draft_revision:number;published_revision:number};
type Version={version:number;created_at:string};
const MEDIA='media';
const emptyDoc=():CmsDocument=>({fields:{},seo:{title:'',description:'',og_image:'',canonical:'',robots:''}});
async function readJSON(r:Response){const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||('HTTP '+r.status));return j}
const pages=[...new Map(STUDIO_SECTIONS.map(s=>[s.page,s.pageName])).entries()];

export default function AdminStudio(){
 const[staff,setStaff]=useState<Staff|null>(null),[loaded,setLoaded]=useState(false),[email,setEmail]=useState(''),[password,setPassword]=useState('');
 const[current,setCurrent]=useState(STUDIO_SECTIONS[0].id);
 const[page,setPage]=useState<PageResponse|null>(null),[draft,setDraft]=useState<CmsDocument>(emptyDoc()),[live,setLive]=useState<Record<string,string>>({});
 const[versions,setVersions]=useState<Version[]>([]),[history,setHistory]=useState(false),[picking,setPicking]=useState('');
 const[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 const order=useMemo(()=>[...STUDIO_SECTIONS.map(s=>s.id),MEDIA],[]);
 const index=order.indexOf(current);
 const section=STUDIO_SECTIONS.find(s=>s.id===current);
 const slug=section?.page??page?.slug??'home';
 const dirty=!!page&&JSON.stringify(draft)!==JSON.stringify(page.draft);

 useEffect(()=>{const s=new URLSearchParams(location.search).get('section');if(s&&[...STUDIO_SECTIONS.map(x=>x.id),MEDIA].includes(s))setCurrent(s)},[]);
 useEffect(()=>{let on=true;(async()=>{try{const r=await fetch('/api/staff/session',{cache:'no-store'});if(r.ok&&on)setStaff((await r.json()).staff??null)}catch{}finally{if(on)setLoaded(true)}})();return()=>{on=false}},[]);

 const loadPage=useCallback(async(p:string)=>{
  const path=STUDIO_SECTIONS.find(s=>s.page===p)!.path;
  // Live copy must be in place before the canvas shows, or blank fields could be typed over.
  const livePromise=fetch(path,{cache:'no-store',signal:AbortSignal.timeout(8000)}).then(r=>r.ok?r.text():'').then(html=>html?readLiveValues(html):{}).catch(()=>({}));
  const[result,liveValues,v]=await Promise.all([
   fetch('/api/cms/admin/'+p,{cache:'no-store'}).then(readJSON) as Promise<PageResponse>,
   livePromise,
   fetch('/api/cms/admin/'+p+'/versions',{cache:'no-store'}).catch(()=>null)
  ]);
  setLive(liveValues);setDraft(result.draft);setPage(result);
  setVersions(v?.ok?((await v.json()) as {data:Version[]}).data:[]);
 },[]);
 useEffect(()=>{if(staff?.role!=='admin'||page?.slug===slug)return;setError('');void loadPage(slug).catch(e=>setError(e.message))},[slug,staff?.role,page?.slug,loadPage]);

 function go(id:string){
  const next=STUDIO_SECTIONS.find(s=>s.id===id);
  if(dirty&&next&&next.page!==page?.slug&&!window.confirm('You have unsaved changes on '+section?.pageName+'. Leave without saving?'))return;
  setCurrent(id);setMessage('');setError('');setHistory(false);
  replaceSectionUrl(id);window.scrollTo({top:0,behavior:'smooth'});
 }
 async function login(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');try{
  await readJSON(await fetch('/api/staff/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})}));
  setPassword('');const me=await readJSON(await fetch('/api/staff/me',{cache:'no-store'}));setStaff(me.staff);
 }catch(e){setError(e instanceof Error?e.message:'Login failed')}finally{setBusy(false)}}
 async function logout(){await fetch('/api/staff/logout',{method:'POST'});setStaff(null);setPage(null);setPassword('');setMessage('')}
 const setField=(key:string,value:string)=>setDraft(d=>({...d,fields:{...d.fields,[key]:value}}));
 const setSEO=(key:keyof CmsDocument['seo'],value:string)=>setDraft(d=>({...d,seo:{...d.seo,[key]:value}}));
 function applyImage(url:string,alt?:string){
  if(picking.startsWith('seo:'))setSEO('og_image',url);
  else{const altKey=ALT_FOR[picking];setDraft(d=>({...d,fields:{...d.fields,[picking]:url,...(altKey&&alt?{[altKey]:alt}:{})}}))}
  setMessage('Image changed. Save or publish to keep it.');setPicking('');
 }
 async function saveDraft(){
  const result=await readJSON(await fetch('/api/cms/admin/'+slug+'/draft',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({document:draft,expected_revision:page!.draft_revision})}));
  setPage(p=>p&&({...p,draft,draft_revision:result.draft_revision}));
 }
 async function save(){setBusy(true);setError('');setMessage('');try{await saveDraft();setMessage('Draft saved. The live website is unchanged until you publish.')}catch(e){setError(e instanceof Error?e.message:'Save failed')}finally{setBusy(false)}}
 async function publish(){setBusy(true);setError('');setMessage('');try{
  await saveDraft();
  await readJSON(await fetch('/api/cms/admin/'+slug+'/publish',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}));
  await loadPage(slug);setMessage('Published. The live '+section?.pageName+' page now shows these changes.');
 }catch(e){setError(e instanceof Error?e.message:'Publish failed')}finally{setBusy(false)}}
 async function rollback(version:number){
  if(!window.confirm('Restore published version '+version+' of '+section?.pageName+'? This publishes it live again.'))return;
  setBusy(true);setError('');try{await readJSON(await fetch('/api/cms/admin/'+slug+'/rollback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({version})}));await loadPage(slug);setMessage('Version '+version+' restored and live.')}catch(e){setError(e instanceof Error?e.message:'Rollback failed')}finally{setBusy(false)}}

 if(!loaded)return <main className="studio st-center">Loading...</main>;
 if(!staff)return <main className="studio st-center"><form className="st-login" onSubmit={login}>
  <h1>Admin Login</h1>
  <input type="email" placeholder="Email" aria-label="Email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)}/>
  <input type="password" placeholder="Password" aria-label="Password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/>
  <button disabled={busy}>{busy?'Signing in…':'Login'}</button>
  {error&&<p className="st-error" role="alert">{error}</p>}
  <Link href="/">← Back to website</Link>
 </form></main>;
 if(staff.role!=='admin')return <main className="studio st-center"><div className="st-login"><h1>Access restricted</h1><p className="st-muted">This account cannot edit website content. Leads and properties are in the staff dashboard.</p><Link className="st-pill active" href="/dashboard">Open staff dashboard</Link><button type="button" onClick={logout}>Logout</button></div></main>;

 return <main className="studio">
  <div className="st-wrap">
   <header className="st-top">
    <strong>AUTOMAN STAR <span>· Studio</span></strong>
    <nav><Link href="/" target="_blank">View website ↗</Link><Link href="/dashboard/properties">Properties &amp; CRM ↗</Link><button type="button" className="st-logout" onClick={logout}>Logout</button></nav>
   </header>
   <nav className="st-pills" aria-label="Website pages and sections">
    <div className="st-page-row">
     {pages.map(([p,name])=><button key={p} type="button" className={'st-page'+(section?.page===p?' active':'')} onClick={()=>go(STUDIO_SECTIONS.find(s=>s.page===p)!.id)}>{name}</button>)}
     <button type="button" className={'st-page'+(current===MEDIA?' active':'')} onClick={()=>go(MEDIA)}>Image Uploads &amp; Url</button>
    </div>
    {section&&<div className="st-pill-row">{STUDIO_SECTIONS.filter(s=>s.page===section.page).map(s=><button key={s.id} type="button" className={'st-pill'+(s.id===current?' active':'')} aria-current={s.id===current?'page':undefined} onClick={()=>go(s.id)}>{s.name}</button>)}</div>}
   </nav>
   {error&&<p className="st-error" role="alert">{error}</p>}{message&&<p className="st-note" role="status">{message}</p>}
   <div key={current} className="st-stage">
    {section?(page?.slug===slug?<SectionCanvas section={section} draft={draft} live={live} onField={setField} onSeo={setSEO} onPickImage={setPicking}/>:<p className="st-muted st-loading">Loading {section.pageName}…</p>):<MediaManager/>}
   </div>
   {section&&page?.slug===slug&&<div className="st-savebar">
    <div className="st-status">{dirty?<b>● Unsaved changes</b>:<span>All changes saved</span>}<span>Draft #{page.draft_revision} · Live #{page.published_revision}</span></div>
    <div className="st-save-actions">
     <button type="button" className="st-ghost" onClick={()=>setHistory(h=>!h)}>History</button>
     <Link className="st-ghost" href={section.path} target="_blank">View page ↗</Link>
     <button type="button" className="st-ghost" disabled={busy||!dirty} onClick={save}>Save draft</button>
     <button type="button" className="st-publish" disabled={busy} onClick={publish}>{busy?'Saving…':'Publish live'}</button>
    </div>
    {history&&<ul className="st-history">{versions.length?versions.map(v=><li key={v.version}><span>Version {v.version} · {new Date(v.created_at).toLocaleString()}</span><button type="button" disabled={busy} onClick={()=>rollback(v.version)}>Restore</button></li>):<li>No published versions yet.</li>}</ul>}
   </div>}
   <div className="st-pager">
    <button type="button" disabled={index<=0} onClick={()=>go(order[index-1])}>Previous</button>
    <button type="button" className="next" disabled={index>=order.length-1} onClick={()=>go(order[index+1])}>Next</button>
   </div>
  </div>
  {picking&&<div className="st-modal" role="dialog" aria-modal="true" onClick={e=>{if(e.target===e.currentTarget)setPicking('')}}>
   <MediaManager onPick={(m:Media)=>applyImage(m.url,m.alt_text)} onUrl={url=>applyImage(url)} onClose={()=>setPicking('')}/>
  </div>}
 </main>;
}
function replaceSectionUrl(id:string){try{const u=new URL(location.href);u.searchParams.set('section',id);window.history.replaceState(null,'',u)}catch{}}
