'use client';
import {useCallback,useEffect,useMemo,useState} from 'react';
import {Check,ChevronLeft,ChevronRight,ExternalLink} from 'lucide-react';
import ListingDetail from '@/components/ListingDetail';
import type {LivePropertyDetail} from '@/lib/live-properties';
import PhotoManager from './PhotoManager';
import {api,blankForm,slugify,toForm,type AdminProperty,type Photo,type PropertyForm} from './api';
import {useConfirm} from './ConfirmDialog';

const STEPS=['Basic details','Price & location','Photos','Preview','Publish'];
const EMIRATES=['Dubai','Abu Dhabi','Sharjah','Ajman','Ras Al Khaimah','Umm Al Quwain','Fujairah'];
const TYPES:[string,string][]=[['apartment','Apartment'],['villa','Villa'],['townhouse','Townhouse'],['penthouse','Penthouse'],['office','Office'],['retail','Shop / retail'],['other','Other / mixed project']];
type Errors=Partial<Record<keyof PropertyForm,string>>;

function checkStep(step:number,f:PropertyForm):Errors{
 const e:Errors={};
 if(step===0){
  if(f.title.trim().length<4)e.title='Enter a title of at least 4 characters.';
  if(f.description.length>10000)e.description='Description is too long.';
  for(const k of ['bedrooms','bathrooms'] as const){const v=f[k];if(v!=null&&(v<0||v>100||!Number.isInteger(v)))e[k]='Enter a whole number from 0 to 100.'}
  if(f.area_sqft!=null&&f.area_sqft<=0)e.area_sqft='Size must be greater than 0.';
 }
 if(step===1){
  if(!(f.price_aed>0))e.price_aed='Enter the price in AED.';
  if(f.community.trim().length<2)e.community='Enter the community or area.';
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(f.slug)||f.slug.length<3)e.slug='Use at least 3 lowercase letters, numbers and dashes.';
  if(f.reference_code.trim().length<3)e.reference_code='Enter a reference code.';
  if(f.seo_title.length>120)e.seo_title='Max 120 characters.';
  if(f.seo_description.length>300)e.seo_description='Max 300 characters.';
 }
 return e;
}
const lines=(s:string)=>s.split('\n');
const num=(v:string)=>v.trim()===''?null:Number(v);

export default function PropertyWizard({editId,initialStep=0,editable,onClose,onSaved}:{editId:string|null;initialStep?:number;editable:boolean;onClose:()=>void;onSaved:(id:string)=>void}){
 const[blank]=useState(blankForm);
 const[id,setId]=useState(editId),[form,setForm]=useState<PropertyForm>(blank),[saved,setSaved]=useState<PropertyForm|null>(editId?null:blank);
 const[record,setRecord]=useState<AdminProperty|null>(null),[photos,setPhotos]=useState<Photo[]>([]);
 const[step,setStep]=useState(initialStep),[errors,setErrors]=useState<Errors>({}),[slugTouched,setSlugTouched]=useState(!!editId);
 const[busy,setBusy]=useState(''),[message,setMessage]=useState(''),[error,setError]=useState('');
 const[unitText,setUnitText]=useState(''),[highText,setHighText]=useState('');
 const confirm=useConfirm();
 const dirty=saved!==null&&JSON.stringify(form)!==JSON.stringify(saved);

 const load=useCallback(async(pid:string)=>{const p=await api.get(pid);const f=toForm(p);setRecord(p);setForm(f);setSaved(f);setUnitText(f.unit_mix.join('\n'));setHighText(f.highlights.join('\n'))},[]);
 useEffect(()=>{if(editId)load(editId).catch(e=>setError(e.message))},[editId,load]);
 useEffect(()=>{document.querySelector('.pm-steps button.active')?.scrollIntoView({block:'nearest',inline:'center',behavior:'smooth'})},[step]);
 useEffect(()=>{const warn=(e:BeforeUnloadEvent)=>{if(dirty)e.preventDefault()};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn)},[dirty]);

 const set=<K extends keyof PropertyForm>(k:K,v:PropertyForm[K])=>{setForm(f=>({...f,[k]:v,...(k==='title'&&!slugTouched?{slug:slugify(String(v))}:{})}));setErrors(e=>({...e,[k]:undefined}))};
 const field=(k:keyof PropertyForm)=>({id:'pf-'+k,'aria-invalid':!!errors[k]||undefined,'aria-describedby':errors[k]?'pf-'+k+'-err':undefined});
 const err=(k:keyof PropertyForm)=>errors[k]&&<span className="pm-field-error" id={'pf-'+k+'-err'}>{errors[k]}</span>;

 function validateAll(upTo:number){for(let s=0;s<=upTo;s++){const e=checkStep(s,form);if(Object.keys(e).length){setErrors(e);setStep(s);setError('Please fix the highlighted fields.');return false}}return true}
 async function save(quiet=false):Promise<string|null>{
  if(!validateAll(1))return null;
  setBusy('Saving…');setError('');if(!quiet)setMessage('');
  try{
   let pid=id;
   if(pid)await api.update(pid,form);else{pid=(await api.create(form)).id;setId(pid);onSaved(pid)}
   await load(pid);if(!quiet)setMessage(record?.publish_status==='published'?'Changes saved and live on the website.':'Draft saved. It is not on the website until you publish.');
   return pid;
  }catch(e){setError(e instanceof Error?e.message:'Save failed');return null}finally{setBusy('')}
 }
 async function next(){
  const e=checkStep(step,form);if(Object.keys(e).length){setErrors(e);setError('Please fix the highlighted fields.');return}
  setError('');setMessage('');
  if(step===1&&(!id||dirty)&&editable){if(!await save(true))return}
  setStep(s=>Math.min(s+1,STEPS.length-1));window.scrollTo({top:0,behavior:'smooth'});
 }
 async function setLive(publish:boolean){
  if(!publish&&!await confirm({title:'Unpublish this listing?',body:'It will be removed from the website straight away. You can publish it again any time.',ok:'Unpublish'}))return;
  const pid=dirty||!id?await save(true):id;if(!pid)return;
  setBusy(publish?'Publishing…':'Unpublishing…');setError('');setMessage('');
  try{await api.setStatus(pid,publish?'published':'draft');await load(pid);setMessage(publish?'Published! The listing is now live on the website.':'Unpublished. The listing is hidden from the website and kept as a draft.')}
  catch(e){setError(e instanceof Error?e.message:'Update failed');if(/photo/i.test(String(e)))setStep(2)}finally{setBusy('')}
 }
 async function close(){if(dirty&&!await confirm({title:'Leave without saving?',body:'Your latest changes have not been saved.',ok:'Leave without saving',danger:true}))return;onClose()}

 const preview=useMemo<LivePropertyDetail>(()=>({...form,id:id||'preview',price_aed:String(form.price_aed),updated_at:record?.updated_at,
  media:[...photos].sort((a,b)=>Number(b.is_cover)-Number(a.is_cover)||a.sort_order-b.sort_order).map(p=>({id:p.id,alt:p.alt_text,is_cover:p.is_cover}))}),[form,id,photos,record]);
 const live=record?.publish_status==='published';
 const onPhotos=useCallback((p:Photo[])=>setPhotos(p),[]);
 const checks=[['Title',form.title.trim().length>=4],['Price',form.price_aed>0],['Location',form.community.trim().length>=2],['At least one photo',photos.length>0]] as const;

 return <section className="pm-wizard" aria-labelledby="pm-wizard-title">
  <div className="pm-wizard-head">
   <button type="button" className="pm-btn pm-ghost" onClick={()=>void close()}><ChevronLeft size={16}/> All properties</button>
   <h1 id="pm-wizard-title">{id?(form.title||'Edit property'):'Add property'}</h1>
   {record&&<span className={'pm-chip '+(live?'live':'draft')}>{live?'Live on website':'Draft'}</span>}
  </div>
  <ol className="pm-steps">{STEPS.map((s,i)=><li key={s}><button type="button" aria-current={i===step?'step':undefined} className={i===step?'active':i<step?'done':''} disabled={i>=2&&!id} onClick={()=>{if(i<=step||validateAll(Math.min(i-1,1)))setStep(i)}}><span>{i<step?<Check size={13}/>:i+1}</span>{s}</button></li>)}</ol>
  {error&&<p className="st-error" role="alert">{error}</p>}{message&&<p className="st-note" role="status">{message}</p>}
  {!editable&&<p className="st-note">You can view listings. Only admins and managers can make changes.</p>}
  {step<2&&<fieldset className="pm-card" disabled={!editable||!!busy}>
   {step===0&&<div className="pm-grid">
    <label className="pm-span2" htmlFor="pf-title">Property title <b>*</b><input {...field('title')} value={form.title} onChange={e=>set('title',e.target.value)} placeholder="e.g. Azizi Florence"/>{err('title')}</label>
    <label htmlFor="pf-category">Property type <b>*</b><select {...field('category')} value={form.category} onChange={e=>set('category',e.target.value)}>{TYPES.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
    <label htmlFor="pf-construction_status">Status <b>*</b><select {...field('construction_status')} value={form.construction_status} onChange={e=>set('construction_status',e.target.value)}><option value="ready">Ready to move in</option><option value="off_plan">Off-plan</option><option value="under_construction">Under construction</option></select></label>
    <label htmlFor="pf-listing_type">Listing for <b>*</b><select {...field('listing_type')} value={form.listing_type} onChange={e=>set('listing_type',e.target.value)}><option value="sale">Sale</option><option value="lease">Commercial lease</option></select></label>
    <label htmlFor="pf-developer">Developer <i>(optional)</i><input {...field('developer')} value={form.developer} onChange={e=>set('developer',e.target.value)} placeholder="e.g. Azizi Developments"/></label>
    <label className="pm-span2" htmlFor="pf-description">Description<textarea {...field('description')} rows={6} value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Describe the property or project. Leave a blank line between paragraphs."/>{err('description')}</label>
    <label htmlFor="pf-bedrooms">Bedrooms <i>(optional)</i><input {...field('bedrooms')} type="number" inputMode="numeric" min={0} max={100} value={form.bedrooms??''} onChange={e=>set('bedrooms',num(e.target.value))}/>{err('bedrooms')}</label>
    <label htmlFor="pf-bathrooms">Bathrooms <i>(optional)</i><input {...field('bathrooms')} type="number" inputMode="numeric" min={0} max={100} value={form.bathrooms??''} onChange={e=>set('bathrooms',num(e.target.value))}/>{err('bathrooms')}</label>
    <label htmlFor="pf-area_sqft">Size in sq. ft. <i>(optional)</i><input {...field('area_sqft')} type="number" inputMode="decimal" min={1} value={form.area_sqft??''} onChange={e=>set('area_sqft',num(e.target.value))}/>{err('area_sqft')}</label>
    <label className="pm-span2" htmlFor="pf-unit_mix">Homes available <i>(one per line, optional)</i><textarea id="pf-unit_mix" rows={3} value={unitText} onChange={e=>{setUnitText(e.target.value);set('unit_mix',lines(e.target.value))}} placeholder={'Apartments\n3 & 4 bedroom townhouses'}/></label>
    <label className="pm-span2" htmlFor="pf-highlights">Highlights &amp; amenities <i>(one per line, optional)</i><textarea id="pf-highlights" rows={4} value={highText} onChange={e=>{setHighText(e.target.value);set('highlights',lines(e.target.value))}} placeholder={'Central park\nSwimming pool'}/></label>
   </div>}
   {step===1&&<div className="pm-grid">
    <label htmlFor="pf-price_aed">Price in AED <b>*</b><input {...field('price_aed')} type="number" inputMode="numeric" min={1} value={form.price_aed||''} onChange={e=>set('price_aed',Number(e.target.value))} placeholder="e.g. 2090000"/>{err('price_aed')}</label>
    <label className="pm-check"><input type="checkbox" checked={form.price_from} onChange={e=>set('price_from',e.target.checked)}/> Show as “Starting from” (for projects)</label>
    <label htmlFor="pf-emirate">Emirate <b>*</b><select {...field('emirate')} value={form.emirate} onChange={e=>set('emirate',e.target.value)}>{EMIRATES.map(v=><option key={v}>{v}</option>)}</select></label>
    <label htmlFor="pf-community">Community / area <b>*</b><input {...field('community')} value={form.community} onChange={e=>set('community',e.target.value)} placeholder="e.g. Dubai Marina"/>{err('community')}</label>
    <label htmlFor="pf-community_size">Community size <i>(optional)</i><input {...field('community_size')} value={form.community_size} onChange={e=>set('community_size',e.target.value)} placeholder="e.g. ~30M sq. ft."/></label>
    <label htmlFor="pf-permit_number">Permit / RERA number <i>(optional)</i><input {...field('permit_number')} value={form.permit_number} onChange={e=>set('permit_number',e.target.value)}/></label>
    <label className="pm-check pm-span2"><input type="checkbox" checked={form.featured} onChange={e=>set('featured',e.target.checked)}/> Feature on the home page</label>
    <details className="pm-span2 pm-advanced"><summary>Advanced: web address &amp; Google listing</summary><div className="pm-grid">
     <label className="pm-span2" htmlFor="pf-slug">Web address <b>*</b><span className="pm-prefix"><span>/properties/</span><input {...field('slug')} value={form.slug} onChange={e=>{setSlugTouched(true);set('slug',slugify(e.target.value))}}/></span>{err('slug')}{live&&<small>Changing this breaks links that were already shared.</small>}</label>
     <label htmlFor="pf-reference_code">Reference code <b>*</b><input {...field('reference_code')} value={form.reference_code} onChange={e=>set('reference_code',e.target.value)}/>{err('reference_code')}</label>
     <label className="pm-span2" htmlFor="pf-seo_title">Google title <i>(optional, max 120)</i><input {...field('seo_title')} maxLength={120} value={form.seo_title} onChange={e=>set('seo_title',e.target.value)}/>{err('seo_title')}</label>
     <label className="pm-span2" htmlFor="pf-seo_description">Google description <i>(optional, max 300)</i><textarea {...field('seo_description')} rows={3} maxLength={300} value={form.seo_description} onChange={e=>set('seo_description',e.target.value)}/>{err('seo_description')}</label>
    </div></details>
   </div>}
  </fieldset>}
  {step===2&&(id?<div className="pm-card"><PhotoManager propertyId={id} title={form.title} editable={editable} onChange={onPhotos}/></div>:<p className="st-muted">Save the basic details first.</p>)}
  {step===3&&<div className="pm-preview"><ListingDetail p={preview} preview/></div>}
  {step===4&&<div className="pm-card pm-publish">
   <h2>{live?'This listing is live':'Ready to publish?'}</h2>
   <ul className="pm-checklist">{checks.map(([l,ok])=><li key={l} className={ok?'ok':'missing'}>{ok?'✓':'✗'} {l}</li>)}</ul>
   {live&&<a className="pm-btn" href={`/properties/${form.slug}`} target="_blank" rel="noopener noreferrer">View on website <ExternalLink size={14}/></a>}
   {editable&&<div className="pm-publish-actions">
    {live?<button type="button" className="pm-btn" disabled={!!busy} onClick={()=>void setLive(false)}>Unpublish (hide from website)</button>:<button type="button" className="pm-btn" disabled={!!busy} onClick={()=>void save()}>Save as draft</button>}
    {(!live||dirty)&&<button type="button" className="pm-btn pm-primary" disabled={!!busy||checks.some(c=>!c[1])} onClick={()=>live?void save():void setLive(true)}>{live?'Save changes (live)':'Publish to website'}</button>}
   </div>}
  </div>}
  <div className="pm-savebar" role="region" aria-label="Save and navigation">
   <span className="pm-savestate" aria-live="polite">{busy||(dirty?'● Unsaved changes':saved&&id?'All changes saved':'')}</span>
   <div>
    {step>0&&<button type="button" className="pm-btn pm-ghost" onClick={()=>setStep(s=>s-1)}><ChevronLeft size={16}/> Back</button>}
    {editable&&step<4&&<button type="button" className="pm-btn" disabled={!!busy||(!dirty&&!!id)} onClick={()=>void save()}>{live?'Save':'Save draft'}</button>}
    {step<4&&<button type="button" className="pm-btn pm-primary" disabled={!!busy} onClick={()=>void next()}>Next: {STEPS[step+1]} <ChevronRight size={16}/></button>}
   </div>
  </div>
 </section>;
}
