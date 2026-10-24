'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {Search,ChevronDown} from 'lucide-react';
const LOCATIONS=['Downtown Dubai','Dubai Marina','Palm Jumeirah','Business Bay','Dubai Hills Estate','Jumeirah Village Circle'];
const TYPES=['Apartment','Villa','Penthouse','Townhouse'];
export default function SearchBar(){
 const [location,setLocation]=useState(''),[type,setType]=useState('');
 const router=useRouter();
 const go=(e:React.FormEvent)=>{e.preventDefault();const p=new URLSearchParams();p.set('purpose','Buy');if(location)p.set('location',location);if(type)p.set('type',type);router.push('/properties?'+p.toString())};
 return <form className="ds-search" onSubmit={go} role="search" aria-label="Search properties to buy">
  <label><span>Area</span><select value={location} onChange={e=>setLocation(e.target.value)}><option value="">All of Dubai</option>{LOCATIONS.map(v=><option key={v}>{v}</option>)}</select><ChevronDown aria-hidden="true" size={15}/></label>
  <label><span>Property type</span><select value={type} onChange={e=>setType(e.target.value)}><option value="">Any type</option>{TYPES.map(v=><option key={v}>{v}</option>)}</select><ChevronDown aria-hidden="true" size={15}/></label>
  <button type="submit"><Search size={18} aria-hidden="true"/> Search</button>
 </form>;
}
