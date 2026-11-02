#!/usr/bin/env node
// One-off, idempotent migration of the Azizi Florence project (formerly hardcoded
// in lib/projects.ts) into the property database through the staff API, keeping
// the URL /properties/azizi-florence and all 9 photos (villa facade = cover).
//
// Usage:  node scripts/migrate-azizi-florence.mjs [--site https://automanstarrealty.com] [--publish]
// Credentials come from AUTOMAN_ADMIN_EMAIL / AUTOMAN_ADMIN_PASSWORD, or from a
// private env file named by AUTOMAN_ADMIN_ENV_FILE. They are never printed.
// Re-running is safe: an existing listing is reused (never duplicated) and only
// missing photos are uploaded.
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const args=process.argv.slice(2);
const opt=(name,fallback)=>{const i=args.indexOf(name);return i>=0?args[i+1]:fallback};
const SITE=(opt('--site','https://automanstarrealty.com')).replace(/\/$/,'');
const PUBLISH=args.includes('--publish');
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const IMAGE_DIR=opt('--images',path.join(ROOT,'public/projects/azizi-florence'));

const SLUG='azizi-florence';
const LISTING={
 slug:SLUG,reference_code:'AMS-AZIZI-FLORENCE',title:'Azizi Florence',developer:'Azizi Developments',
 emirate:'Sharjah',community:'Um Fanain',category:'villa',listing_type:'sale',construction_status:'off_plan',
 price_aed:2090000,price_from:true,community_size:'~30M sq. ft.',featured:true,
 bedrooms:null,bathrooms:null,area_sqft:null,permit_number:'',
 description:'Azizi Florence is a European-inspired residential community by Azizi Developments, spanning approximately 30 million sq. ft. in Um Fanain, Sharjah. It is planned around six residential clusters with landscaped gardens and green spaces, designed for a family-friendly lifestyle.',
 unit_mix:['Apartments','3 & 4 bedroom townhouses','4, 5 & 6 bedroom villas'],
 highlights:['1.7M sq. ft. central park','100+ lifestyle amenities','Walking, jogging and cycling tracks','Shopping and retail','Family recreation','Six residential clusters with landscaped gardens'],
 seo_title:'Azizi Florence Sharjah | Off-Plan from AED 2.09M',
 seo_description:'Azizi Florence by Azizi Developments, Um Fanain, Sharjah: off-plan apartments, 3-4BR townhouses and 4-6BR villas by a 1.7M sq. ft. park. From AED 2.09M.',
};
// Display order; the first photo becomes the cover.
const PHOTOS=[
 ['azizi-florence-villa-facade.webp','Azizi Florence villa exterior with landscaped front garden and water feature, Um Fanain, Sharjah'],
 ['azizi-florence-townhouse-streetscape.webp','Tree-lined street of contemporary townhouses at Azizi Florence'],
 ['azizi-florence-masterplan-aerial.webp','Aerial view of the Azizi Florence master plan with green corridors and residential clusters'],
 ['azizi-florence-contemporary-villa.webp','Three-storey contemporary villa with roof terrace and garden at Azizi Florence'],
 ['azizi-florence-garden-pool.webp','Private villa garden with plunge pool, fire pit and outdoor seating at Azizi Florence'],
 ['azizi-florence-double-height-living.webp','Double-height villa living room with marble floors and feature staircase at Azizi Florence'],
 ['azizi-florence-dining-room.webp','Open-plan dining and living area with crystal chandeliers at Azizi Florence'],
 ['azizi-florence-lounge.webp','Villa lounge with full-height windows and garden view at Azizi Florence'],
 ['azizi-florence-master-bedroom.webp','Master bedroom with upholstered bed and chandelier at Azizi Florence'],
];

async function credentials(){
 let email=process.env.AUTOMAN_ADMIN_EMAIL,password=process.env.AUTOMAN_ADMIN_PASSWORD;
 if((!email||!password)&&process.env.AUTOMAN_ADMIN_ENV_FILE){
  for(const line of (await readFile(process.env.AUTOMAN_ADMIN_ENV_FILE,'utf8')).split('\n')){
   const m=line.match(/^\s*(AUTOMAN_ADMIN_EMAIL|AUTOMAN_ADMIN_PASSWORD)\s*=\s*(.*?)\s*$/);
   if(m)m[1]==='AUTOMAN_ADMIN_EMAIL'?email=m[2]:password=m[2];
  }
 }
 if(!email||!password)throw new Error('Set AUTOMAN_ADMIN_EMAIL and AUTOMAN_ADMIN_PASSWORD (or AUTOMAN_ADMIN_ENV_FILE).');
 return {email,password};
}

let cookie='';
async function staff(p,init={}){
 const headers={...(init.body instanceof FormData?{}:{'Content-Type':'application/json'}),...(cookie?{Cookie:cookie}:{})};
 const res=await fetch(`${SITE}/api/staff/${p}`,{...init,headers});
 const set=res.headers.get('set-cookie');const m=set&&set.match(/automan_staff=([^;]+)/);if(m)cookie=`automan_staff=${m[1]}`;
 const body=await res.json().catch(()=>({}));
 if(!res.ok)throw new Error(`${init.method||'GET'} ${p} → ${res.status} ${body.error||''}`.trim());
 return body;
}

async function main(){
 const {email,password}=await credentials();
 const login=await staff('login',{method:'POST',body:JSON.stringify({email,password})});
 if(!['admin','manager'].includes(login.staff?.role))throw new Error('This account cannot manage listings.');
 console.log(`Signed in to ${SITE} as role "${login.staff.role}".`);

 const active=(await staff('properties')).data,trashed=(await staff('properties?view=trash')).data;
 if(trashed.some(p=>p.slug===SLUG))throw new Error('Azizi Florence is in the trash. Restore it in /admin/properties instead of migrating again.');
 const matches=active.filter(p=>p.slug===SLUG||p.title.trim().toLowerCase()==='azizi florence');
 if(matches.length>1)throw new Error(`Found ${matches.length} Azizi Florence listings already; resolve duplicates in /admin/properties first.`);
 let id=matches[0]?.id;
 if(id){console.log('Listing already exists — reusing it (no duplicate created).')}
 else{id=(await staff('properties',{method:'POST',body:JSON.stringify(LISTING)})).id;console.log('Created draft listing.')}

 const existing=(await staff(`properties/${id}/media`)).data;
 const have=new Set(existing.map(m=>m.alt_text));
 for(const [file,alt] of PHOTOS){
  if(have.has(alt)){console.log(`  skip (already uploaded): ${file}`);continue}
  const fd=new FormData();
  fd.append('file',new Blob([await readFile(path.join(IMAGE_DIR,file))],{type:'image/webp'}),file);
  fd.append('alt_text',alt);
  await staff(`properties/${id}/media`,{method:'POST',body:fd});
  console.log(`  uploaded: ${file}`);
 }
 const media=(await staff(`properties/${id}/media`)).data;
 const byAlt=new Map(media.map(m=>[m.alt_text,m]));
 const ordered=PHOTOS.map(([,alt])=>byAlt.get(alt)).filter(Boolean);
 if(ordered.length!==PHOTOS.length)throw new Error(`Expected ${PHOTOS.length} photos, found ${ordered.length}.`);
 for(const [i,m] of ordered.entries())if(m.sort_order!==i)await staff(`properties/${id}/media/${m.id}/order`,{method:'PATCH',body:JSON.stringify({sort_order:i})});
 if(!ordered[0].is_cover)await staff(`properties/${id}/media/${ordered[0].id}/cover`,{method:'PATCH'});
 console.log(`Photos: ${media.length} (cover: ${PHOTOS[0][0]}).`);

 if(PUBLISH){await staff(`properties/${id}/status`,{method:'PATCH',body:JSON.stringify({status:'published'})});console.log(`Published: ${SITE}/properties/${SLUG}`)}
 else console.log('Left as draft. Re-run with --publish (or press Publish in /admin/properties) to put it live.');
 await staff('logout',{method:'POST'}).catch(()=>{});
}
main().catch(e=>{console.error('Migration failed:',e.message);process.exit(1)});
