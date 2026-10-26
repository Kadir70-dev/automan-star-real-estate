'use client';
import {useEffect,useState} from 'react';
import {usePathname} from 'next/navigation';
import Link from 'next/link';
import {CMS_PAGES} from '@/lib/cms-schema';
import type {CmsDocument} from '@/lib/cms';
type Page={draft:CmsDocument;draft_revision:number};
type Editing={key:string;kind:'text'|'image';value:string;el:HTMLElement};
const barStyle:React.CSSProperties={position:'fixed',bottom:22,right:22,zIndex:2147482000,padding:12,borderRadius:12,background:'#183d33',color:'white',boxShadow:'0 9px 35px #0004',fontFamily:'Arial,sans-serif',display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',maxWidth:'calc(100vw - 24px)'};
const button:React.CSSProperties={padding:'9px 12px',background:'#e9e1ce',color:'#183d33',border:'0',borderRadius:6,cursor:'pointer',fontSize:13};
export default function CmsInlineEditor(){
 const path=usePathname();
 const config=CMS_PAGES.find(p=>p.path===path&&p.slug!=='site');
 const[admin,setAdmin]=useState(false),[enabled,setEnabled]=useState(false),[page,setPage]=useState<Page|null>(null),[doc,setDoc]=useState<CmsDocument|null>(null),[edit,setEdit]=useState<Editing|null>(null),[busy,setBusy]=useState(false),[note,setNote]=useState('');
 useEffect(()=>{let live=true;setAdmin(false);setEnabled(false);setPage(null);setDoc(null);setEdit(null);
  if(!config)return;
  fetch('/api/staff/me',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(j=>{if(live)setAdmin(j?.staff?.role==='admin')}).catch(()=>{});
  return()=>{live=false}
 },[path,config?.slug]);
 useEffect(()=>{
  if(!enabled)return;
  const elements=Array.from(document.querySelectorAll<HTMLElement>('[data-cms-field],[data-cms-image]'));
  const cleanup:((()=>void))[]=[];
  for(const el of elements){
   const oldOutline=el.style.outline,oldCursor=el.style.cursor,oldOffset=el.style.outlineOffset;
   el.style.outline='2px dashed #c79e56';el.style.outlineOffset='4px';el.style.cursor='pointer';
   const click=(event:MouseEvent)=>{
    event.preventDefault();event.stopPropagation();
    const key=el.dataset.cmsField||el.dataset.cmsImage||'';
    const kind=el.dataset.cmsImage?'image':'text';
    const fallback=kind==='image'?(el instanceof HTMLImageElement?el.currentSrc:''):el.textContent||'';
    setEdit({key,kind,value:doc?.fields[key]??fallback,el});
   };
   el.addEventListener('click',click,true);
   cleanup.push(()=>{el.removeEventListener('click',click,true);el.style.outline=oldOutline;el.style.cursor=oldCursor;el.style.outlineOffset=oldOffset});
  }
  return()=>cleanup.forEach(x=>x());
 },[enabled,doc,path]);
 if(!admin||!config)return null;
 async function enter(){
  if(enabled){setEnabled(false);setEdit(null);return}
  setBusy(true);setNote('');
  try{const r=await fetch('/api/cms/admin/'+config!.slug,{cache:'no-store'});if(!r.ok)throw Error('Cannot load CMS draft');const p=await r.json() as Page;setPage(p);setDoc(p.draft);setEnabled(true)}
  catch(e){setNote(e instanceof Error?e.message:'Unable to edit')}
  finally{setBusy(false)}
 }
 function apply(){
  if(!edit||!doc)return;
  const fields={...doc.fields,[edit.key]:edit.value};setDoc({...doc,fields});
  if(edit.kind==='text')edit.el.textContent=edit.value;
  else if(edit.el instanceof HTMLImageElement){edit.el.removeAttribute('srcset');edit.el.src=edit.value}
  setEdit(null);
 }
 async function write(publish:boolean){
  if(!page||!doc||!config)return;
  setBusy(true);setNote('');
  try{
   const response=await fetch('/api/cms/admin/'+config.slug+'/draft',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({document:doc,expected_revision:page.draft_revision})});
   const payload=await response.json();if(!response.ok)throw Error(payload.error||'Draft save failed');
   setPage({...page,draft_revision:payload.draft_revision});
   if(publish){
    const result=await fetch('/api/cms/admin/'+config.slug+'/publish',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
    if(!result.ok)throw Error((await result.json()).error||'Publish failed');
    window.location.reload();return;
   }
   setNote('Private draft saved.');
  }catch(e){setNote(e instanceof Error?e.message:'Save failed')}finally{setBusy(false)}
 }
 return <><div style={barStyle}><span style={{fontSize:12,fontWeight:700,marginRight:6}}>ADMIN · {enabled?'EDIT MODE':'VIEW MODE'}</span>
 <button type="button" style={button} onClick={enter} disabled={busy}>{enabled?'Exit edit':'Edit Page'}</button>
 {enabled&&<><button type="button" style={button} onClick={()=>void write(false)} disabled={busy}>Save draft</button><button type="button" style={{...button,background:'#b3d9c5'}} onClick={()=>void write(true)} disabled={busy}>Publish</button></>}
 <Link style={{color:'#fff',fontSize:12}} href="/admin">Content Studio ↗</Link>
 {note&&<span role="status" style={{width:'100%',fontSize:12}}>{note}</span>}</div>
 {edit&&<div role="dialog" aria-modal="true" aria-label="Edit content" style={{position:'fixed',inset:0,zIndex:2147482001,background:'#0008',display:'grid',placeItems:'center',padding:16,fontFamily:'Arial,sans-serif'}}>
  <div style={{width:'min(560px,100%)',background:'#fff',color:'#183d33',padding:25,borderRadius:14,boxShadow:'0 30px 80px #0005'}}>
   <h2 style={{fontSize:21,margin:'0 0 12px'}}>Edit {edit.key}</h2><p style={{fontSize:13}}>This changes the page draft. Publish to update the live website.</p>
   {edit.kind==='image'?<input aria-label="Image URL" autoFocus value={edit.value} onChange={e=>setEdit({...edit,value:e.target.value})} style={{width:'100%',padding:12}}/>:<textarea aria-label="Content" autoFocus rows={5} value={edit.value} onChange={e=>setEdit({...edit,value:e.target.value})} style={{width:'100%',padding:12}}/>}
   <div style={{display:'flex',gap:8,marginTop:15}}><button style={button} onClick={()=>setEdit(null)}>Cancel</button><button style={{...button,background:'#b3d9c5'}} onClick={apply}>Apply to preview</button></div>
  </div></div>}
 </>;
}
