'use client';
import {useCallback,useEffect,useRef,useState} from 'react';

export type Media={id:string;url:string;filename:string;alt_text:string;bytes:number};
type Props={onPick?:(m:Media)=>void;onClose?:()=>void;onUrl?:(url:string)=>void};

async function readJSON(r:Response){const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||('HTTP '+r.status));return j}

// Media library: full manager in the studio, or an image picker when onPick is set.
export default function MediaManager({onPick,onClose,onUrl}:Props){
 const[media,setMedia]=useState<Media[]>([]),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[progress,setProgress]=useState(''),[error,setError]=useState(''),[note,setNote]=useState('');
 const[cropMode,setCropMode]=useState<'original'|'wide'|'square'>('original');
 const[altDrafts,setAltDrafts]=useState<Record<string,string>>({}),[url,setUrl]=useState(''),[drag,setDrag]=useState(false);
 const input=useRef<HTMLInputElement>(null);
 const load=useCallback(async()=>{try{const r=await fetch('/api/cms/admin/media',{cache:'no-store'});if(r.ok)setMedia((await r.json()).data||[])}finally{setLoading(false)}},[]);
 useEffect(()=>{void load()},[load]);
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
 async function upload(files:FileList|File[]){
  const list=Array.from(files).filter(f=>/^image\/(png|jpeg|webp)$/.test(f.type));
  if(!list.length){setError('Choose JPEG, PNG or WebP images (10MB max each).');return}
  setBusy(true);setError('');setNote('');
  try{
   for(const[i,file]of list.entries()){
    setProgress(`Uploading ${i+1} of ${list.length}…`);
    const form=new FormData();form.append('file',await prepareUpload(file));
    await readJSON(await fetch('/api/cms/admin/media',{method:'POST',body:form}));
   }
   await load();setNote(list.length+' image'+(list.length>1?'s':'')+' uploaded.');
  }catch(e){setError(e instanceof Error?e.message:'Upload failed')}
  finally{setBusy(false);setProgress('')}
 }
 async function saveAlt(m:Media){
  setBusy(true);setError('');
  try{await readJSON(await fetch('/api/cms/admin/media/'+m.id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({alt_text:altDrafts[m.id]??m.alt_text})}));await load();setNote('Image description saved.')}
  catch(e){setError(e instanceof Error?e.message:'Could not save image description')}
  finally{setBusy(false)}
 }
 const picker=!!onPick;
 return <div className={picker?'st-media st-media-picker':'st-media'}>
  <div className="st-media-head">
   <div><h2>{picker?'Choose an image':'Media Manager'}</h2><p>{picker?'Pick from the library, upload a new image or paste an image URL.':'Upload & manage website images'}</p></div>
   {onClose&&<button type="button" className="st-close" onClick={onClose} aria-label="Close">✕</button>}
  </div>
  <div className={'st-drop'+(drag?' st-drag':'')} onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);void upload(e.dataTransfer.files)}}>
   <p className="st-drop-title">{progress||'Drag images here or'}</p>
   <button type="button" className="st-grad" disabled={busy} onClick={()=>input.current?.click()}>{busy?'Uploading…':'Select images'}</button>
   <input ref={input} hidden type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={e=>{if(e.target.files)void upload(e.target.files);e.target.value=''}}/>
   <label className="st-crop">Image upload mode
    <select value={cropMode} onChange={e=>setCropMode(e.target.value as 'original'|'wide'|'square')}>
     <option value="original">Original image (no changes)</option>
     <option value="wide">Center crop 16:9 (max 2400px, WebP)</option>
     <option value="square">Center crop 1:1 (max 2400px, WebP)</option>
    </select>
   </label>
   <small>Supports JPG, PNG, WEBP · Max 10MB each</small>
  </div>
  {onUrl&&<form className="st-url" onSubmit={e=>{e.preventDefault();if(/^(https:\/\/|\/(?!\/))/.test(url.trim()))onUrl(url.trim());else setError('Use an https:// URL or a /path on this site.')}}>
   <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="…or paste https:// image URL"/><button type="submit">Use URL</button>
  </form>}
  {error&&<p className="st-error" role="alert">{error}</p>}{note&&<p className="st-note" role="status">{note}</p>}
  {loading?<p className="st-muted">Loading library…</p>:!media.length?<p className="st-muted">No images uploaded yet.</p>:
  <div className="st-media-grid">{media.map(m=><div key={m.id} className="st-media-card">
   <div className="st-media-img"><img src={m.url} alt={m.alt_text||m.filename}/>
    {picker&&<button type="button" className="st-use" onClick={()=>onPick!(m)}>Use this image</button>}
   </div>
   <div className="st-media-body">
    <p title={m.filename}>{m.filename}</p>
    {!picker&&<>
     <label>Image description (alt text)<input value={altDrafts[m.id]??m.alt_text} maxLength={300} onChange={e=>setAltDrafts(d=>({...d,[m.id]:e.target.value}))}/></label>
     <div className="st-media-actions"><button type="button" disabled={busy} onClick={()=>void saveAlt(m)}>Save alt text</button><button type="button" onClick={()=>{void navigator.clipboard.writeText(m.url);setNote('URL copied.')}}>Copy URL</button></div>
    </>}
   </div>
  </div>)}</div>}
 </div>;
}
