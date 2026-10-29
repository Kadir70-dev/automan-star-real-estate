import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

const story = readFileSync(new URL('../components/ArchitecturalStory.tsx',import.meta.url),'utf8');
const entrance = readFileSync(new URL('../components/EntranceDoor.tsx',import.meta.url),'utf8');
const layout = readFileSync(new URL('../app/layout.tsx',import.meta.url),'utf8');
const css = readFileSync(new URL('../app/entrance-door.css',import.meta.url),'utf8');

test('entrance interactions cannot trigger the 3D scene preload',()=>{
 const start=story.indexOf("const events = ['scroll', 'wheel', 'pointerdown', 'keydown', 'touchstart']");
 const end=story.indexOf('// Mount the canvas',start);
 assert.ok(start>=0&&end>start,'interaction listener block exists');
 const listeners=story.slice(start,end);
 assert.match(listeners,/document\.querySelector\('\[data-automan-entrance\]'\)/);
 assert.match(listeners,/if\s*\(document\.querySelector\('\[data-automan-entrance\]'\)\)\s*return/);
 assert.match(listeners,/addEventListener\(e,\s*go,\s*\{\s*passive:\s*true\s*\}\)/,'guarded events must not use once:true');
});

test('return visits and reduced motion hide the foyer before hydration',()=>{
 assert.match(layout,/doorBootstrap/);
 assert.match(layout,/suppressHydrationWarning/);
 assert.match(layout,/prefers-reduced-motion: reduce/);
 assert.match(layout,/automan-door-entrance-v1/);
 assert.match(entrance,/data-automan-door-skip/);
 assert.match(css,/html\[data-automan-door-skip="1"\] \.as-entrance\{display:none!important\}/);
});

test('entrance does not occlude door opening with headline',()=>{
 assert.match(css,/\.as-entrance--walking \.as-entrance-message/);
 assert.match(css,/opacity:0/);
 assert.match(entrance,/child\.inert=true/);
 assert.match(entrance,/el\.inert=previous/);
});
