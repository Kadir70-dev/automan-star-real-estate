'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {ArrowUpRight,Check,X} from 'lucide-react';
import {COUNTRIES,INTERESTS,validateLead,type LeadErrors,type LeadInput} from '@/lib/consultation-lead';

const SEEN_KEY='automan-consultation-popup-seen',OPEN_DELAY_MS=2000,ANIM_MS=300;
const blank:LeadInput={name:'',email:'',country:'AE',phone:'',interest:'',consent:false};
const FOCUSABLE='a[href],button:not([disabled]),input:not([disabled]):not([tabindex="-1"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export default function ConsultationPopup(){
 const pathname=usePathname();
 const [phase,setPhase]=useState<'hidden'|'open'|'closing'>('hidden');
 const [form,setForm]=useState<LeadInput>(blank);
 const [errors,setErrors]=useState<LeadErrors>({});
 const [touched,setTouched]=useState<Partial<Record<keyof LeadInput,boolean>>>({});
 const [status,setStatus]=useState<'idle'|'sending'|'success'>('idle');
 const [serverError,setServerError]=useState('');
 const dialogRef=useRef<HTMLDivElement>(null),returnFocus=useRef<HTMLElement|null>(null),openedAt=useRef(0),sending=useRef(false),shown=useRef(false);
 const honeypot=useRef<HTMLInputElement>(null);

 // Auto-open once per browser session, 2s after landing. Never on staff dashboard pages.
 useEffect(()=>{
  if(shown.current||(pathname?.startsWith('/dashboard')||pathname?.startsWith('/cms')))return;
  try{if(sessionStorage.getItem(SEEN_KEY))return}catch{/* storage blocked: fall back to once per page load */}
  const t=window.setTimeout(()=>{
   shown.current=true;
   try{sessionStorage.setItem(SEEN_KEY,'1')}catch{}
   returnFocus.current=document.activeElement as HTMLElement|null;
   openedAt.current=Date.now();
   setPhase('open');
  },OPEN_DELAY_MS);
  return ()=>window.clearTimeout(t);
 },[pathname]);

 const close=useCallback(()=>{
  setPhase(p=>p==='open'?'closing':p);
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.setTimeout(()=>{setPhase('hidden');const el=returnFocus.current;if(el&&document.contains(el))el.focus({preventScroll:true})},reduced?0:ANIM_MS);
 },[]);

 // Scroll lock (with scrollbar compensation to avoid layout shift), initial focus, Escape + focus trap.
 useEffect(()=>{
  if(phase!=='open')return;
  const body=document.body,prevOverflow=body.style.overflow,prevPad=body.style.paddingRight;
  const gap=window.innerWidth-document.documentElement.clientWidth;
  body.style.overflow='hidden';if(gap>0)body.style.paddingRight=`${gap}px`;
  dialogRef.current?.focus({preventScroll:true});
  function onKey(e:KeyboardEvent){
   if(e.key==='Escape'){e.preventDefault();close();return}
   if(e.key!=='Tab'||!dialogRef.current)return;
   const items=[...dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(el=>el.offsetParent!==null);
   if(!items.length)return;
   const first=items[0],last=items[items.length-1];
   if(e.shiftKey&&(document.activeElement===first||document.activeElement===dialogRef.current)){e.preventDefault();last.focus()}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
  }
  document.addEventListener('keydown',onKey);
  return ()=>{document.removeEventListener('keydown',onKey);body.style.overflow=prevOverflow;body.style.paddingRight=prevPad};
 },[phase,close]);

 function update<K extends keyof LeadInput>(key:K,value:LeadInput[K]){
  const next={...form,[key]:value};setForm(next);setServerError('');
  if(touched[key]||errors[key]){const r=validateLead(next);setErrors(e=>({...e,[key]:r.ok?undefined:r.errors[key]}))}
 }
 function blur(key:keyof LeadInput){
  setTouched(t=>({...t,[key]:true}));
  const r=validateLead(form);setErrors(e=>({...e,[key]:r.ok?undefined:r.errors[key]}));
 }

 async function submit(e:React.FormEvent){
  e.preventDefault();
  if(sending.current)return;
  const r=validateLead(form);
  if(!r.ok){
   setErrors(r.errors);setTouched({name:true,email:true,country:true,phone:true,interest:true,consent:true});
   const first=(['name','email','country','phone','interest','consent'] as const).find(k=>r.errors[k]);
   if(first)document.getElementById(`cp-${first}`)?.focus();
   return;
  }
  sending.current=true;setStatus('sending');setServerError('');
  try{
   const res=await fetch('/api/leads/consultation',{method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',
    body:JSON.stringify({...form,company:honeypot.current?.value||'',elapsedMs:Date.now()-openedAt.current,sourceUrl:window.location.href})});
   let body:{ok?:boolean;error?:string;fields?:LeadErrors}={};
   try{body=await res.json()}catch{}
   if(res.ok&&body.ok){setStatus('success');return}
   if(body.fields)setErrors(body.fields);
   setServerError(body.error||'We could not submit your request. Please try again.');
   setStatus('idle');
  }catch{
   setServerError('Connection problem — your request was not sent. Please check your connection and try again.');
   setStatus('idle');
  }finally{sending.current=false}
 }

 if(phase==='hidden')return null;
 const err=(k:keyof LeadInput)=>touched[k]||serverError?errors[k]:undefined;
 const field=(k:keyof LeadInput)=>({id:`cp-${k}`,'aria-invalid':err(k)?true:undefined,'aria-describedby':err(k)?`cp-${k}-error`:undefined,onBlur:()=>blur(k)});
 const msg=(k:keyof LeadInput)=>err(k)?<span className="cp-error" id={`cp-${k}-error`}>{err(k)}</span>:null;

 return <div className={`cp-overlay${phase==='closing'?' is-closing':''}`} onMouseDown={e=>{if(e.target===e.currentTarget)close()}}>
  <div className="cp-dialog" role="dialog" aria-modal="true" aria-labelledby="cp-title" aria-describedby="cp-desc" tabIndex={-1} ref={dialogRef}>
   <button type="button" className="cp-close" onClick={close} aria-label="Close consultation form"><X size={20}/></button>
   <div className="cp-brand">
    <span className="cp-monogram" aria-hidden="true">A<span>✳</span></span>
    <p className="cp-eyebrow">AUTOMAN STAR · DUBAI</p>
    <h2 id="cp-title">BOOK YOUR FREE PRIVATE CONSULTATION</h2>
    <p id="cp-desc">Connect with our real estate experts and discover exceptional property opportunities across Dubai.</p>
    <span className="cp-rule" aria-hidden="true"/>
   </div>
   <div className="cp-body">
    {status==='success'?<div className="cp-success" role="status" aria-live="polite">
     <span className="cp-success-icon" aria-hidden="true"><Check size={26}/></span>
     <h3>Thank you, {form.name.split(' ')[0]}.</h3>
     <p>Your consultation request has been received. A member of our team will contact you.</p>
     <button type="button" className="cp-submit" onClick={close}>CONTINUE BROWSING</button>
    </div>:
    <form className="cp-form" onSubmit={submit} noValidate>
     <label htmlFor="cp-name">Full Name</label>
     <input {...field('name')} name="name" autoComplete="name" value={form.name} onChange={e=>update('name',e.target.value)} placeholder="Your full name" maxLength={120} required/>
     {msg('name')}
     <label htmlFor="cp-email">Email Address</label>
     <input {...field('email')} name="email" type="email" inputMode="email" autoComplete="email" value={form.email} onChange={e=>update('email',e.target.value)} placeholder="you@example.com" maxLength={254} required/>
     {msg('email')}
     <span className="cp-label" id="cp-phone-label">Phone Number</span>
     <div className="cp-phone" role="group" aria-labelledby="cp-phone-label">
      <select {...field('country')} name="country" aria-label="Country code" value={form.country} onChange={e=>update('country',e.target.value)}>
       {COUNTRIES.map(c=><option key={c.iso} value={c.iso}>{c.iso} +{c.dial}</option>)}
      </select>
      <input {...field('phone')} name="phone" type="tel" inputMode="tel" autoComplete="tel-national" aria-label="Phone number" value={form.phone} onChange={e=>update('phone',e.target.value)} placeholder={form.country==='AE'?'50 123 4567':'Phone number'} maxLength={32} required/>
     </div>
     {msg('country')}{msg('phone')}
     <label htmlFor="cp-interest">Interested In</label>
     <select {...field('interest')} name="interest" value={form.interest} onChange={e=>update('interest',e.target.value)} required>
      <option value="" disabled>Select an option</option>
      {INTERESTS.map(i=><option key={i} value={i}>{i}</option>)}
     </select>
     {msg('interest')}
     <div className="cp-hp" aria-hidden="true"><label>Company<input ref={honeypot} name="company" tabIndex={-1} autoComplete="off"/></label></div>
     <label className="cp-consent">
      <input {...field('consent')} type="checkbox" checked={form.consent} onChange={e=>update('consent',e.target.checked)}/>
      <span>I agree to be contacted by Automan Star Real Estate about my enquiry and accept the <Link href="/privacy" target="_blank" rel="noopener">Privacy Policy</Link>.</span>
     </label>
     {msg('consent')}
     {serverError&&<p className="cp-server-error" role="alert">{serverError}</p>}
     <button type="submit" className="cp-submit" disabled={status==='sending'} aria-busy={status==='sending'}>
      {status==='sending'?<><span className="cp-spinner" aria-hidden="true"/>SENDING…</>:<>Book My Consultation <ArrowUpRight size={17}/></>}
     </button>
    </form>}
   </div>
  </div>
 </div>;
}
