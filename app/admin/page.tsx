'use client';
import {useCallback,useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {CMS_PAGES} from '@/lib/cms-schema';
import type {CmsDocument} from '@/lib/cms';
import './admin.css';

type Staff={id:string;name:string;role:string};
type PageResponse={slug:string;draft:CmsDocument;published:CmsDocument;draft_revision:number;published_revision:number};
type Version={version:number;created_at:string};
type Media={id:string;url:string;filename:string;alt_text:string;bytes:number};
function emptyPage(slug:string):PageResponse{return {slug,draft:{fields:{},seo:{title:'',description:'',og_image:'',canonical:'',robots:''}},published:{fields:{},seo:{title:'',description:'',og_image:'',canonical:'',robots:''}},draft_revision:0,published_revision:0}}
async function readJSON(r:Response){const j=await r.json();if(!r.ok)throw new Error(j.error||('HTTP '+r.status));return j}
export default function AdminStudio(){
 const[staff,setStaff]=useState<Staff|null>(null),[loaded,setLoaded]=useState(false),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[slug,setSlug]=useState('home'),[page,setPage]=useState<PageResponse>(emptyPage('home')),[draft,setDraft]=useState<CmsDocument>(emptyPage('home').draft),[versions,setVersions]=useState<Version[]>([]),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 const[media,setMedia]=useState<Media[]>([]);
 const[activeImageField,setActiveImageField]=useState('');
 const[cropMode,setCropMode]=useState<'original'|'wide'|'square'>('original');
 const[altDrafts,setAltDrafts]=useState<Record<string,string>>({});
 const dirty=JSON.stringify(draft)!==JSON.stringify(page.draft);
 const selected=useMemo(()=>CMS_PAGES.find(p=>p.slug===slug)!,[slug]);
 const loadPage=useCallback(async(p:string)=>{
  const result=await readJSON(await fetch('/api/cms/admin/'+p,{cache:'no-store'})) as PageResponse;
  setPage(result);setDraft(result.draft);setVersions([]);
  const versionsRes=await fetch('/api/cms/admin/'+p+'/versions',{cache:'no-store'});
  if(versionsRes.ok)setVersions(((await versionsRes.json()) as {data:Version[]}).data);
 },[]);
 useEffect(()=>{let active=true;(async()=>{try{const r=await fetch('/api/staff/me',{cache:'no-store'});if(r.ok&&active){const s=(await r.json()).staff as Staff;setStaff(s)}}catch{}finally{if(active)setLoaded(true)}})();return()=>{active=false}},[]);
 useEffect(()=>{if(staff?.role==='admin')void loadMedia()},[staff?.role]);
 useEffect(()=>{if(staff?.role!=='admin')return;setMessage('');setError('');void loadPage(slug).catch(e=>setError(e.message))},[slug,staff?.role,loadPage]);
 async function loadMedia(){const response=await fetch('/api/cms/admin/media',{cache:'no-store'});if(response.ok)setMedia((await response.json()).data||[])}
 async function prepareUpload(file:File):Promise<File>{
  if(cropMode==='original')return file;
  const bitmap=await createImageBitmap(file);
  try{
   const ratio=cropMode==='wide'?16/9:1;
   const width=Math.min(bitmap.width,bitmap.height*ratio),height=width/ratio;
   const left=(bitmap.width-width)/2,top=(bitmap.height-height)/2;
   const canvas=document.createElement('canvas');
   canvas.width=Math.max(1,Math.round(Math.min(width,2400)));
   canvas.height=Math.max(1,Math.round(canvas.width/ratio));
   const ctx=canvas.getContext('2d');
   if(!ctx)throw Error('Image editor unavailable');
   ctx.drawImage(bitmap,left,top,width,height,0,0,canvas.width,canvas.height);
   const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(Error('Image conversion failed')),'image/webp',0.86));
   return new File([blob],file.name.replace(/\.[^.]+$/,'')+'-cropped.webp',{type:'image/webp'});
  }finally{bitmap.close()}
 }
 async function uploadMedia(file:File){setBusy(true);setError('');try{
  const prepared=await prepareUpload(file);
  const form=new FormData();form.append('file',prepared);const response=await fetch('/api/cms/admin/media',{method:'POST',body:form});const data=await readJSON(response);await loadMedia();setMessage('Image uploaded: '+data.url+'. Select a page image field to use it.')}catch(e){setError(e instanceof Error?e.message:'Upload failed')}finally{setBusy(false)}}
 async function saveMediaAlt(id:string){
  setBusy(true);setError('');
  try{
   const alt_text=altDrafts[id]??media.find(m=>m.id===id)?.alt_text??'';
   await readJSON(await fetch('/api/cms/admin/media/'+id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({alt_text})}));
   await loadMedia();setMessage('Image description saved.');
  }catch(e){setError(e instanceof Error?e.message:'Could not save image description')}
  finally{setBusy(false)}
 }
 async function login(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');try{
  await readJSON(await fetch('/api/staff/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})}));
  setPassword('');const me=await readJSON(await fetch('/api/staff/me',{cache:'no-store'}));
  setStaff(me.staff);
 }catch(e){setError(e instanceof Error?e.message:'Login failed')}finally{setBusy(false)}}
 async function logout(){await fetch('/api/staff/logout',{method:'POST'});setStaff(null);setPassword('');setMessage('')}
 function setField(key:string,value:string){setDraft(d=>({...d,fields:{...d.fields,[key]:value}}))}
 function setSEO(key:keyof CmsDocument['seo'],value:string){setDraft(d=>({...d,seo:{...d.seo,[key]:value}}))}
 async function save(){setBusy(true);setError('');setMessage('');try{
  const result=await readJSON(await fetch('/api/cms/admin/'+slug+'/draft',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({document:draft,expected_revision:page.draft_revision})}));
  setPage(p=>({...p,draft, draft_revision:result.draft_revision}));setMessage('Draft saved. Live website is unchanged.');
 }catch(e){setError(e instanceof Error?e.message:'Save failed')}finally{setBusy(false)}}
 async function publish(){setBusy(true);setError('');setMessage('');try{
  // Always persist current form before publishing, avoiding lost edits.
  const saved=await readJSON(await fetch('/api/cms/admin/'+slug+'/draft',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({document:draft,expected_revision:page.draft_revision})}));
  setPage(p=>({...p,draft, draft_revision:saved.draft_revision}));
  await readJSON(await fetch('/api/cms/admin/'+slug+'/publish',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}));
  await loadPage(slug);setMessage('Published successfully. Refresh the public page to view changes.');
 }catch(e){setError(e instanceof Error?e.message:'Publish failed')}finally{setBusy(false)}}
 async function rollback(version:number){
  if(!window.confirm('Restore published version '+version+' for '+slug+'? This will publish a new revision.'))return;
  setBusy(true);setError('');try{await readJSON(await fetch('/api/cms/admin/'+slug+'/rollback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({version})}));await loadPage(slug);setMessage('Published version '+version+' restored.') }catch(e){setError(e instanceof Error?e.message:'Rollback failed')}finally{setBusy(false)}}
 if(!loaded)return <main className="cms-studio"><div className="cms-login"><p>Checking administrator access…</p></div></main>;
 if(!staff)return <main className="cms-studio"><div className="cms-login"><p className="cms-muted">AUTOMAN STAR / CONTENT STUDIO</p><h1>Administrator sign in</h1><p className="cms-muted">Secure access to website content, publishing and SEO.</p><form onSubmit={login}><label>Staff email<input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Password<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="cms-button" disabled={busy}>Sign in</button></form>{error&&<p className="cms-error" role="alert">{error}</p>}<p><Link href="/">← Back to website</Link></p></div></main>;
 if(staff.role!=='admin')return <main className="cms-studio"><div className="cms-login"><h1>Access restricted</h1><p>This account cannot edit website content. An administrator role is required.</p><button className="cms-button secondary" onClick={logout}>Sign out</button></div></main>;
 return <main className="cms-studio"><header className="cms-top"><strong className="cms-brand">AUTOMAN STAR / CONTENT STUDIO</strong><div className="cms-actions"><span className="cms-muted">{staff.name} · Admin</span><Link href="/">Visit website</Link><button className="cms-button secondary" onClick={logout}>Sign out</button></div></header>
 <div className="cms-workspace"><aside className="cms-sidebar"><p>CONTENT MANAGEMENT</p>{CMS_PAGES.map(p=><button key={p.slug} aria-current={slug===p.slug?'page':undefined} onClick={()=>{if(dirty&&!window.confirm('You have unsaved changes. Switch pages anyway?'))return;setSlug(p.slug);setActiveImageField('')}}>{p.name}</button>)}<Link style={{display:'block',padding:15,color:'#dbeddf',fontSize:13}} href="/dashboard/properties">Property manager ↗</Link></aside>
 <section className="cms-main"><p className="cms-muted">PAGE EDITOR / {selected.path}</p><h1>{selected.name}</h1><p className="cms-muted">Edit content and SEO without changing the existing design. Drafts are private until published.</p>
 {error&&<div className="cms-error" role="alert">{error}</div>}{message&&<div className="cms-alert" role="status">{message}</div>}
 <div className="cms-actions" style={{margin:'22px 0'}}>
 <button className="cms-button secondary" disabled={busy} onClick={save}>Save draft</button>
 <button className="cms-button" disabled={busy} onClick={publish}>Publish changes</button>
 {selected.slug!=='site'&&<Link href={selected.path} target="_blank" rel="noopener noreferrer">View public page ↗</Link>}
 {dirty&&<span className="cms-muted" role="status">Unsaved changes</span>}
 <span className="cms-muted">Draft #{page.draft_revision} · Live #{page.published_revision}</span>
 </div>
 <div className="cms-panel"><h2>Page content</h2>
 {selected.fields.length?selected.fields.map(field=><label key={field.key}>{field.label}
 {field.type==='textarea'?<textarea value={draft.fields[field.key]??''} onChange={e=>setField(field.key,e.target.value)} placeholder="Leave blank to use current website copy"/>:<input type="text" value={draft.fields[field.key]??''} onChange={e=>setField(field.key,e.target.value)} onFocus={()=>{if(field.type==='image')setActiveImageField(field.key)}} placeholder={field.type==='image'?'HTTPS image URL or /path':'Leave blank to use current website copy'}/>}
 </label>):<p className="cms-muted">This page currently supports SEO editing. Content fields are being mapped to the preserved website template.</p>}
 </div>
 <div className="cms-panel"><h2>Media Library</h2><p className="cms-muted">Upload JPEG, PNG or WebP (10MB max). Focus an image field above, then choose a library image. Alt text can be edited below.</p>
 <p className="cms-muted" role="status">Selected image field: <strong>{activeImageField||'Click any image field first'}</strong></p>
 <label>Image upload mode<select value={cropMode} onChange={e=>setCropMode(e.target.value as 'original'|'wide'|'square')}>
 <option value="original">Original image (no changes)</option>
 <option value="wide">Center crop 16:9 (max 2400px, WebP)</option>
 <option value="square">Center crop 1:1 (max 2400px, WebP)</option>
 </select></label>
 <label>Upload new image<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={e=>{const file=e.target.files?.[0];if(file)void uploadMedia(file);e.target.value=''}}/></label>
 <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:12}}>{media.map(m=><div key={m.id} style={{border:'1px solid #e5e6e1',padding:10,borderRadius:8}}><img src={m.url} alt={m.alt_text||m.filename} style={{width:'100%',height:105,objectFit:'cover',borderRadius:5}}/><p className="cms-muted" style={{overflowWrap:'anywhere'}}>{m.filename}</p><div className="cms-actions"><button className="cms-button secondary" disabled={!activeImageField||busy} type="button" onClick={()=>{
 const altFields:Record<string,string>={
  'hero.image':'hero.alt1','hero.image2':'hero.alt2','hero.image3':'hero.alt3',
  'services.image':'services.alt','about.image':'about.alt',
  'areas.0.image':'areas.0.alt','areas.1.image':'areas.1.alt','areas.2.image':'areas.2.alt',
  'header.logo':'header.logo_alt'
 };
 const altKey=altFields[activeImageField];
 setDraft(d=>({...d,fields:{...d.fields,[activeImageField]:m.url,...(altKey&&m.alt_text?{[altKey]:m.alt_text}:{})}}));
 setMessage('Image selected for '+activeImageField+'. Publish to make it live.');
}}>Use image</button><button className="cms-button secondary" type="button" onClick={()=>navigator.clipboard.writeText(m.url)}>Copy URL</button></div><label style={{marginTop:12}}>Image description (alt text)<input value={altDrafts[m.id]??m.alt_text} maxLength={300} onChange={e=>setAltDrafts(d=>({...d,[m.id]:e.target.value}))}/></label><button className="cms-button secondary" disabled={busy} onClick={()=>void saveMediaAlt(m.id)}>Save alt text</button></div>)}</div>
 </div>
 <div className="cms-panel"><h2>SEO &amp; metadata</h2>
 <label>SEO title<input maxLength={140} value={draft.seo.title??''} onChange={e=>setSEO('title',e.target.value)}/></label>
 <label>Meta description<textarea maxLength={500} value={draft.seo.description??''} onChange={e=>setSEO('description',e.target.value)}/></label>
 <label>Open Graph image URL<input value={draft.seo.og_image??''} onChange={e=>setSEO('og_image',e.target.value)} placeholder="https://... or /og-image.jpg"/></label>
 <label>Canonical path<input value={draft.seo.canonical??''} onChange={e=>setSEO('canonical',e.target.value)} placeholder="/about"/></label>
 <label>Search index policy<select value={draft.seo.robots||'index'} onChange={e=>setSEO('robots',e.target.value)}><option value="index">Index allowed</option><option value="noindex">No index</option></select></label>
 </div>
 <div className="cms-panel"><h2>Published version history</h2><p className="cms-muted">Rollback republishes a historical snapshot with a new version number.</p><ul className="cms-versions">{versions.map(v=><li key={v.version}><span>Version {v.version} · {new Date(v.created_at).toLocaleString()}</span><button className="cms-button secondary" disabled={busy} onClick={()=>rollback(v.version)}>Restore</button></li>)}</ul>{!versions.length&&<p className="cms-muted">No versions published yet.</p>}</div>
 </section></div></main>
}
