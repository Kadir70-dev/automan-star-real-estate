'use client';
/* eslint-disable @next/next/no-img-element -- admin thumbnails load private draft photos through the staff media relay */
import {useCallback,useEffect,useMemo,useState} from 'react';
import {Eye,EyeOff,Pencil,Plus,RotateCcw,Search,Trash2,Upload} from 'lucide-react';
import {api,statusLabel,type AdminProperty} from './api';
import {useConfirm} from './ConfirmDialog';

type Tab='all'|'published'|'draft'|'trash';
const aed=(n:number)=>'AED '+new Intl.NumberFormat('en-AE').format(Number(n));

export default function PropertyList({editable,onEdit,onAdd}:{editable:boolean;onEdit:(id:string,step?:number)=>void;onAdd:()=>void}){
 const[items,setItems]=useState<AdminProperty[]>([]),[trash,setTrash]=useState<AdminProperty[]>([]),[loading,setLoading]=useState(true);
 const[tab,setTab]=useState<Tab>('all'),[q,setQ]=useState(''),[busy,setBusy]=useState(''),[message,setMessage]=useState(''),[error,setError]=useState('');
 const confirm=useConfirm();
 const load=useCallback(async()=>{const[a,t]=await Promise.all([api.list(),api.list(true)]);setItems(a);setTrash(t)},[]);
 useEffect(()=>{load().catch(e=>setError(e.message)).finally(()=>setLoading(false))},[load]);

 const counts={all:items.length,published:items.filter(p=>p.publish_status==='published').length,draft:items.filter(p=>p.publish_status!=='published').length,trash:trash.length};
 const shown=useMemo(()=>{
  const base=tab==='trash'?trash:tab==='all'?items:items.filter(p=>tab==='published'?p.publish_status==='published':p.publish_status!=='published');
  const words=q.toLowerCase().split(/\s+/).filter(Boolean);
  return base.filter(p=>{const hay=`${p.title} ${p.community} ${p.emirate} ${p.developer} ${p.reference_code}`.toLowerCase();return words.every(w=>hay.includes(w))});
 },[tab,items,trash,q]);

 async function act(p:AdminProperty,label:string,fn:()=>Promise<unknown>,ok:string){setBusy(p.id);setError('');setMessage('');try{await fn();await load();setMessage(ok)}catch(e){setError(`${label} failed: ${e instanceof Error?e.message:'error'}`)}finally{setBusy('')}}
 const publish=(p:AdminProperty)=>act(p,'Publish',()=>api.setStatus(p.id,'published'),`“${p.title}” is now live on the website.`);
 async function unpublish(p:AdminProperty){if(await confirm({title:`Unpublish “${p.title}”?`,body:'It will be hidden from the website straight away and kept as a draft.',ok:'Unpublish'}))void act(p,'Unpublish',()=>api.setStatus(p.id,'draft'),`“${p.title}” is hidden from the website.`)}
 async function remove(p:AdminProperty){if(await confirm({title:`Move “${p.title}” to trash?`,body:'It disappears from the website. You can restore it from the Trash tab.',ok:'Move to trash',danger:true}))void act(p,'Delete',()=>api.trash(p.id),`“${p.title}” moved to trash.`)}
 const restore=(p:AdminProperty)=>act(p,'Restore',()=>api.restore(p.id),`“${p.title}” restored as a draft. Publish it when ready.`);
 async function erase(p:AdminProperty){if(await confirm({title:`Delete “${p.title}” forever?`,body:'The listing and all its photos are permanently deleted. This cannot be undone.',ok:'Delete forever',danger:true}))void act(p,'Delete',()=>api.erase(p.id),`“${p.title}” permanently deleted.`)}

 return <section aria-labelledby="pm-list-title">
  <div className="pm-list-head">
   <div><h1 id="pm-list-title">Properties</h1><p className="st-muted">Add, edit and publish listings. Changes show on the website immediately.</p></div>
   {editable&&<button type="button" className="pm-btn pm-primary pm-add" onClick={onAdd}><Plus size={18}/> Add property</button>}
  </div>
  <div className="pm-toolbar">
   <div className="pm-tabs" role="tablist" aria-label="Filter by status">{([['all','All'],['published','Live'],['draft','Drafts'],['trash','Trash']] as [Tab,string][]).map(([t,l])=><button key={t} role="tab" type="button" aria-selected={tab===t} className={tab===t?'active':''} onClick={()=>setTab(t)}>{l} <span>{counts[t]}</span></button>)}</div>
   <label className="pm-search"><Search size={16} aria-hidden="true"/><span className="pm-sr">Search properties</span><input type="search" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search title, area, developer, reference"/></label>
  </div>
  {error&&<p className="st-error" role="alert">{error}</p>}{message&&<p className="st-note" role="status">{message}</p>}
  {loading?<p className="st-muted st-loading">Loading properties…</p>:!shown.length?<div className="pm-empty"><p>{q?'No properties match your search.':tab==='trash'?'Trash is empty.':'No properties yet.'}</p>{editable&&!q&&tab!=='trash'&&<button type="button" className="pm-btn pm-primary" onClick={onAdd}><Plus size={16}/> Add your first property</button>}</div>:
  <ul className="pm-items">{shown.map(p=><li key={p.id} className="pm-item" aria-busy={busy===p.id}>
   <div className="pm-item-thumb">{p.cover_id?<img src={'/api/media/'+p.cover_id} alt="" loading="lazy"/>:<span>No photo</span>}</div>
   <div className="pm-item-body">
    <span className={'pm-chip '+(p.deleted_at?'trash':p.publish_status==='published'?'live':'draft')}>{statusLabel(p)}</span>
    <h2>{p.title}</h2>
    <p>{p.community}, {p.emirate} · {p.price_from?'From ':''}{aed(p.price_aed)}</p>
    <small>{p.media_count} photo{p.media_count===1?'':'s'} · Ref {p.reference_code} · Updated {new Date(p.updated_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</small>
   </div>
   <div className="pm-item-actions">{p.deleted_at?editable&&<>
     <button type="button" className="pm-btn" disabled={!!busy} onClick={()=>void restore(p)}><RotateCcw size={15}/> Restore</button>
     <button type="button" className="pm-btn pm-danger-text" disabled={!!busy} onClick={()=>void erase(p)}><Trash2 size={15}/> Delete forever</button>
    </>:<>
     <button type="button" className="pm-btn" onClick={()=>onEdit(p.id)}><Pencil size={15}/> {editable?'Edit':'View'}</button>
     {p.publish_status==='published'?<a className="pm-btn" href={`/properties/${p.slug}`} target="_blank" rel="noopener noreferrer"><Eye size={15}/> View live</a>:<button type="button" className="pm-btn" onClick={()=>onEdit(p.id,3)}><Eye size={15}/> Preview</button>}
     {editable&&(p.publish_status==='published'?<button type="button" className="pm-btn" disabled={!!busy} onClick={()=>void unpublish(p)}><EyeOff size={15}/> Unpublish</button>:<button type="button" className="pm-btn pm-primary" disabled={!!busy||!p.media_count} title={p.media_count?undefined:'Add a photo first'} onClick={()=>void publish(p)}><Upload size={15}/> Publish</button>)}
     {editable&&<button type="button" className="pm-btn pm-danger-text" disabled={!!busy} onClick={()=>void remove(p)}><Trash2 size={15}/> Delete</button>}
    </>}</div>
  </li>)}</ul>}
 </section>;
}
