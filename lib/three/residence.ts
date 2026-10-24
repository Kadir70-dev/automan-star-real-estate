import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { marbleTexture, oakTexture, plasterTexture, weaveTexture } from './textures';
import { facadeShader } from './tower';

/**
 * Concept apartment for /experience. Units are metres: 14 m x 10 m plan, 3.2 m ceilings,
 * floor-to-ceiling glazing on the north side and a 2.6 m deep terrace. Illustrative only.
 */

export type Finish = 'sand' | 'graphite';
export type Room = 'living' | 'kitchen' | 'bedroom' | 'terrace';

const PALETTE: Record<Finish, { wall: string; ceiling: string; floor: string; joinery: string; fabric: string; metal: string; accent: string }> = {
  sand: { wall: '#e6ded2', ceiling: '#f3f0ea', floor: '#ffffff', joinery: '#d9cfc1', fabric: '#d3c8b8', metal: '#b48f58', accent: '#8a6f55' },
  graphite: { wall: '#5d5f5f', ceiling: '#46494a', floor: '#8b7c6b', joinery: '#2f3335', fabric: '#6e6a65', metal: '#a7a7a3', accent: '#3d3f40' },
};

/** Eye-level camera positions (1.6 m) and look targets for each room. `via` is a doorway waypoint. */
export const SHOTS: Record<Room, { pos: [number, number, number]; look: [number, number, number]; via?: [number, number, number]; anchor: [number, number, number] }> = {
  living: { pos: [-1.6, 1.6, 4.3], look: [1.2, 1.15, -5], anchor: [0.2, 1.2, 0.4] },
  kitchen: { pos: [-0.6, 1.62, 1.6], look: [-5.6, 0.95, -1.2], anchor: [-3.4, 1.4, -1.6] },
  bedroom: { pos: [3.7, 1.62, -3.9], look: [6.4, 0.7, 1.2], via: [2.0, 1.6, -2.4], anchor: [4.4, 1.4, -3.2] },
  terrace: { pos: [-0.4, 1.62, -6.3], look: [2.6, 0.5, -24], via: [-0.7, 1.6, -4.0], anchor: [1.6, 1.3, -6.6] },
};

export const FLOORS = { 12: 46, 24: 91, 32: 122 } as const;

type Mats = ReturnType<typeof materials>;
function materials(f: Finish) {
  const p = PALETTE[f];
  return {
    wall: new THREE.MeshStandardMaterial({ color: p.wall, map: plasterTexture([3, 1]), roughness: 0.92 }),
    ceiling: new THREE.MeshStandardMaterial({ color: p.ceiling, roughness: 0.95 }),
    floor: new THREE.MeshStandardMaterial({ color: p.floor, map: oakTexture([14 / 1.6, 10 / 1.6]), roughness: 0.55, envMapIntensity: 0.6 }),
    joinery: new THREE.MeshStandardMaterial({ color: p.joinery, roughness: 0.6 }),
    marble: new THREE.MeshPhysicalMaterial({ color: '#ffffff', map: marbleTexture(), roughness: 0.18, clearcoat: 0.5, clearcoatRoughness: 0.2 }),
    fabric: new THREE.MeshPhysicalMaterial({ color: p.fabric, map: weaveTexture([4, 4]), roughness: 0.95, sheen: 1, sheenRoughness: 0.6, sheenColor: new THREE.Color('#ffffff') }),
    linen: new THREE.MeshPhysicalMaterial({ color: '#f1ece4', roughness: 0.9, sheen: 0.6, sheenColor: new THREE.Color('#ffffff') }),
    rug: new THREE.MeshStandardMaterial({ color: f === 'sand' ? '#8e8173' : '#2c2e30', map: weaveTexture([10, 7]), roughness: 1 }),
    metal: new THREE.MeshStandardMaterial({ color: p.metal, metalness: 1, roughness: 0.32 }),
    dark: new THREE.MeshStandardMaterial({ color: '#1b1d1e', metalness: 0.4, roughness: 0.45 }),
    accent: new THREE.MeshStandardMaterial({ color: p.accent, roughness: 0.7 }),
    ceramic: new THREE.MeshPhysicalMaterial({ color: '#d9d2c6', roughness: 0.4, clearcoat: 0.4 }),
    glass: new THREE.MeshPhysicalMaterial({ color: '#dfe8ec', roughness: 0.02, metalness: 0, transparent: true, opacity: 0.12, envMapIntensity: 1.2, depthWrite: false }),
    stone: new THREE.MeshStandardMaterial({ color: '#b3aa9c', roughness: 0.85 }),
    planting: new THREE.MeshStandardMaterial({ color: '#4c5a3c', roughness: 1 }),
    light: new THREE.MeshBasicMaterial({ color: '#fff1d9' }),
    city: facadeShader(new THREE.MeshPhysicalMaterial({ color: '#2b353c', roughness: 0.16, metalness: 0.25, clearcoat: 0.6, envMapIntensity: 1.1 }), 10),
    ground: new THREE.MeshStandardMaterial({ color: '#6d665d', roughness: 1 }),
  };
}

function add(group: THREE.Group, geo: THREE.BufferGeometry, mat: THREE.Material, pos: [number, number, number], rotY = 0, shadow = true) {
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(...pos);
  mesh.rotation.y = rotY;
  mesh.castShadow = shadow; mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}
const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
const soft = (w: number, h: number, d: number, r = 0.05) => new RoundedBoxGeometry(w, h, d, 3, r);

function shell(g: THREE.Group, m: Mats) {
  const H = 3.2;
  add(g, box(14, 0.2, 10), m.floor, [0, -0.1, 0], 0, false);
  add(g, box(14, 0.12, 10.4), m.ceiling, [0, H + 0.06, -0.2], 0, true);
  add(g, box(0.2, H, 10), m.wall, [-7.1, H / 2, 0]);
  add(g, box(0.2, H, 10), m.wall, [7.1, H / 2, 0]);
  add(g, box(14.4, H, 0.2), m.wall, [0, H / 2, 5.1]);
  // Bedroom partition with a wide pocket-door opening toward the window.
  add(g, box(0.14, H, 4.8), m.wall, [3, H / 2, 2.6]);
  add(g, box(0.14, 0.4, 5.2), m.wall, [3, H - 0.2, -2.4]);
  // Ceiling cove light lines.
  for (const x of [-4.5, 0, 4.9]) add(g, box(0.06, 0.02, 7.6), m.light, [x, H - 0.005, 0.2], 0, false);

  // North glazing: 1.4 m modules, one open sliding bay to the terrace.
  for (let x = -7; x <= 7.001; x += 1.4) add(g, box(0.06, H, 0.12), m.dark, [x, H / 2, -5]);
  add(g, box(14, 0.08, 0.14), m.dark, [0, H - 0.04, -5]);
  add(g, box(14, 0.05, 0.14), m.dark, [0, 0.025, -5]);
  for (let x = -6.3; x < 7; x += 1.4) {
    if (x > -1.5 && x < 0) continue;
    const pane = add(g, new THREE.PlaneGeometry(1.34, H - 0.1), m.glass, [x, H / 2, -5], 0, false);
    pane.receiveShadow = false;
  }
  add(g, new THREE.PlaneGeometry(1.34, H - 0.1), m.glass, [-2.05, H / 2, -5.08], 0, false);
}

function kitchen(g: THREE.Group, m: Mats) {
  add(g, box(0.65, 0.88, 6), m.joinery, [-6.68, 0.44, -0.5]);
  add(g, box(0.7, 0.04, 6.05), m.marble, [-6.65, 0.9, -0.5]);
  add(g, box(0.02, 1.1, 6), m.marble, [-6.99, 1.47, -0.5]);
  add(g, box(0.4, 0.03, 4.2), m.joinery, [-6.8, 2.2, -0.5]);
  add(g, box(0.62, 2.6, 1.2), m.joinery, [-6.69, 1.3, 3.3]);
  // Island with waterfall ends.
  add(g, box(0.9, 0.86, 2.7), m.joinery, [-4.1, 0.43, -0.5]);
  add(g, box(1.1, 0.05, 2.9), m.marble, [-4.1, 0.885, -0.5]);
  for (const z of [-1.93, 0.93]) add(g, box(1.1, 0.86, 0.05), m.marble, [-4.1, 0.43, z]);
  for (const z of [-1.3, -0.5, 0.3]) {
    add(g, new THREE.CylinderGeometry(0.2, 0.2, 0.06, 28), m.fabric, [-3.2, 0.68, z]);
    add(g, new THREE.CylinderGeometry(0.018, 0.018, 0.65, 10), m.metal, [-3.2, 0.33, z]);
    add(g, new THREE.CylinderGeometry(0.17, 0.17, 0.015, 24), m.metal, [-3.2, 0.008, z]);
    add(g, new THREE.CylinderGeometry(0.005, 0.005, 0.85, 6), m.dark, [-4.1, 2.77, z], 0, false);
    add(g, new THREE.CylinderGeometry(0.09, 0.13, 0.22, 24, 1, true), m.metal, [-4.1, 2.25, z], 0, false);
    add(g, new THREE.CircleGeometry(0.12, 20), m.light, [-4.1, 2.14, z], 0, false).rotation.x = Math.PI / 2;
  }
}

function lathe(points: [number, number][]) {
  return new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), 32);
}

function living(g: THREE.Group, m: Mats) {
  add(g, soft(4.4, 0.02, 3.2, 0.01), m.rug, [0.2, 0.011, -0.2], 0, false);
  // Sofa facing the view.
  add(g, soft(3.2, 0.4, 1.05, 0.06), m.fabric, [0.2, 0.22, 1.55]);
  add(g, soft(3.2, 0.5, 0.26, 0.08), m.fabric, [0.2, 0.62, 1.98]);
  for (const x of [-1.42, 1.82]) add(g, soft(0.26, 0.62, 1.05, 0.08), m.fabric, [x, 0.31, 1.55]);
  for (const x of [-0.58, 0.98]) add(g, soft(1.52, 0.16, 0.86, 0.07), m.fabric, [x, 0.49, 1.5]);
  // Stone coffee table and ceramics.
  add(g, soft(1.4, 0.34, 0.8, 0.03), m.marble, [0.2, 0.17, 0.1]);
  add(g, lathe([[0, 0], [0.07, 0], [0.1, 0.08], [0.08, 0.2], [0.04, 0.28], [0.045, 0.3], [0, 0.3]]), m.ceramic, [-0.1, 0.34, 0.15]);
  add(g, lathe([[0, 0], [0.12, 0], [0.14, 0.04], [0.13, 0.08], [0, 0.08]]), m.accent, [0.5, 0.34, 0.0]);
  // Lounge chair angled to the window.
  add(g, soft(0.9, 0.38, 0.9, 0.08), m.fabric, [2.35, 0.24, -0.9], -0.7);
  add(g, soft(0.9, 0.5, 0.22, 0.08), m.fabric, [2.62, 0.58, -0.62], -0.7);
  // Floor lamp.
  add(g, new THREE.CylinderGeometry(0.16, 0.16, 0.02, 24), m.metal, [-2.1, 0.01, 0.6]);
  add(g, new THREE.CylinderGeometry(0.012, 0.012, 1.55, 8), m.metal, [-2.1, 0.78, 0.6]);
  add(g, new THREE.CylinderGeometry(0.2, 0.24, 0.3, 28, 1, true), m.linen, [-2.1, 1.62, 0.6], 0, false);
  // Credenza against the partition.
  add(g, box(0.45, 0.6, 2.4), m.joinery, [2.7, 0.3, 2.9]);
  add(g, box(0.47, 0.03, 2.42), m.marble, [2.7, 0.615, 2.9]);
}

function bedroom(g: THREE.Group, m: Mats) {
  add(g, box(0.12, 1.15, 2.4), m.fabric, [6.93, 0.78, -0.6]);
  add(g, box(2.15, 0.3, 2.0), m.joinery, [5.85, 0.15, -0.6]);
  add(g, soft(2.05, 0.26, 1.9, 0.08), m.linen, [5.85, 0.43, -0.6]);
  add(g, soft(1.3, 0.08, 1.98, 0.04), m.fabric, [5.1, 0.58, -0.6]);
  for (const z of [-1.1, -0.1]) add(g, soft(0.36, 0.16, 0.7, 0.07), m.linen, [6.6, 0.64, z]);
  for (const z of [-2.15, 0.95]) {
    add(g, box(0.5, 0.5, 0.45), m.joinery, [6.6, 0.25, z]);
    add(g, lathe([[0, 0], [0.08, 0], [0.1, 0.12], [0.06, 0.3], [0, 0.3]]), m.ceramic, [6.6, 0.5, z]);
    add(g, new THREE.CylinderGeometry(0.11, 0.13, 0.16, 20, 1, true), m.linen, [6.6, 0.88, z], 0, false);
  }
  add(g, soft(0.45, 0.42, 1.5, 0.04), m.fabric, [4.5, 0.21, -0.6]);
}

function terrace(g: THREE.Group, m: Mats) {
  add(g, box(14.4, 0.12, 2.8), m.stone, [0, -0.06, -6.45], 0, false);
  add(g, box(14.4, 0.04, 0.06), m.metal, [0, 1.1, -7.8]);
  add(g, new THREE.PlaneGeometry(14.4, 1.06), m.glass, [0, 0.55, -7.8], 0, false);
  add(g, box(14.4, 0.22, 2.8), m.stone, [0, 3.31, -6.45], 0, false);
  for (const x of [2.6, 4.2]) {
    add(g, soft(0.75, 0.3, 1.9, 0.06), m.linen, [x, 0.3, -6.3]);
    add(g, soft(0.75, 0.42, 0.5, 0.06), m.linen, [x, 0.55, -7.05]);
  }
  for (const x of [-6.2, 6.2]) {
    add(g, box(1.2, 0.6, 0.9), m.stone, [x, 0.3, -7.2]);
    add(g, soft(1.1, 0.25, 0.8, 0.12), m.planting, [x, 0.66, -7.2]);
  }
}

/** Skyline and ground below the apartment; re-positioned when the selected floor changes. */
function outside(m: Mats) {
  const group = new THREE.Group();
  let seed = 42;
  const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const ground = new THREE.Mesh(new THREE.CircleGeometry(4000, 48), m.ground);
  ground.rotation.x = -Math.PI / 2;
  group.add(ground);
  const count = 220;
  const city = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), m.city, count);
  const d = new THREE.Object3D();
  for (let k = 0; k < count; k++) {
    const a = rand() * Math.PI * 2;
    const r = 140 + Math.pow(rand(), 0.7) * 1500;
    const h = 30 + Math.pow(rand(), 1.8) * 230;
    const w = 22 + rand() * 30;
    d.position.set(Math.sin(a) * r, h / 2, Math.cos(a) * r - 120);
    d.rotation.set(0, rand() * Math.PI, 0);
    d.scale.set(w, h, w * (0.7 + rand() * 0.6));
    d.updateMatrix();
    city.setMatrixAt(k, d.matrix);
  }
  group.add(city);
  return group;
}

export function buildResidence(finish: Finish) {
  const m = materials(finish);
  const group = new THREE.Group();
  shell(group, m); kitchen(group, m); living(group, m); bedroom(group, m); terrace(group, m);
  const view = outside(m);
  group.add(view);
  return {
    group,
    setFloor(level: keyof typeof FLOORS) { view.position.y = -FLOORS[level]; },
    dispose() {
      group.traverse((o) => { const mesh = o as THREE.Mesh; if (mesh.geometry) mesh.geometry.dispose(); });
      Object.values(m).forEach((mat) => { (mat as THREE.MeshStandardMaterial).map?.dispose(); mat.dispose(); });
    },
  };
}
