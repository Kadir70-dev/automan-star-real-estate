'use client';
import {useState} from 'react';
import Link from 'next/link';
import {ArrowUpRight} from 'lucide-react';
import {sendCRM} from '@/lib/crm-api';

export default function Enquiry({property}:{property?:string}) {
 const [name,setName]=useState('');
 const [email,setEmail]=useState('');
 const [message,setMessage]=useState('');
 const [consent,setConsent]=useState(false);
 const [done,setDone]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');

 async function submit(e:React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
  if(busy)return;
  const form=e.currentTarget;
  const hp=form.elements.namedItem('company') as HTMLInputElement|null;
  setBusy(true);
  setError('');
  try {
   await sendCRM('leads',{
    name,email,message,property:property||'General enquiry',
    consent,company:hp?.value||'',sourceUrl:window.location.href,
   });
   setDone(true);
  }catch(err){
   setError(err instanceof Error?err.message:'We could not submit your enquiry. Please try again.');
  }finally{setBusy(false);}
 }
 if(done)return <div className="form-success" role="status"><b>ENQUIRY RECEIVED.</b><p>Your enquiry was recorded. Our team will review it before following up.</p><button type="button" onClick={()=>{setDone(false);setName('');setEmail('');setMessage('');setConsent(false);}}>SEND ANOTHER ENQUIRY</button></div>;

 return <form className="enquiry-form" onSubmit={submit}>
  <label>YOUR NAME<input name="name" value={name} onChange={e=>setName(e.target.value)} placeholder="Full name" autoComplete="name" required minLength={2} maxLength={120}/></label>
  <label>EMAIL ADDRESS<input name="email" value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="you@example.com" autoComplete="email" required maxLength={254}/></label>
  <label>YOUR MESSAGE<textarea name="message" value={message} onChange={e=>setMessage(e.target.value)} placeholder="I’d like to know more…" rows={3} maxLength={3000}/></label>
  <div className="enquiry-hp" aria-hidden="true"><label>Company<input type="text" name="company" tabIndex={-1} autoComplete="off"/></label></div>
  <label className="enquiry-consent"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} required/><span>I agree to be contacted about this enquiry and have read the <Link href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</Link>.</span></label>
  {error&&<p role="alert">{error} <a href="mailto:saud@automanstarrealty.com">Email our team</a>.</p>}
  <button disabled={busy} aria-busy={busy} className="button button-gold" type="submit">{busy?'SENDING…':'SEND ENQUIRY'} <ArrowUpRight size={17}/></button>
  <p className="form-disclaimer">Your enquiry is recorded only when the form confirms success. No automated viewing confirmation is issued.</p>
 </form>;
}
