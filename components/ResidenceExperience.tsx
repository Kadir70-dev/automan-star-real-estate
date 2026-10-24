'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Pause, Play, RotateCcw } from 'lucide-react';
import type { Finish, Room } from '@/lib/three/residence';
import type { HotspotRefs } from './ResidenceCanvas';

const ResidenceCanvas = dynamic(() => import('./ResidenceCanvas'), { ssr: false });

const ROOMS: { id: Room; name: string; detail: string; plan: [number, number] }[] = [
  { id: 'living', name: 'Living room', detail: 'The sofa faces the glazing, so the view leads the room.', plan: [51, 64] },
  { id: 'kitchen', name: 'Kitchen', detail: 'Stone island with seating for three, and a tall pantry wall.', plan: [23, 57] },
  { id: 'bedroom', name: 'Bedroom suite', detail: 'Opens to the living area through wide pocket doors.', plan: [88, 56] },
  { id: 'terrace', name: 'Terrace', detail: 'A 2.6 m deep terrace behind a glass balustrade.', plan: [73, 14] },
];
const LEVELS = [12, 24, 32] as const;
type Level = (typeof LEVELS)[number];
const TOUR_MS = 6500;
type Status = 'checking' | 'loading' | 'ready' | 'unsupported';

export default function ResidenceExperience() {
  const [room, setRoom] = useState<Room>('living');
  const [level, setLevel] = useState<Level>(24);
  const [finish, setFinish] = useState<Finish>('sand');
  const [status, setStatus] = useState<Status>('checking');
  const [reduced, setReduced] = useState(false);
  const [interactive, setInteractive] = useState(true);
  const [touring, setTouring] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const hotspots = useRef<Partial<Record<Room, HTMLButtonElement | null>>>({});
  const index = ROOMS.findIndex((r) => r.id === room);
  const selected = ROOMS[index];

  useEffect(() => {
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setReduced(rm);
    setInteractive(!window.matchMedia('(pointer: coarse)').matches);
    try {
      const c = document.createElement('canvas');
      setStatus(c.getContext('webgl2') || c.getContext('webgl') ? 'loading' : 'unsupported');
    } catch { setStatus('unsupported'); }
  }, []);

  useEffect(() => {
    if (!touring) return;
    const t = window.setInterval(() => setRoom((r) => ROOMS[(ROOMS.findIndex((x) => x.id === r) + 1) % ROOMS.length].id), TOUR_MS);
    return () => window.clearInterval(t);
  }, [touring]);

  const onReady = useCallback(() => setStatus((s) => (s === 'unsupported' ? s : 'ready')), []);
  const onLost = useCallback(() => setStatus('unsupported'), []);
  const choose = (id: Room) => { setTouring(false); setRoom(id); };
  const step = (n: number) => choose(ROOMS[(index + n + ROOMS.length) % ROOMS.length].id);
  const reset = () => { setTouring(false); setRoom('living'); setLevel(24); setFinish('sand'); setPlanOpen(false); };

  return <div className="rx">
    <div className="rx-stage">
      {(status === 'loading' || status === 'ready') && <ResidenceCanvas room={room} finish={finish} level={level} reduced={reduced} interactive={interactive} hotspots={hotspots as HotspotRefs} onReady={onReady} onLost={onLost} />}
      {(status === 'checking' || status === 'loading') && <div className="rx-loading" role="status"><span className="rx-spinner" aria-hidden="true" />Loading the residence</div>}
      {status === 'unsupported' && <div className="rx-fallback">
        <p>3D isn’t available on this device, so here is the plan instead. Choose a room to read about it.</p>
        <Plan room={room} onChoose={choose} />
      </div>}
      {status === 'ready' && <div className="rx-hotspots">
        {ROOMS.map((r) => <button key={r.id} type="button" ref={(n) => { hotspots.current[r.id] = n; }} className="rx-hotspot" onClick={() => choose(r.id)} tabIndex={-1} aria-hidden="true"><span aria-hidden="true" />Go to {r.name.toLowerCase()}</button>)}
      </div>}
      <div className="rx-caption"><strong>{selected.name}</strong><span>Level {level}</span></div>
      <div className="rx-arrows">
        <button type="button" onClick={() => step(-1)} aria-label="Previous room"><ArrowLeft size={18} /></button>
        <button type="button" onClick={() => step(1)} aria-label="Next room"><ArrowRight size={18} /></button>
      </div>
      <p className="rx-mark">Concept residence. Not a real listing.</p>
    </div>

    <aside className="rx-panel" aria-label="Residence controls">
      <div aria-live="polite"><h2>{selected.name}</h2><p className="rx-detail">{selected.detail}</p></div>
      <fieldset><legend>Room</legend><div className="rx-options">{ROOMS.map((r) => <button key={r.id} type="button" aria-pressed={room === r.id} onClick={() => choose(r.id)}>{r.name}</button>)}</div></fieldset>
      <fieldset><legend>View from</legend><div className="rx-options">{LEVELS.map((l) => <button key={l} type="button" aria-pressed={level === l} onClick={() => setLevel(l)}>Level {l}</button>)}</div></fieldset>
      <fieldset><legend>Finish</legend><div className="rx-options">
        <button type="button" aria-pressed={finish === 'sand'} onClick={() => setFinish('sand')}><i style={{ background: '#e6ded2' }} aria-hidden="true" />Warm sand</button>
        <button type="button" aria-pressed={finish === 'graphite'} onClick={() => setFinish('graphite')}><i style={{ background: '#5d5f5f' }} aria-hidden="true" />Graphite</button>
      </div></fieldset>
      <div className="rx-actions">
        <button type="button" className="ds-btn ds-btn-sand" onClick={() => setTouring((t) => !t)} disabled={status === 'unsupported'}>{touring ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}{touring ? 'Pause tour' : 'Play guided tour'}</button>
        <button type="button" className="ds-btn rx-btn-quiet" aria-expanded={planOpen} onClick={() => setPlanOpen((o) => !o)}>{planOpen ? 'Hide plan' : 'Show plan'}</button>
      </div>
      {planOpen && status !== 'unsupported' && <Plan room={room} onChoose={choose} />}
      <button type="button" className="rx-reset" onClick={reset}><RotateCcw size={14} aria-hidden="true" /> Reset</button>
      <Link href="/properties" className="ds-link rx-cta">Browse real listings</Link>
      <p className="rx-disclaimer">Layout, finishes, dimensions and views are illustrative and do not describe an available property.</p>
    </aside>
  </div>;
}

function Plan({ room, onChoose }: { room: Room; onChoose: (r: Room) => void }) {
  return <div className="rx-plan">
    <svg viewBox="0 0 300 276" aria-hidden="true">
      <rect x="10" y="10" width="280" height="56" className="rx-plan-terrace" />
      <rect x="10" y="66" width="280" height="200" className="rx-plan-room" />
      <path d="M210 170V266M10 66H122M150 66H290" className="rx-plan-wall" />
      <path d="M30 98h12v116H30zM68 127h22v54H68z" className="rx-plan-fit" />
      <path d="M232 136h43v38h-43z" className="rx-plan-fit" />
      <path d="M110 192h88v22h-88z" className="rx-plan-fit" />
    </svg>
    {ROOMS.map((r, i) => <button key={r.id} type="button" style={{ left: `${r.plan[0]}%`, top: `${r.plan[1]}%` }} aria-pressed={room === r.id} onClick={() => onChoose(r.id)} aria-label={`Plan: ${r.name}`}>{i + 1}</button>)}
    <p>Plan not to scale.</p>
  </div>;
}
