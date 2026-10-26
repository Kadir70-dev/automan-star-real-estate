'use client';
import dynamic from 'next/dynamic';
import type {CmsDocument} from '@/lib/cms';
import { useCallback, useEffect, useRef, useState } from 'react';

const ThreeArchitecture = dynamic(() => import('./ThreeArchitecture'), { ssr: false });

const chapters = [
  { title: 'Start with the building.', copy: 'Location, developer and build quality shape how a property holds its value. We look at those first.' },
  { title: 'Then the floor and the view.', copy: 'Height, orientation and what is planned next door change the price, and how the home feels to live in.' },
  { title: 'Then the fine print.', copy: 'Finishes, service charges, payment plans and handover dates, checked with you before you commit.' },
];
const STILLS = ['/story/scene-1.webp', '/story/scene-2.webp', '/story/scene-3.webp'];

type Mode = 'pending' | 'webgl' | 'stills' | 'static';

function pickMode(): Mode {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'static';
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  if (nav.connection?.saveData || (nav.deviceMemory && nav.deviceMemory <= 2)) return 'stills';
  try {
    const c = document.createElement('canvas');
    if (!(c.getContext('webgl2') || c.getContext('webgl'))) return 'stills';
  } catch { return 'stills'; }
  return 'webgl';
}

export default function ArchitecturalStory({cms}:{cms?:CmsDocument}={}) {
  const content=chapters.map((chapter,i)=>({
   title:cms?.fields[`story.${i}.title`]??chapter.title,
   copy:cms?.fields[`story.${i}.copy`]??chapter.copy
  }));
  const section = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const copy = useRef<(HTMLLIElement | null)[]>([]);
  const stills = useRef<(HTMLDivElement | null)[]>([]);
  const ticks = useRef<(HTMLSpanElement | null)[]>([]);
  const [mode, setMode] = useState<Mode>('pending');
  const [near, setNear] = useState(false);
  const [engaged, setEngaged] = useState(false);
  const [inView, setInView] = useState(false);
  const [ready, setReady] = useState(false);
  const [lowPower, setLowPower] = useState(false);
  const onReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    setMode(pickMode());
    setLowPower(window.matchMedia('(pointer: coarse)').matches || (navigator.hardwareConcurrency || 8) <= 4);
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setMode(pickMode());
    m.addEventListener('change', change);
    return () => m.removeEventListener('change', change);
  }, []);

  // Keep the initial page load free of WebGL work: the stills underneath are
  // identical, so the canvas only builds after the visitor first interacts.
  useEffect(() => {
    if (mode !== 'webgl' || engaged) return;
    // The visitor may have scrolled before hydration attached the listeners.
    if (window.scrollY > 0) { setEngaged(true); return; }
    const events = ['scroll', 'wheel', 'pointerdown', 'keydown', 'touchstart'] as const;
    const go = () => setEngaged(true);
    events.forEach((e) => window.addEventListener(e, go, { passive: true, once: true }));
    return () => events.forEach((e) => window.removeEventListener(e, go));
  }, [mode, engaged]);

  // Mount the canvas shortly before the section arrives; render frames only while it is on screen.
  useEffect(() => {
    const el = section.current;
    if (!el || mode !== 'webgl') return;
    const preload = new IntersectionObserver(([e]) => { if (e.isIntersecting) setNear(true); }, { rootMargin: '900px 0px' });
    const visible = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: '80px 0px' });
    preload.observe(el); visible.observe(el);
    return () => { preload.disconnect(); visible.disconnect(); };
  }, [mode]);

  // One scroll-derived value drives the camera, the copy and the stills, so they cannot drift apart.
  useEffect(() => {
    const el = section.current;
    if (!el || mode === 'static' || mode === 'pending') return;
    let raf = 0;
    const last = chapters.length - 1;
    const apply = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight);
      const p = Math.min(1, Math.max(0, -rect.top / travel));
      progress.current = p;
      const s = p * last;
      const active = Math.round(s);
      chapters.forEach((_, i) => {
        const d = s - i;
        const o = Math.min(1, Math.max(0, 1 - (Math.abs(d) - 0.26) / 0.22));
        const item = copy.current[i];
        if (item) {
          item.style.opacity = String(o);
          item.style.transform = `translate3d(0, ${(Math.max(-1, Math.min(1, -d)) * 36).toFixed(1)}px, 0)`;
          item.style.visibility = o < 0.01 ? 'hidden' : 'visible';
        }
        const still = stills.current[i];
        if (still) still.style.opacity = String(Math.min(1, Math.max(0, 1 - (Math.abs(d) - 0.3) / 0.25)));
        ticks.current[i]?.classList.toggle('is-active', i === active);
      });
    };
    const request = () => { if (!raf) raf = requestAnimationFrame(apply); };
    apply();
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', request); window.removeEventListener('resize', request); };
  }, [mode]);

  return <section id="architecture-story" ref={section} className={`story story-${mode}`} aria-labelledby="story-title">
    <div className="story-pin">
      <div className="story-stills" aria-hidden="true">
        {STILLS.map((src, i) => <div key={src} ref={(n) => { stills.current[i] = n; }} className="story-still" style={{ backgroundImage: `url(${src})` }} />)}
      </div>
      {mode === 'webgl' && near && engaged && <div className={'story-canvas' + (ready ? ' is-ready' : '')}>
        <ThreeArchitecture progress={progress} active={inView} onReady={onReady} interactive={!lowPower} lowPower={lowPower} />
      </div>}
      <div className="story-shade" aria-hidden="true" />
      <div className="container story-overlay">
        <h2 id="story-title" className="story-heading" data-cms-field="story.heading">{cms?.fields['story.heading']??'How we assess a property'}</h2>
        <ol className="story-copy">
          {content.map((c, i) => <li key={i} ref={(n) => { copy.current[i] = n; }}>
            <div className="story-still-inline" aria-hidden="true" style={{ backgroundImage: `url(${STILLS[i]})` }} />
            <h3 data-cms-field={`story.${i}.title`}>{c.title}</h3>
            <p data-cms-field={`story.${i}.copy`}>{c.copy}</p>
          </li>)}
        </ol>
        <div className="story-rail" aria-hidden="true">{chapters.map((c, i) => <span key={c.title} ref={(n) => { ticks.current[i] = n; }} className={i === 0 ? 'is-active' : ''}>{i + 1}</span>)}</div>
      </div>
      <p className="story-note" data-cms-field="story.note">{cms?.fields['story.note']??'Concept model for illustration. Not a real or listed building.'}</p>
    </div>
  </section>;
}
