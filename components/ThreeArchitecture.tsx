'use client';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import { buildSky, buildTower, HORIZON, SUN_DIR } from '@/lib/three/tower';

/** CC0 sky from Poly Haven ("Belfast Sunset (Pure Sky)", Greg Zaal / Dimitrios Savva / Jarod Guest). */
const HDR_URL = '/hdr/belfast_sunset_puresky_1k.hdr';

/** Camera keyframes in cylindrical coordinates around the tower axis: radius, azimuth (rad), camera height, look-at height, fov. */
export const SHOTS = [
  { r: 47, a: 0.66, y: 6, look: 8.6, fov: 30 },
  { r: 22, a: -0.7, y: 14.5, look: 12.6, fov: 30 },
  { r: 10.5, a: 0.5, y: 15.4, look: 16.6, fov: 34 },
];

const smooth = (e0: number, e1: number, x: number) => { const t = THREE.MathUtils.clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };

/** Maps 0..1 scroll progress to a shot blend that holds on each keyframe while its text is read. */
export function shotAt(progress: number) {
  const s = THREE.MathUtils.clamp(progress, 0, 1) * (SHOTS.length - 1);
  const seg = Math.min(SHOTS.length - 2, Math.floor(s));
  const t = smooth(0.18, 0.82, s - seg);
  const A = SHOTS[seg], B = SHOTS[seg + 1];
  const lerp = THREE.MathUtils.lerp;
  return { r: lerp(A.r, B.r, t), a: lerp(A.a, B.a, t), y: lerp(A.y, B.y, t), look: lerp(A.look, B.look, t), fov: lerp(A.fov, B.fov, t) };
}

function Scene({ progress, onReady, interactive }: { progress: RefObject<number>; onReady?: () => void; interactive: boolean }) {
  const { gl, scene, camera, pointer, invalidate, size } = useThree();
  const tower = useMemo(() => buildTower(), []);
  const sky = useMemo(() => buildSky(), []);
  const fog = useMemo(() => new THREE.FogExp2(HORIZON.getHex(), 0.0085), []);
  const sun = useMemo(() => SUN_DIR.clone().multiplyScalar(45), []);
  const state = useRef(shotAt(progress.current ?? 0));
  const look = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => () => { tower.dispose(); sky.geometry.dispose(); (sky.material as THREE.Material).dispose(); }, [tower, sky]);

  useEffect(() => {
    let disposed = false;
    let texture: THREE.DataTexture | null = null;
    new HDRLoader().load(HDR_URL, (tex) => {
      if (disposed) { tex.dispose(); return; }
      texture = tex;
      tex.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = tex;
      scene.environmentIntensity = 0.8;
      scene.environmentRotation.set(0, -0.9, 0);
      gl.shadowMap.needsUpdate = true;
      invalidate();
      requestAnimationFrame(() => onReady?.());
    }, undefined, () => onReady?.());
    return () => {
      disposed = true;
      scene.environment = null;
      texture?.dispose();
    };
  }, [gl, scene, invalidate, onReady]);

  useEffect(() => {
    // The building and sun never move, so the shadow map is rendered once.
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
  }, [gl]);

  useFrame((_, delta) => {
    const target = shotAt(progress.current ?? 0);
    const s = state.current, k = Math.min(1, delta);
    const lambda = 5.5;
    s.r = THREE.MathUtils.damp(s.r, target.r, lambda, k);
    s.a = THREE.MathUtils.damp(s.a, target.a + (interactive ? pointer.x * 0.035 : 0), lambda * 0.6, k);
    s.y = THREE.MathUtils.damp(s.y, target.y + (interactive ? pointer.y * 0.25 : 0), lambda * 0.6, k);
    s.look = THREE.MathUtils.damp(s.look, target.look, lambda, k);
    s.fov = THREE.MathUtils.damp(s.fov, target.fov, lambda, k);
    const cam = camera as THREE.PerspectiveCamera;
    cam.position.set(Math.sin(s.a) * s.r, s.y, Math.cos(s.a) * s.r);
    look.set(0, s.look, 0);
    cam.lookAt(look);
    // Frame the tower off-centre: right of the copy on wide screens, above it on phones.
    const wide = size.width >= 800;
    const ox = wide ? -size.width * 0.17 : 0, oy = wide ? 0 : size.height * 0.14;
    const view = cam.view;
    if (!view || view.offsetX !== ox || view.offsetY !== oy || view.fullWidth !== size.width || view.fullHeight !== size.height) cam.setViewOffset(size.width, size.height, ox, oy, size.width, size.height);
    if (Math.abs(cam.fov - s.fov) > 0.001) { cam.fov = s.fov; cam.updateProjectionMatrix(); }
  });

  return <>
    <hemisphereLight args={['#c9d3dd', '#2c2a28', 0.3]} />
    <directionalLight
      position={sun} intensity={3.2} color="#ffcf9a" castShadow
      shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-bias={-0.0004} shadow-normalBias={0.02}
      shadow-camera-left={-22} shadow-camera-right={22} shadow-camera-top={26} shadow-camera-bottom={-22} shadow-camera-near={5} shadow-camera-far={120}
    />
    <primitive object={fog} attach="fog" />
    <primitive object={sky} />
    <primitive object={tower.group} />
  </>;
}

export default function ThreeArchitecture({ progress, active, onReady, interactive = true, lowPower = false }: { progress: RefObject<number>; active: boolean; onReady?: () => void; interactive?: boolean; lowPower?: boolean }) {
  return <Canvas
    frameloop={active ? 'always' : 'never'}
    shadows="soft"
    dpr={lowPower ? [1, 1.25] : [1, 1.75]}
    camera={{ position: [25, 6.5, 31], fov: 30, near: 0.5, far: 1400 }}
    gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.95 }}
    style={{ width: '100%', height: '100%' }}
    aria-hidden="true"
  >
    <Scene progress={progress} onReady={onReady} interactive={interactive} />
  </Canvas>;
}
