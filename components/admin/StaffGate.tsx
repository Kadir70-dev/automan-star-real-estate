'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {api,type Staff} from '@/components/admin/properties/api';

// Login screen + session check shared by admin tools. Credentials go only to
// the same-origin staff relay; the password field is cleared after sign-in.
export default function StaffGate({children}:{children:(staff:Staff,logout:()=>void)=>React.ReactNode}){
 const[staff,setStaff]=useState<Staff|null>(null),[loaded,setLoaded]=useState(false);
 const[email,setEmail]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{let on=true;api.session().then(s=>{if(on){setStaff(s);setLoaded(true)}});return()=>{on=false}},[]);
 async function login(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');
  try{const r=await api.login(email,password);setPassword('');setStaff(r.staff)}
  catch(err){setError(err instanceof Error?err.message:'Login failed. Please try again.')}
  finally{setBusy(false)}}
 async function logout(){await api.logout();setStaff(null);setPassword('')}
 if(!loaded)return <main className="studio st-center" aria-busy="true">Loading…</main>;
 if(!staff)return <main className="studio st-center"><form className="st-login" onSubmit={login}>
  <h1>Admin Login</h1>
  <label className="pm-sr" htmlFor="gate-email">Email</label>
  <input id="gate-email" type="email" placeholder="Email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)}/>
  <label className="pm-sr" htmlFor="gate-password">Password</label>
  <input id="gate-password" type="password" placeholder="Password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/>
  <button disabled={busy}>{busy?'Signing in…':'Login'}</button>
  {error&&<p className="st-error" role="alert">{error}</p>}
  <Link href="/">← Back to website</Link>
 </form></main>;
 return <>{children(staff,logout)}</>;
}
