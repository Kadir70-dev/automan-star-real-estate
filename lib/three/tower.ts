import * as THREE from 'three';

/**
 * Procedural concept tower used by the home page scroll story.
 * Original design, built at believable scale (1 unit = 10 m, 3.8 m floor-to-floor).
 * It does not depict a real, listed or planned building.
 */

type P = { x: number; z: number };
type Tier = { floors: number; w: number; d: number; c: number };

export const FLOOR = 0.38;
const PANEL = 0.31;
const PODIUM_TOP = 1.46;
const TIERS: Tier[] = [
  { floors: 20, w: 4.2, d: 3.0, c: 0.55 },
  { floors: 13, w: 3.6, d: 2.6, c: 0.45 },
  { floors: 8, w: 3.0, d: 2.2, c: 0.38 },
];

/** Deterministic PRNG so the model looks identical on every load. */
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function outline(w: number, d: number, c: number, grow = 0): P[] {
  const x = w / 2 + grow, z = d / 2 + grow, k = c + grow * 0.414;
  return [
    { x: -x + k, z: -z }, { x: x - k, z: -z }, { x, z: -z + k }, { x, z: z - k },
    { x: x - k, z }, { x: -x + k, z }, { x: -x, z: z - k }, { x: -x, z: -z + k },
  ];
}

function prism(points: P[], height: number) {
  const shape = new THREE.Shape(points.map((p) => new THREE.Vector2(p.x, -p.z)));
  const geo = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2);
  return geo;
}

type Slot = { x: number; z: number; nx: number; nz: number; width: number };
function sample(points: P[], size: number) {
  const slots: Slot[] = [];
  const edges: P[] = [];
  points.forEach((a, i) => {
    const b = points[(i + 1) % points.length];
    const dx = b.x - a.x, dz = b.z - a.z, len = Math.hypot(dx, dz);
    let nx = dz / len, nz = -dx / len;
    const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2;
    if (nx * mx + nz * mz < 0) { nx = -nx; nz = -nz; }
    const n = Math.max(1, Math.round(len / size));
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / n;
      slots.push({ x: a.x + dx * t, z: a.z + dz * t, nx, nz, width: len / n });
      const e = k / n;
      edges.push({ x: a.x + dx * e + nx * 0.02, z: a.z + dz * e + nz * 0.02 });
    }
  });
  return { slots, edges };
}

/** Adds world-space floor lines and mullions so plain boxes read as glazed towers in the haze. */
export function facadeShader(material: THREE.MeshPhysicalMaterial, scale = 1) {
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vFacadePos;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vec4 facadeWorld = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          facadeWorld = instanceMatrix * facadeWorld;
        #endif
        vFacadePos = (modelMatrix * facadeWorld).xyz;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vFacadePos;\nfloat facadeBand;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        float gy = vFacadePos.y / ${(FLOOR).toFixed(2)} / ${scale.toFixed(1)};
        float fy = fract(gy);
        float aa = clamp(fwidth(gy) * 1.6, 0.0, 1.0);
        facadeBand = mix(smoothstep(0.0, 0.05, fy) * (1.0 - smoothstep(0.78, 0.84, fy)), 0.8, aa);
        float gx = (vFacadePos.x + vFacadePos.z) / ${(0.62).toFixed(2)} / ${scale.toFixed(1)};
        float mull = step(0.92, fract(gx)) * (1.0 - clamp(fwidth(gx) * 1.6, 0.0, 1.0));
        diffuseColor.rgb *= mix(1.9, 0.9, facadeBand) * (1.0 + mull * 0.5);`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = mix(0.75, roughnessFactor, facadeBand);`);
  };
  return material;
}

/** City blocks and roads on the ground plane, so the plain does not read as an empty table top. */
function groundShader(material: THREE.MeshStandardMaterial) {
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vGround;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGround = (modelMatrix * vec4(transformed, 1.0)).xz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vGround;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        vec2 cell = abs(fract((vGround + 7.0) / 14.0) - 0.5) * 14.0;
        float road = 1.0 - step(5.9, max(cell.x, cell.y));
        float block = 1.0 - smoothstep(4.6, 5.2, max(cell.x, cell.y));
        diffuseColor.rgb *= mix(0.8, 1.0, road) * mix(1.0, 1.05, block);`);
  };
  return material;
}

export type TowerMaterials = ReturnType<typeof createMaterials>;
export function createMaterials() {
  return {
    glass: new THREE.MeshPhysicalMaterial({ color: '#22303a', metalness: 0.18, roughness: 0.045, transparent: true, opacity: 0.9, envMapIntensity: 1.7, clearcoat: 1, clearcoatRoughness: 0.03, reflectivity: 0.6 }),
    core: new THREE.MeshStandardMaterial({ color: '#0c1114', roughness: 0.9 }),
    alu: new THREE.MeshStandardMaterial({ color: '#5f5c57', metalness: 0.75, roughness: 0.38, envMapIntensity: 0.9 }),
    spandrel: new THREE.MeshStandardMaterial({ color: '#4f514f', metalness: 0.55, roughness: 0.45 }),
    stone: new THREE.MeshStandardMaterial({ color: '#a69c8d', roughness: 0.84, envMapIntensity: 0.55 }),
    plaza: new THREE.MeshStandardMaterial({ color: '#6c675f', roughness: 0.9, envMapIntensity: 0.4 }),
    paving: groundShader(new THREE.MeshStandardMaterial({ color: '#4a4741', roughness: 0.96, envMapIntensity: 0.35 })),
    water: new THREE.MeshPhysicalMaterial({ color: '#081217', metalness: 0.1, roughness: 0.02, clearcoat: 1, envMapIntensity: 1.6 }),
    planting: new THREE.MeshStandardMaterial({ color: '#36412d', roughness: 0.95 }),
    warm: new THREE.MeshBasicMaterial({ color: new THREE.Color('#c98a4e'), toneMapped: true }),
    context: facadeShader(new THREE.MeshPhysicalMaterial({ color: '#2b353c', roughness: 0.16, metalness: 0.25, clearcoat: 0.6, envMapIntensity: 1.1 })),
  };
}

const dummy = new THREE.Object3D();

function curtainWall(group: THREE.Group, m: TowerMaterials, tier: Tier, y0: number, rand: () => number) {
  const height = tier.floors * FLOOR;
  const pts = outline(tier.w, tier.d, tier.c);
  const { slots, edges } = sample(pts, PANEL);

  // Dark interior volume, read through the glass.
  const core = new THREE.Mesh(prism(outline(tier.w, tier.d, tier.c, -0.1), height), m.core);
  core.position.y = y0; core.castShadow = true; core.receiveShadow = true;
  group.add(core);

  // Glass: one instance per panel per floor, with tiny angle and tint variation
  // (real unitised curtain walls never reflect as one perfect mirror).
  const glass = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), m.glass, slots.length * tier.floors);
  const lit: THREE.Matrix4[] = [];
  const color = new THREE.Color();
  let i = 0;
  for (let f = 0; f < tier.floors; f++) {
    for (const s of slots) {
      const yaw = Math.atan2(s.nx, s.nz);
      dummy.position.set(s.x, y0 + f * FLOOR + FLOOR / 2, s.z);
      dummy.rotation.set((rand() - 0.5) * 0.012, yaw + (rand() - 0.5) * 0.012, 0);
      dummy.scale.set(s.width - 0.012, FLOOR - 0.05, 1);
      dummy.updateMatrix();
      glass.setMatrixAt(i, dummy.matrix);
      color.setScalar(0.9 + rand() * 0.16);
      glass.setColorAt(i, color);
      if (rand() < 0.045) {
        dummy.position.set(s.x - s.nx * 0.07, dummy.position.y, s.z - s.nz * 0.07);
        dummy.rotation.set(0, yaw, 0);
        dummy.scale.set(s.width * 0.9, FLOOR * 0.62, 1);
        dummy.updateMatrix();
        lit.push(dummy.matrix.clone());
      }
      i++;
    }
  }
  glass.instanceMatrix.needsUpdate = true;
  group.add(glass);

  if (lit.length) {
    const glow = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), m.warm, lit.length);
    lit.forEach((mat, k) => glow.setMatrixAt(k, mat));
    group.add(glow);
  }

  // Vertical mullions run the full height of each tier.
  const mullions = new THREE.InstancedMesh(new THREE.BoxGeometry(0.024, 1, 0.055), m.alu, edges.length);
  edges.forEach((e, k) => {
    dummy.position.set(e.x, y0 + height / 2, e.z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, height, 1);
    dummy.updateMatrix();
    mullions.setMatrixAt(k, dummy.matrix);
  });
  mullions.castShadow = true;
  group.add(mullions);

  // Spandrel band at every slab edge.
  const bandGeo = prism(outline(tier.w, tier.d, tier.c, 0.03), 0.045);
  const bands = new THREE.InstancedMesh(bandGeo, m.spandrel, tier.floors + 1);
  for (let f = 0; f <= tier.floors; f++) {
    dummy.position.set(0, y0 + f * FLOOR - 0.022, 0);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    bands.setMatrixAt(f, dummy.matrix);
  }
  bands.castShadow = true; bands.receiveShadow = true;
  group.add(bands);

  // Setback terrace slab with a glass balustrade line.
  const roof = new THREE.Mesh(prism(outline(tier.w, tier.d, tier.c, 0.06), 0.08), m.spandrel);
  roof.position.y = y0 + height; roof.castShadow = true; roof.receiveShadow = true;
  group.add(roof);
  return { top: y0 + height + 0.08, pts };
}

function crown(group: THREE.Group, m: TowerMaterials, tier: Tier, y0: number) {
  const { slots } = sample(outline(tier.w, tier.d, tier.c, 0.05), PANEL / 2);
  const fins = new THREE.InstancedMesh(new THREE.BoxGeometry(0.022, 1, 0.12), m.alu, slots.length);
  const h = 1.1;
  slots.forEach((s, k) => {
    dummy.position.set(s.x, y0 + h / 2, s.z);
    dummy.lookAt(dummy.position.x + s.nx, dummy.position.y, dummy.position.z + s.nz);
    dummy.scale.set(1, h, 1);
    dummy.updateMatrix();
    fins.setMatrixAt(k, dummy.matrix);
  });
  fins.castShadow = true;
  group.add(fins);
  const plant = new THREE.Mesh(prism(outline(tier.w - 0.2, tier.d - 0.2, tier.c), h - 0.08), m.glass);
  plant.position.y = y0;
  group.add(plant);
  const ring = new THREE.Mesh(prism(outline(tier.w, tier.d, tier.c, 0.09), 0.05), m.alu);
  ring.position.y = y0 + h;
  group.add(ring);
}

function podium(group: THREE.Group, m: TowerMaterials) {
  const lobbyH = 0.55;
  const lobby = new THREE.Mesh(prism(outline(6.3, 4.5, 0.5), lobbyH), m.glass);
  group.add(lobby);
  const lobbyCore = new THREE.Mesh(prism(outline(6.0, 4.2, 0.45), lobbyH), m.core);
  group.add(lobbyCore);
  const upper = new THREE.Mesh(prism(outline(7.2, 5.4, 0.6), PODIUM_TOP - lobbyH), m.stone);
  upper.position.y = lobbyH; upper.castShadow = true; upper.receiveShadow = true;
  group.add(upper);

  // Stone piers under the cantilevered podium edge.
  const { slots } = sample(outline(6.9, 5.1, 0.55), 0.9);
  const piers = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, lobbyH, 0.16), m.stone, slots.length);
  slots.forEach((s, k) => { dummy.position.set(s.x, lobbyH / 2, s.z); dummy.rotation.set(0, Math.atan2(s.nx, s.nz), 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); piers.setMatrixAt(k, dummy.matrix); });
  piers.castShadow = true;
  group.add(piers);

  // Horizontal reveals give the stone podium its scale.
  for (let k = 1; k <= 3; k++) {
    const reveal = new THREE.Mesh(prism(outline(7.24, 5.44, 0.61), 0.012), m.core);
    reveal.position.y = lobbyH + k * ((PODIUM_TOP - lobbyH) / 4);
    group.add(reveal);
  }
  // Roof garden on the podium.
  for (const [x, z, w, d] of [[-2.7, 1.7, 1.1, 1.3], [2.7, 1.7, 1.1, 1.3], [-2.7, -1.7, 1.1, 1.3], [2.7, -1.7, 1.1, 1.3]]) {
    const bed = new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, d), m.planting);
    bed.position.set(x, PODIUM_TOP + 0.06, z); bed.castShadow = true;
    group.add(bed);
  }
}

function site(group: THREE.Group, m: TowerMaterials, rand: () => number) {
  const ground = new THREE.Mesh(new THREE.CircleGeometry(900, 48), m.paving);
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
  group.add(ground);
  const plaza = new THREE.Mesh(new THREE.BoxGeometry(16, 0.04, 13), m.plaza);
  plaza.position.y = 0.02; plaza.receiveShadow = true;
  group.add(plaza);
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 1.7), m.water);
  pool.rotation.x = -Math.PI / 2; pool.position.set(0, 0.045, 4.6);
  group.add(pool);

  // Distant massing: silhouettes only, kept out of the camera path.
  const count = 150;
  const city = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), m.context, count);
  for (let k = 0; k < count; k++) {
    const angle = Math.PI * (0.36 + rand() * 1.28);
    const radius = 48 + Math.pow(rand(), 0.8) * 150;
    const h = 4 + Math.pow(rand(), 1.5) * (radius > 90 ? 26 : 14);
    const w = 1.8 + rand() * 2.4;
    dummy.position.set(Math.sin(angle) * radius, h / 2, Math.cos(angle) * radius);
    dummy.rotation.set(0, rand() * Math.PI, 0);
    dummy.scale.set(w, h, w * (0.7 + rand() * 0.6));
    dummy.updateMatrix();
    city.setMatrixAt(k, dummy.matrix);
  }
  city.receiveShadow = true;
  group.add(city);
}

export function buildTower() {
  const rand = rng(20261023);
  const m = createMaterials();
  const group = new THREE.Group();
  site(group, m, rand);
  podium(group, m);
  let y = PODIUM_TOP;
  TIERS.forEach((tier) => { y = curtainWall(group, m, tier, y, rand).top; });
  crown(group, m, TIERS[TIERS.length - 1], y);
  group.updateMatrixWorld(true);
  return {
    group,
    height: y + 1.1,
    dispose() {
      group.traverse((o) => { if ((o as THREE.Mesh).geometry) (o as THREE.Mesh).geometry.dispose(); });
      Object.values(m).forEach((mat) => mat.dispose());
    },
  };
}


/** Dusk sky dome. Horizon colour doubles as the fog colour so ground and sky meet without a seam. */
export const HORIZON = new THREE.Color('#8e8886');
const GLOW = new THREE.Color('#e4b98c');
export const SUN_DIR = new THREE.Vector3(-34, 20, 20).normalize();
export function buildSky() {
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      zenith: { value: new THREE.Color('#16263a') },
      mid: { value: new THREE.Color('#6c7787') },
      horizon: { value: HORIZON },
      glow: { value: GLOW },
      sunDir: { value: SUN_DIR },
    },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform vec3 zenith; uniform vec3 mid; uniform vec3 horizon; uniform vec3 glow; uniform vec3 sunDir; varying vec3 vDir;
      void main(){
        float h = vDir.y;
        vec3 col = mix(glow, mid, smoothstep(0.015, 0.22, h));
        col = mix(col, zenith, smoothstep(0.22, 0.8, h));
        col = mix(col, horizon, 1.0 - smoothstep(-0.015, 0.075, h));
        float s = max(dot(normalize(vDir), sunDir), 0.0);
        col += vec3(1.0, 0.72, 0.42) * (pow(s, 6.0) * 0.32 + pow(s, 600.0) * 3.0);
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(500, 48, 24), material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;
  return mesh;
}
