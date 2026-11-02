'use client';
import {Suspense,useCallback} from 'react';
import Link from 'next/link';
import {useRouter,useSearchParams} from 'next/navigation';
import StaffGate from '@/components/admin/StaffGate';
import PropertyList from '@/components/admin/properties/PropertyList';
import PropertyWizard from '@/components/admin/properties/PropertyWizard';
import {ConfirmProvider} from '@/components/admin/properties/ConfirmDialog';
import {canEdit,type Staff} from '@/components/admin/properties/api';
import '../admin.css';
import './properties.css';

// /admin/properties            → list
// /admin/properties?edit=new   → add-property wizard
// /admin/properties?edit=<id>  → edit wizard (&step=0-4)
function Manager({staff,logout}:{staff:Staff;logout:()=>void}){
 const router=useRouter(),params=useSearchParams();
 const edit=params.get('edit'),step=Number(params.get('step')||0);
 const go=useCallback((q:string)=>{router.push('/admin/properties'+q);window.scrollTo({top:0})},[router]);
 const editable=canEdit(staff);
 return <main className="studio pm">
  <div className="st-wrap">
   <header className="st-top">
    <strong>AUTOMAN STAR <span>· Properties</span></strong>
    <nav>{staff.role==='admin'&&<Link href="/admin">Website content</Link>}<Link href="/" target="_blank">View website ↗</Link><span className="st-muted">{staff.name}</span><button type="button" className="st-logout" onClick={logout}>Logout</button></nav>
   </header>
   {edit?<PropertyWizard editId={edit==='new'?null:edit} initialStep={Math.min(Math.max(step,0),4)} editable={editable} onClose={()=>go('')} onSaved={id=>router.replace('/admin/properties?edit='+id,{scroll:false})}/>
    :<PropertyList editable={editable} onAdd={()=>go('?edit=new')} onEdit={(id,s)=>go('?edit='+id+(s?'&step='+s:''))}/>}
  </div>
 </main>;
}

export default function PropertiesAdmin(){
 return <ConfirmProvider><Suspense fallback={<main className="studio st-center">Loading…</main>}><StaffGate>{(staff,logout)=><Manager staff={staff} logout={logout}/>}</StaffGate></Suspense></ConfirmProvider>;
}
