'use client';
/* eslint-disable @next/next/no-img-element -- admin thumbnails load private draft photos through the staff media relay */
import {useCallback,useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,ImagePlus,Star,Trash2} from 'lucide-react';
import {api,type Photo} from './api';
import {useConfirm} from './ConfirmDialog';

const OK_TYPES=['image/jpeg','image/png','image/webp'];
const MAX_EDGE=2400;

// Phone photos are often HEIC or 5–15 MB: decode in the browser and re-encode
// as JPEG (max 2400px). Small JPG/PNG/WebP files are uploaded untouched.
async function prepare(file:File):Promise<{blob:Blob;name:string}>{
 if(OK_TYPES.includes(file.type)&&file.size<=4*1024*1024)return {blob:file,name:file.name};
 let bitmap:ImageBitmap;
 try{bitmap=await createImageBitmap(file)}catch{throw new Error(`“${file.name}” is not a supported photo. Please use JPG, PNG or WebP.`)}
 const scale=Math.min(1,MAX_EDGE/Math.max(bitmap.width,bitmap.height));
 const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);
 canvas.getContext('2d')!.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
 const blob=await new Promise<Blob|null>(r=>canvas.toBlob(r,'image/jpeg',0.85));
 if(!blob)throw new Error(`Could not process “${file.name}”.`);
 return {blob,name:file.name.replace(/\.[^.]+$/,'')+'.jpg'};
}

export default function PhotoManager({propertyId,title,editable,onChange}:{propertyId:string;title:string;editable:boolean;onChange?:(photos:Photo[])=>void}){
 const[photos,setPhotos]=useState<Photo[]>([]),[loading,setLoading]=useState(true),[progress,setProgress]=useState(''),[error,setError]=useState(''),[note,setNote]=useState('');
 const[dragOver,setDragOver]=useState(false),[dragId,setDragId]=useState<string|null>(null);
 const input=useRef<HTMLInputElement>(null);
 const confirm=useConfirm();
 const sorted=(list:Photo[])=>[...list].sort((a,b)=>a.sort_order-b.sort_order);
 const refresh=useCallback(async()=>{const list=sorted(await api.photos(propertyId));setPhotos(list);onChange?.(list);return list},[propertyId,onChange]);
 useEffect(()=>{refresh().catch(e=>setError(e.message)).finally(()=>setLoading(false))},[refresh]);

 async function addFiles(files:FileList|File[]){
  const list=[...files].filter(f=>f.type.startsWith('image/')||/\.(heic|heif)$/i.test(f.name));
  if(!list.length){setError('Please choose photo files (JPG, PNG, WebP or iPhone HEIC).');return}
  setError('');setNote('');let done=0;const failed:string[]=[];
  for(const f of list){
   setProgress(`Uploading photo ${done+1} of ${list.length}…`);
   try{const {blob,name}=await prepare(f);await api.upload(propertyId,blob,name,`${title} – photo ${photos.length+done+1}`);done++}
   catch(e){failed.push(e instanceof Error?e.message:f.name)}
  }
  setProgress('');await refresh().catch(()=>{});
  if(done)setNote(`${done} photo${done===1?'':'s'} uploaded.${photos.length===0?' The first photo is the cover — you can change it.':''}`);
  if(failed.length)setError(failed.join(' '));
 }
 async function run(action:()=>Promise<unknown>,ok:string){setError('');setNote('');try{await action();await refresh();setNote(ok)}catch(e){setError(e instanceof Error?e.message:'Something went wrong')}}
 const move=(from:number,to:number)=>{if(to<0||to>=photos.length)return;const next=[...photos];const [m]=next.splice(from,1);next.splice(to,0,m);setPhotos(next.map((p,i)=>({...p,sort_order:i})));void run(()=>api.order(propertyId,next.map(p=>p.id)),'Order saved.')};
 async function remove(p:Photo){if(await confirm({title:'Remove this photo?',body:'It will be deleted from this listing. This cannot be undone.',ok:'Remove photo',danger:true}))void run(()=>api.removePhoto(propertyId,p.id),'Photo removed.')}
 async function saveAlt(p:Photo,alt:string){if(alt.trim()===p.alt_text)return;await run(()=>api.setAlt(propertyId,p.id,alt),'Photo description saved.')}

 return <div className="pm-photos">
  {editable&&<div className={'pm-drop'+(dragOver?' over':'')} onDragOver={e=>{if(e.dataTransfer.types.includes('Files')){e.preventDefault();setDragOver(true)}}} onDragLeave={()=>setDragOver(false)} onDrop={e=>{if(!e.dataTransfer.files.length)return;e.preventDefault();setDragOver(false);void addFiles(e.dataTransfer.files)}}>
   <ImagePlus size={30} aria-hidden="true"/>
   <p><b>Drag photos here</b><span>or</span></p>
   <button type="button" className="pm-btn pm-primary" onClick={()=>input.current?.click()} disabled={!!progress}>Choose photos from phone or computer</button>
   <input ref={input} type="file" accept="image/*,.heic,.heif" multiple hidden onChange={e=>{if(e.target.files)void addFiles(e.target.files);e.target.value=''}}/>
   <small>You can select many photos at once. Large phone photos are resized automatically.</small>
  </div>}
  {progress&&<p className="st-note" role="status" aria-live="polite">{progress}</p>}
  {error&&<p className="st-error" role="alert">{error}</p>}
  {note&&!progress&&<p className="st-note" role="status">{note}</p>}
  {loading?<p className="st-muted">Loading photos…</p>:!photos.length?<p className="st-muted">No photos yet. Add at least one photo before publishing.</p>:<>
   <p className="st-muted">{photos.length} photo{photos.length===1?'':'s'}. {editable&&'Drag to reorder (or use the arrows). The ★ cover photo is shown first on the website.'}</p>
   <ul className="pm-photo-grid">{photos.map((p,i)=><li key={p.id} className={(p.is_cover?'cover ':'')+(dragId===p.id?'dragging':'')} draggable={editable} onDragStart={()=>setDragId(p.id)} onDragEnd={()=>setDragId(null)} onDragOver={e=>{if(dragId)e.preventDefault()}} onDrop={e=>{if(!dragId)return;e.preventDefault();move(photos.findIndex(x=>x.id===dragId),i);setDragId(null)}}>
    <div className="pm-thumb"><img src={'/api/media/'+p.id} alt={p.alt_text||`Photo ${i+1}`} loading="lazy"/>{p.is_cover&&<span className="pm-cover-tag"><Star size={12} fill="currentColor"/> Cover</span>}<span className="pm-num">{i+1}</span></div>
    {editable?<>
     <label className="pm-alt">Photo description<input defaultValue={p.alt_text} maxLength={300} placeholder="e.g. Villa front with garden" onBlur={e=>void saveAlt(p,e.target.value)}/></label>
     <div className="pm-photo-actions">
      <button type="button" aria-label={`Move photo ${i+1} earlier`} disabled={i===0} onClick={()=>move(i,i-1)}><ArrowLeft size={16}/></button>
      <button type="button" aria-label={`Move photo ${i+1} later`} disabled={i===photos.length-1} onClick={()=>move(i,i+1)}><ArrowRight size={16}/></button>
      {!p.is_cover&&<button type="button" onClick={()=>void run(()=>api.setCover(propertyId,p.id),'Cover photo changed.')}><Star size={15}/> Make cover</button>}
      <button type="button" className="pm-danger-text" aria-label={`Remove photo ${i+1}`} onClick={()=>void remove(p)}><Trash2 size={15}/> Remove</button>
     </div>
    </>:<p className="st-muted">{p.alt_text}</p>}
   </li>)}</ul>
  </>}
 </div>;
}
