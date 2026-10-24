import * as THREE from 'three';

/** Small procedural textures (no downloads): oak planks, veined stone and plaster. Deterministic per seed. */
function rng(seed: number) {
  return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
}

function canvas(size: number) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return { c, g: c.getContext('2d')! };
}

function finish(c: HTMLCanvasElement, repeat: [number, number], srgb = true) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** 1.6 m x 1.6 m tile of 200 mm wide oak boards with staggered joints. */
export function oakTexture(repeat: [number, number]) {
  const size = 1024, rand = rng(11);
  const { c, g } = canvas(size);
  const boards = 8, bw = size / boards;
  for (let b = 0; b < boards; b++) {
    const offset = rand() * size;
    for (const start of [offset - size, offset]) {
      const tone = 0.86 + rand() * 0.22;
      const r = Math.round(176 * tone), gg = Math.round(138 * tone), bb = Math.round(98 * tone);
      g.fillStyle = `rgb(${r},${gg},${bb})`;
      g.fillRect(b * bw, start, bw, size);
      for (let k = 0; k < 46; k++) {
        const x = b * bw + rand() * bw;
        g.strokeStyle = `rgba(${rand() < 0.5 ? '90,62,38' : '214,180,140'},${0.05 + rand() * 0.09})`;
        g.lineWidth = 0.6 + rand() * 1.6;
        g.beginPath();
        g.moveTo(x, start);
        g.bezierCurveTo(x + (rand() - 0.5) * 10, start + size * 0.33, x + (rand() - 0.5) * 10, start + size * 0.66, x + (rand() - 0.5) * 6, start + size);
        g.stroke();
      }
      g.fillStyle = 'rgba(60,40,25,.55)';
      g.fillRect(b * bw, start, bw, 2);
    }
    g.fillStyle = 'rgba(55,38,24,.45)';
    g.fillRect(b * bw, 0, 1.5, size);
  }
  return finish(c, repeat);
}

/** Pale stone with soft grey veining, used for counters, the island and the coffee table. */
export function marbleTexture(repeat: [number, number] = [1, 1]) {
  const size = 1024, rand = rng(29);
  const { c, g } = canvas(size);
  g.fillStyle = '#ece8e1';
  g.fillRect(0, 0, size, size);
  g.filter = 'blur(2px)';
  for (let k = 0; k < 24; k++) {
    g.strokeStyle = `rgba(${120 + rand() * 40},${118 + rand() * 30},${112 + rand() * 30},${0.08 + rand() * 0.22})`;
    g.lineWidth = 0.8 + rand() * 4;
    g.beginPath();
    let x = rand() * size, y = -20;
    g.moveTo(x, y);
    while (y < size + 20) {
      const nx = x + (rand() - 0.35) * 140, ny = y + 40 + rand() * 120;
      g.quadraticCurveTo(x + (rand() - 0.5) * 80, (y + ny) / 2, nx, ny);
      x = nx; y = ny;
    }
    g.stroke();
  }
  g.filter = 'none';
  return finish(c, repeat);
}

/** Near-white mottled plaster; tinted by the material colour so it works for both finishes. */
export function plasterTexture(repeat: [number, number]) {
  const size = 512, rand = rng(7);
  const { c, g } = canvas(size);
  g.fillStyle = '#f4f4f4';
  g.fillRect(0, 0, size, size);
  for (let k = 0; k < 2600; k++) {
    const v = 225 + Math.round(rand() * 30);
    g.fillStyle = `rgba(${v},${v},${v},${0.18 + rand() * 0.25})`;
    const r = 2 + rand() * 14;
    g.beginPath(); g.arc(rand() * size, rand() * size, r, 0, Math.PI * 2); g.fill();
  }
  return finish(c, repeat);
}

/** Woven texture for the rug and upholstery. */
export function weaveTexture(repeat: [number, number]) {
  const size = 256, rand = rng(3);
  const { c, g } = canvas(size);
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 4) for (let x = 0; x < size; x += 4) {
    const v = 200 + Math.round(rand() * 55);
    g.fillStyle = `rgb(${v},${v},${v})`;
    g.fillRect(x, y, (x / 4 + y / 4) % 2 ? 4 : 3, 3);
  }
  return finish(c, repeat);
}
