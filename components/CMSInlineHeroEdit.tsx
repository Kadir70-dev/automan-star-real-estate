'use client';
import {useEffect,useState} from 'react';
type EditorState={heading:string;description:string;primary_button:{label:string;href:string};seo:{title:string;description:string}};
const defaults:EditorState={heading:'Buy well in Dubai.',description:'Apartments, villas, off-plan and commercial property, advised from our office in Business Bay.',primary_button:{label:'Browse properties',href:'/properties'},seo:{title:'Automan Star Real Estate | Dubai Real Estate Agency, Business Bay',description:'Dubai real estate agency in Business Bay. Automan Star Real Estate helps you buy apartments, villas, off-plan and commercial property in Dubai.'}};
export default function CMSInlineHeroEdit(){
 const [isAdmin,setAdmin]=useState(false),[open,setOpen]=useState(false),[value,setValue]=useState<EditorState>(defaults),[rev,setRev]=useState(0),[notice,setNotice]=useState(''),[saving,setSaving]=useState(false);
 useEffect(()=>{
  let active=true;
  void fetch('/api/staff/me',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(x=>{if(active)setAdmin(x?.staff?.role==='admin')}).catch(()=>{});
  return()=>{active=false};
 },[]);
 if(!isAdmin)return null;
 async function start(){
  setNotice('');
  try{
   const response=await fetch('/api/cms/admin/pages/home',{cache:'no-store'});
   if(response.ok){const data=await response.json();setRev(data.draft_revision);setValue({...defaults,...data.draft,primary_button:{...defaults.primary_button,...data.draft?.primary_button},seo:{...defaults.seo,...data.draft?.seo}})}
   else if(response.status===404){setRev(0);setValue(defaults)}
   else throw Error('Unable to load CMS draft');
   setOpen(true);
  }catch(e){setNotice(e instanceof Error?e.message:'CMS unavailable')}
 }
 async function save(publish:boolean){
  setSaving(true);setNotice('');
  try{
   const res=await fetch('/api/cms/admin/pages/home/draft',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({path:'/',title:'Homepage',content:value,expected_revision:rev})});
   const out=await res.json();if(!res.ok)throw Error(out.error||'Save failed');
   setRev(out.draft_revision);
   if(publish){
    const p=await fetch('/api/cms/admin/pages/home/publish',{method:'POST'});
    if(!p.ok)throw Error('Draft saved but publishing failed');
    setNotice('Published! Reload the page after the cache refresh to view.');
   }else setNotice('Draft saved. Public page unchanged.');
  }catch(e){setNotice(e instanceof Error?e.message:'Error')}finally{setSaving(false)}
 }
 const input={display:'block',width:'100%',marginTop:6,padding:'10px 12px',border:'1px solid #b7c5c9',borderRadius:8,background:'white',color:'#172a31'};
 const button={padding:'10px 15px',borderRadius:8,border:'1px solid #a2adaf',background:'#fff',color:'#172a31',cursor:'pointer'};
 return <>
  <button type='button' onClick={()=>void start()} style={{position:'fixed',right:20,bottom:20,zIndex:9001,border:0,borderRadius:99,background:'#17383e',color:'white',padding:'14px 24px',boxShadow:'0 12px 32px #0004',cursor:'pointer'}}>✎ Edit Page</button>
  {notice&&!open&&<p role='status' style={{position:'fixed',bottom:80,right:20,zIndex:9001,background:'white',padding:14,borderRadius:8,color:'#17383e'}}>{notice}</p>}
  {open&&<div role='presentation' style={{position:'fixed',inset:0,zIndex:9002,background:'#091c22a8',display:'grid',placeItems:'center',padding:20}}>
   <section role='dialog' aria-modal='true' aria-label='Edit homepage hero' style={{width:'min(680px,100%)',maxHeight:'92vh',overflow:'auto',background:'#faf9f6',padding:28,borderRadius:16,color:'#172a31',boxShadow:'0 16px 50px #0004'}}>
    <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:20}}><h2 style={{fontSize:25}}>Edit homepage hero</h2><button type='button' onClick={()=>setOpen(false)} style={button}>Close</button></header>
    <p style={{margin:'12px 0 24px'}}>Draft editing. Your existing website design will remain unchanged.</p>
    <div style={{display:'grid',gap:16}}>
     <label>Heading<input style={input} maxLength={120} value={value.heading} onChange={e=>setValue({...value,heading:e.target.value})}/></label>
     <label>Description<textarea style={input} rows={4} maxLength={600} value={value.description} onChange={e=>setValue({...value,description:e.target.value})}/></label>
     <label>Button label<input style={input} maxLength={60} value={value.primary_button.label} onChange={e=>setValue({...value,primary_button:{...value.primary_button,label:e.target.value}})}/></label>
     <label>Button path<input style={input} maxLength={120} value={value.primary_button.href} onChange={e=>setValue({...value,primary_button:{...value.primary_button,href:e.target.value}})}/></label>
     <h3>Search Engine Metadata</h3>
     <label>SEO title<input style={input} maxLength={120} value={value.seo.title} onChange={e=>setValue({...value,seo:{...value.seo,title:e.target.value}})}/></label>
     <label>Meta description<textarea style={input} rows={3} maxLength={300} value={value.seo.description} onChange={e=>setValue({...value,seo:{...value.seo,description:e.target.value}})}/></label>
     <div style={{display:'flex',gap:12,flexWrap:'wrap'}}><button type='button' disabled={saving} style={button} onClick={()=>void save(false)}>Save draft</button><button type='button' disabled={saving} style={{...button,background:'#17383e',color:'#fff'}} onClick={()=>void save(true)}>Save & Publish</button></div>
     {notice&&<p role='status'>{notice}</p>}
    </div>
   </section>
  </div>}
 </>;
}
