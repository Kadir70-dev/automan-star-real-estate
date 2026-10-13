'use client';
import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowLeft, ArrowRight, Eye, Layers3, RotateCcw, Sun, Map, Play, Pause, MousePointer2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

type Room = 'living' | 'kitchen' | 'bedroom' | 'balcony';
type Finish = 'sand' | 'graphite';
const TOUR_SECONDS=8;
const roomPoints:Record<Room,{x:number;y:number;label:string}>={living:{x:61,y:74,label:'Lounge'},kitchen:{x:28,y:35,label:'Kitchen'},bedroom:{x:71,y:26,label:'Suite'},balcony:{x:50,y:8,label:'Terrace'}};
const rooms: { id: Room; name: string; detail: string; position: [number,number,number]; target: [number,number,number] }[] = [
 {id:'living', name:'Living suite',detail:'Double-height feeling · sculptural forms',position:[7.8,4.2,8.5],target:[0,1.45,0]},
 {id:'kitchen',name:'Kitchen & dining',detail:'An open-plan entertaining concept',position:[-7.4,3.6,6.2],target:[-1.7,1.1,-.7]},
 {id:'bedroom',name:'Private suite',detail:'Warm textures · quiet retreat',position:[4.8,3.2,-8.5],target:[1.9,1.2,-1.7]},
 {id:'balcony',name:'Sky terrace',detail:'An open-air skyline impression',position:[-5.2,5.1,-8.4],target:[0,1,-4.8]},
];
function Box({position,size,color,roughness=.65,metalness=0}: {position:[number,number,number];size:[number,number,number];color:string;roughness?:number;metalness?:number}) {
 return <mesh position={position} castShadow receiveShadow><boxGeometry args={size}/><meshStandardMaterial color={color} roughness={roughness} metalness={metalness}/></mesh>;
}
function Residence({finish,floor}:{finish:Finish;floor:number}) {
 const light=finish==='sand', wall=light?'#d8c9b6':'#484c50', floorColor=light?'#b6a08a':'#343638', soft=light?'#f2e5d7':'#8d8f8d', dark=light?'#342d2c':'#151b20';
 const skyline=useMemo(()=>Array.from({length:32},(_,i)=>({x:(i-16)*.81,h:1.4+(i*13%11)*.5,depth:-12-(i%3)*.8})),[]);
 return <group position={[0,floor===32?.35:floor===24?0:-.25,0]}>
  <Box position={[0,-.15,0]} size={[12,.3,11]} color={floorColor}/>
  <Box position={[0,2.8,4.6]} size={[12,5.8,.2]} color={wall}/>
  <Box position={[-5.85,2.8,0]} size={[.2,5.8,9.2]} color={wall}/>
  <Box position={[5.85,2.8,1.4]} size={[.2,5.8,6.4]} color={wall}/>
  <Box position={[0,5.68,0]} size={[12,.17,11]} color={soft}/>
  <Box position={[0,.035,-.2]} size={[9.3,.025,7.8]} color={light?'#d6c7b4':'#686561'}/>
  {/* Sofa and coffee table */}
  <Box position={[1.1,.42,2.1]} size={[3.2,.6,1.28]} color={soft}/>
  <Box position={[1.1,.88,2.72]} size={[3.15,.65,.33]} color={soft}/>
  <Box position={[-.98,.46,1.55]} size={[1,.85,1.9]} color={soft}/>
  <Box position={[.8,.34,.05]} size={[2,.17,1.15]} color={dark} roughness={.2}/>
  <Box position={[.8,.16,.05]} size={[.16,.3,.16]} color="#bb9862" metalness={.7}/>
  <Box position={[-3.9,2.5,2.9]} size={[2.5,2.8,.08]} color={dark}/>
  <Box position={[-3.9,2.5,2.96]} size={[2.28,2.52,.04]} color="#a89577" roughness={.9}/>
  {/* Kitchen */}
  <Box position={[-3,1.15,-2.2]} size={[3.9,2.3,.85]} color={wall}/>
  <Box position={[-3,2.42,-2.15]} size={[3.8,.14,.9]} color={dark}/>
  <Box position={[-2.3,.78,-.75]} size={[2.7,1.25,1]} color={wall}/>
  <Box position={[-2.3,1.45,-.75]} size={[2.95,.13,1.18]} color={light?'#f1ede5':'#adb1ae'} roughness={.25}/>
  <Box position={[-2.75,1.87,-.65]} size={[.04,.68,.04]} color="#b99761" metalness={.9}/>
  <Box position={[-2.7,2.18,-.65]} size={[.48,.1,.1]} color="#b99761" metalness={.9}/>
  {/* Bedroom staged behind sculptural partition */}
  <Box position={[3.5,1.23,-2.65]} size={[2.65,.55,2.6]} color={soft}/>
  <Box position={[3.5,.86,-2.65]} size={[2.75,.7,2.75]} color={dark}/>
  <Box position={[3.5,1.4,-3.9]} size={[2.8,1.3,.3]} color={wall}/>
  <Box position={[2.8,1.61,-3.05]} size={[.9,.18,.55]} color="#eee8dc"/>
  <Box position={[4.15,1.61,-3.05]} size={[.9,.18,.55]} color="#eee8dc"/>
  {/* Balcony rail / open sky */}
  <Box position={[0,.65,-5.38]} size={[11.7,.08,.07]} color="#b99662" metalness={.85}/>
  <Box position={[0,.28,-5.38]} size={[11.7,.58,.04]} color="#8cabb8" roughness={.05} metalness={.55}/>
  {skyline.map((b,i)=><Box key={i} position={[b.x,b.h/2-2.3,b.depth]} size={[.5+(i%3)*.11,b.h,.52]} color={i%2===0?'#536879':'#7c7771'} roughness={.2} metalness={.45}/>)}
  <mesh position={[0,-2,-14]}><planeGeometry args={[70,40]}/><meshBasicMaterial color="#98a9b0"/></mesh>
  <pointLight position={[0,4,1]} intensity={30} color="#ffe9cb" distance={14}/>
  <pointLight position={[-3,4,-1]} intensity={17} color="#ffe2b2" distance={10}/>
  <directionalLight position={[1,9,6]} intensity={3.2} color="#fff1d6"/>
 </group>;
}
function CameraRig({room,reduced}:{room:Room;reduced:boolean}){
 const { position,target }=rooms.find(r=>r.id===room)!;
 const look=useRef(new THREE.Vector3(...target));
 useFrame(({camera,pointer,clock},delta)=>{
  const speed=reduced?12:1.65;
  const dest=new THREE.Vector3(...position);
  if(!reduced){dest.x+=pointer.x*.32;dest.y+=pointer.y*.14+Math.sin(clock.elapsedTime*.32)*.045;}
  camera.position.lerp(dest,1-Math.exp(-delta*speed));
  look.current.lerp(new THREE.Vector3(...target),1-Math.exp(-delta*speed));
  camera.lookAt(look.current);
 });
 return null;
}
export default function ResidenceExperience(){
 const [room,setRoom]=useState<Room>('living'); const [floor,setFloor]=useState(24); const [finish,setFinish]=useState<Finish>('sand'); const [reduced,setReduced]=useState(false);const [webgl,setWebgl]=useState(true);
 const [guided,setGuided]=useState(false); const [tourProgress,setTourProgress]=useState(0); const [planOpen,setPlanOpen]=useState(false);
 useEffect(()=>{if(!guided)return; const interval=window.setInterval(()=>setTourProgress(prev=>{const next=prev+0.1/TOUR_SECONDS; if(next>=1){setGuided(false);return 0;}setRoom(rooms[Math.min(rooms.length-1,Math.floor(next*rooms.length))].id);return next;}),100);return ()=>window.clearInterval(interval)},[guided]);
 const startTour=()=>{setTourProgress(0);setRoom('living');setGuided(true)};
 const chooseRoom=(id:Room)=>{setGuided(false);setRoom(id);setTourProgress(0)};
 useEffect(()=>{setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);try{const canvas=document.createElement('canvas');setWebgl(!!(canvas.getContext('webgl2')||canvas.getContext('webgl')));}catch{setWebgl(false)}},[]);
 const selected=rooms.find(r=>r.id===room)!;
 const index=rooms.findIndex(r=>r.id===room);
 const cycle=(step:number)=>chooseRoom(rooms[(index+step+rooms.length)%rooms.length].id);
 return <div className="residence-experience">
  <div className="residence-stage">
   {webgl?<Canvas shadows={false} dpr={[1,1.5]} camera={{position:[7.8,4.2,8.5],fov:43,near:.1,far:90}} gl={{antialias:true,powerPreference:'high-performance'}} fallback={<div className="residence-no-webgl">3D preview is unavailable on this device.</div>}><color attach="background" args={['#9caeb7']}/><ambientLight intensity={2.1}/><hemisphereLight args={['#f8f3e8','#4e626b',2.3]}/><Suspense fallback={null}><Residence finish={finish} floor={floor}/></Suspense><CameraRig room={room} reduced={reduced}/></Canvas>:<div className="residence-no-webgl">3D preview unavailable. Explore the room descriptions and controls below.</div>}
   <div className="residence-hotspots" aria-label="Quick room navigation">{rooms.map((r,i)=><button key={r.id} type="button" className={room===r.id?'active':''} onClick={()=>chooseRoom(r.id)} aria-label={'View '+r.name}><span>{String(i+1).padStart(2,'0')}</span><span>{r.name}</span></button>)}</div>
   <div className="residence-watermark">CONCEPT RESIDENCE / NOT AN ACTUAL LISTING</div>
   <div className="residence-view-tag"><Eye size={15}/> {selected.name.toUpperCase()}</div>
   <div className="residence-arrows"><button type="button" onClick={()=>cycle(-1)} aria-label="Previous space"><ArrowLeft size={19}/></button><button type="button" onClick={()=>cycle(1)} aria-label="Next space"><ArrowRight size={19}/></button></div>
  </div>
  <aside className="residence-controls">
   <p className="eyebrow">INTERACTIVE ARCHITECTURAL CONCEPT</p>
   <h2>Step inside <em>the extraordinary.</em></h2>
   <p className="residence-intro">Explore a conceptual Dubai-inspired home. Tap a room hotspot, open the floor plan, or take a guided cinematic walkthrough.</p>
   <div className="tour-primary-actions"><button className="tour-play" type="button" onClick={()=>guided?setGuided(false):startTour()}>{guided?<Pause size={17}/>:<Play size={17}/>} {guided?'Pause guided tour':'Start guided tour'}</button><button className="tour-plan-toggle" type="button" onClick={()=>setPlanOpen(!planOpen)} aria-expanded={planOpen}><Map size={17}/>{planOpen?'Hide floor plan':'Floor plan'}</button></div>
   {guided&&<div className="tour-progress" role="progressbar" aria-valuenow={Math.round(tourProgress*100)} aria-valuemin={0} aria-valuemax={100} aria-label="Guided tour progress"><span style={{width:`${tourProgress*100}%`}}/></div>}
   {planOpen&&<div className="tour-floorplan"><div className="tour-plan-header"><span>CONCEPT PLAN · NOT TO SCALE</span><MousePointer2 size={14}/></div><div className="tour-plan-canvas" role="group" aria-label="Select a room on the conceptual floor plan"><svg viewBox="0 0 300 200" aria-hidden="true"><rect x="20" y="16" width="260" height="167" rx="3" fill="#1e3037" stroke="#c8ad81" strokeWidth="2"/><path d="M20 74H124V16 M124 74H280 M180 74V183 M20 140H180 M180 110H280" fill="none" stroke="#8f9d9d" strokeWidth="3"/><path d="M112 74h24M180 100v20M180 140v26" fill="none" stroke="#1e3037" strokeWidth="5"/><rect x="21" y="17" width="258" height="18" fill="#796544" fillOpacity=".55"/></svg>{rooms.map((r,i)=><button type="button" key={r.id} className={room===r.id?'selected':''} style={{left:`${roomPoints[r.id].x}%`,top:`${roomPoints[r.id].y}%`}} onClick={()=>chooseRoom(r.id)} aria-label={'Navigate to '+r.name} title={r.name}>{i+1}</button>)}</div><p>Tap numbered points to move the 3D camera.</p></div>}
   <div className="residence-control-block"><div className="residence-control-label"><Layers3 size={16}/> SELECT A FLOOR <span>CONCEPT ONLY</span></div><div className="residence-floor-options">{[12,24,32].map(f=><button type="button" aria-pressed={floor===f} className={floor===f?'selected':''} onClick={()=>setFloor(f)} key={f}>L{f}</button>)}</div></div>
   <div className="residence-control-block"><div className="residence-control-label"><Eye size={16}/> EXPLORE SPACES</div><div className="residence-room-options">{rooms.map((r,i)=><button type="button" key={r.id} aria-pressed={room===r.id} className={room===r.id?'selected':''} onClick={()=>chooseRoom(r.id)}><span>0{i+1}</span>{r.name}</button>)}</div><p className="residence-detail">{selected.detail}</p></div>
   <div className="residence-control-block"><div className="residence-control-label"><Sun size={16}/> MATERIAL PALETTE</div><div className="residence-finish-options"><button type="button" aria-pressed={finish==='sand'} className={finish==='sand'?'selected':''} onClick={()=>setFinish('sand')}><i style={{background:'#d8c9b6'}}/> Warm sand</button><button type="button" aria-pressed={finish==='graphite'} className={finish==='graphite'?'selected':''} onClick={()=>setFinish('graphite')}><i style={{background:'#464c51'}}/> Graphite</button></div></div>
   <button type="button" className="residence-reset" onClick={()=>{chooseRoom('living');setFloor(24);setFinish('sand');setPlanOpen(false)}}><RotateCcw size={14}/> Reset experience</button>
   <Link href="/properties" className="button button-gold residence-cta">EXPLORE ACTUAL LISTINGS <ArrowRight size={17}/></Link>
   <p className="tour-status"><CheckCircle2 size={14}/> All tour views are illustrative, not real units.</p><p className="residence-disclaimer">Visual demonstration only. Floors, interiors, balconies, dimensions, materials and views are illustrative, not claims about an available property. No VR headset or sound required.</p>
  </aside>
 </div>;
}
