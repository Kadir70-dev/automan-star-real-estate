'use client';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import { buildResidence, SHOTS, type Finish, type Room } from '@/lib/three/residence';

const HDR_URL = '/hdr/belfast_sunset_puresky_1k.hdr';
const ROOMS = Object.keys(SHOTS) as Room[];
/** Which hotspots can be seen from each room (walls hide the rest). */
const VISIBLE: Record<Room, Room[]> = { living: ['kitchen', 'terrace', 'bedroom'], kitchen: ['living', 'terrace'], bedroom: ['living', 'terrace'], terrace: ['living', 'bedroom'] };
type Level = 12 | 24 | 32;
export type HotspotRefs = RefObject<Partial<Record<Room, HTMLButtonElement | null>>>;

function Apartment({ finish, level, onReady, onLost }: { finish: Finish; level: Level; onReady: () => void; onLost: () => void }) {
  const { gl, scene, invalidate } = useThree();
  const residence = useMemo(() => buildResidence(finish), [finish]);
  useEffect(() => () => residence.dispose(), [residence]);
  useEffect(() => { residence.setFloor(level); gl.shadowMap.needsUpdate = true; invalidate(); }, [residence, level, gl, invalidate]);

  useEffect(() => {
    let disposed = false;
    let texture: THREE.DataTexture | null = null;
    new HDRLoader().load(HDR_URL, (tex) => {
      if (disposed) { tex.dispose(); return; }
      texture = tex;
      tex.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = tex; scene.background = tex;
      scene.environmentIntensity = 0.5; scene.backgroundIntensity = 1;
      scene.environmentRotation.set(0, 2.2, 0); scene.backgroundRotation.set(0, 2.2, 0);
      requestAnimationFrame(onReady);
    }, undefined, onReady);
    const canvas = gl.domElement;
    const lost = (e: Event) => { e.preventDefault(); onLost(); };
    canvas.addEventListener('webglcontextlost', lost);
    gl.shadowMap.autoUpdate = false;
    return () => { disposed = true; scene.environment = null; scene.background = null; texture?.dispose(); canvas.removeEventListener('webglcontextlost', lost); };
  }, [gl, scene, onReady, onLost]);

  return <primitive object={residence.group} />;
}

function Rig({ room, reduced, hotspots, interactive }: { room: Room; reduced: boolean; hotspots: HotspotRefs; interactive: boolean }) {
  const { camera, pointer, size } = useThree();
  const prev = useRef<Room>(room);
  const queue = useRef<THREE.Vector3[]>([]);
  const lookGoal = useRef(new THREE.Vector3(...SHOTS[room].look));
  const look = useRef(new THREE.Vector3(...SHOTS[room].look));
  const tmp = useMemo(() => ({ v: new THREE.Vector3() }), []);

  useEffect(() => {
    if (prev.current === room) return;
    const from = SHOTS[prev.current], to = SHOTS[room];
    const path = [from.via, to.via, to.pos].filter(Boolean) as [number, number, number][];
    queue.current = path.map((p) => new THREE.Vector3(...p));
    lookGoal.current.set(...to.look);
    prev.current = room;
    if (reduced) { camera.position.set(...to.pos); queue.current = []; look.current.copy(lookGoal.current); }
  }, [room, reduced, camera]);

  useFrame((_, delta) => {
    const k = Math.min(delta, 0.25);
    const target = queue.current[0];
    if (target) {
      const last = queue.current.length === 1;
      const lambda = last ? 2.4 : 3.4;
      camera.position.set(
        THREE.MathUtils.damp(camera.position.x, target.x, lambda, k),
        THREE.MathUtils.damp(camera.position.y, target.y, lambda, k),
        THREE.MathUtils.damp(camera.position.z, target.z, lambda, k),
      );
      if (!last && camera.position.distanceTo(target) < 0.7) queue.current.shift();
      if (last && camera.position.distanceTo(target) < 0.002) queue.current = [];
    }
    look.current.x = THREE.MathUtils.damp(look.current.x, lookGoal.current.x, 2.6, k);
    look.current.y = THREE.MathUtils.damp(look.current.y, lookGoal.current.y, 2.6, k);
    look.current.z = THREE.MathUtils.damp(look.current.z, lookGoal.current.z, 2.6, k);
    tmp.v.copy(look.current);
    if (interactive && !reduced) { tmp.v.x += pointer.x * 0.9; tmp.v.y += pointer.y * 0.45; }
    camera.lookAt(tmp.v);

    // Hotspots: project each reachable room's anchor into the stage; hide it while the camera is travelling.
    const settled = queue.current.length === 0;
    for (const r of ROOMS) {
      const el = hotspots.current?.[r];
      if (!el) continue;
      const anchor = tmp.v.set(...SHOTS[r].anchor).project(camera);
      const show = settled && VISIBLE[room].includes(r) && anchor.z < 1 && Math.abs(anchor.x) < 0.85 && Math.abs(anchor.y) < 0.8;
      el.style.transform = `translate3d(${((anchor.x + 1) / 2) * size.width}px, ${((1 - anchor.y) / 2) * size.height}px, 0) translate(-50%, -50%)`;
      el.style.opacity = show ? '1' : '0';
      el.tabIndex = show ? 0 : -1;
      el.setAttribute('aria-hidden', show ? 'false' : 'true');
    }
  });
  return null;
}

export default function ResidenceCanvas({ room, finish, level, reduced, interactive, hotspots, onReady, onLost }: {
  room: Room; finish: Finish; level: Level; reduced: boolean; interactive: boolean; hotspots: HotspotRefs; onReady: () => void; onLost: () => void;
}) {
  const start = SHOTS[room];
  return <Canvas
    shadows="soft"
    dpr={[1, 1.75]}
    camera={{ position: start.pos, fov: 52, near: 0.05, far: 6000 }}
    gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
    onCreated={({ camera }) => camera.lookAt(...start.look)}
    aria-hidden="true"
  >
    <hemisphereLight args={['#fff3e2', '#5b5046', 0.55]} />
    <directionalLight position={[-14, 10, -16]} intensity={3.2} color="#ffd29c" castShadow
      shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-bias={-0.0003} shadow-normalBias={0.03}
      shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={12} shadow-camera-bottom={-12} shadow-camera-near={1} shadow-camera-far={60} />
    <pointLight position={[0.2, 2.45, 0.4]} intensity={5} color="#ffe2bd" distance={10} decay={2} />
    <pointLight position={[-4.1, 2.5, -0.5]} intensity={5} color="#ffdcb0" distance={7} decay={2} />
    <pointLight position={[5.6, 2.45, -0.6]} intensity={4} color="#ffe2bd" distance={8} decay={2} />
    <fogExp2 attach="fog" args={['#b9aa9c', 0.0008]} />
    <Apartment finish={finish} level={level} onReady={onReady} onLost={onLost} />
    <Rig room={room} reduced={reduced} hotspots={hotspots} interactive={interactive} />
  </Canvas>;
}
