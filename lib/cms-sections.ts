import {CMS_PAGES,type CmsField} from './cms-schema';

// Visual studio registry: each CMS page is split into the website sections an
// editor recognises, mirroring how the public page is laid out top to bottom.
export type StudioSection={id:string;page:string;pageName:string;path:string;name:string;kind:'content'|'seo';fields:CmsField[]};
export type FieldGroup={id:string;fields:CmsField[]};

const NAMES:Record<string,string>={
 'home.hero':'Hero','home.story':'3D Story','home.collection':'Collection','home.services':'Services','home.areas':'Communities','home.team':'Leadership','home.tour':'3D Tour',
 'about.about':'About Story','about.leadership':'Leadership','contact.contact':'Contact Intro',
 page:'Page Intro',guide:'Guide',privacy:'Privacy Policy',
 'site.header':'Logo & Favicon','site.business':'Business Details','site.footer':'Footer','site.social':'Social Links','site.nav':'Menu','site.leadership':'Leadership'
};
// The homepage leadership names live under the team block on the website.
const MERGE:Record<string,string>={'home.leadership':'home.team'};

const title=(s:string)=>s.replace(/[-_]/g,' ').replace(/\b\w/g,c=>c.toUpperCase());

export const STUDIO_SECTIONS:StudioSection[]=CMS_PAGES.flatMap(page=>{
 const groups=new Map<string,CmsField[]>();
 for(const f of page.fields){
  const head=f.key.split('.')[0];
  const id=MERGE[page.slug+'.'+head]??page.slug+'.'+head;
  groups.set(id,[...(groups.get(id)??[]),f]);
 }
 const content=[...groups].map(([id,fields])=>{
  const head=id.slice(page.slug.length+1);
  return {id,page:page.slug,pageName:page.name,path:page.path,name:NAMES[id]??NAMES[head]??title(head),kind:'content' as const,fields};
 });
 return [...content,{id:page.slug+'.seo',page:page.slug,pageName:page.name,path:page.path,name:'SEO',kind:'seo' as const,fields:[]}];
});

// Repeated blocks (story.0.*, services.buy.*, nav.about + nav.about.href) render as cards.
export function splitGroups(fields:CmsField[]):{top:CmsField[];cards:FieldGroup[]}{
 const prefix=(f:CmsField)=>f.key.split('.').slice(0,2).join('.');
 const counts=new Map<string,number>();
 for(const f of fields)if(f.key.split('.').length>=2)counts.set(prefix(f),(counts.get(prefix(f))??0)+1);
 const top:CmsField[]=[],cards=new Map<string,CmsField[]>();
 for(const f of fields){
  const p=prefix(f);
  if((counts.get(p)??0)>=2&&f.key.split('.').length>=2)cards.set(p,[...(cards.get(p)??[]),f]);
  else top.push(f);
 }
 return {top,cards:[...cards].map(([id,fs])=>({id,fields:fs}))};
}

export type FieldRole='image'|'alt'|'link'|'heading'|'button'|'paragraph'|'text';
export function fieldRole(f:CmsField):FieldRole{
 if(f.type==='image')return 'image';
 if(f.type==='link')return 'link';
 if(/(\.alt\d*|_alt)$/.test(f.key)||/description$/i.test(f.label)&&/image|logo/i.test(f.label))return 'alt';
 if(f.type==='textarea')return 'paragraph';
 if(/(title|heading|name)$/.test(f.key))return 'heading';
 if(/(cta|label)$/.test(f.key)||/button/i.test(f.label))return 'button';
 return 'text';
}

// Image field -> its alt-text field, so a library image brings its description along.
export const ALT_FOR:Record<string,string>={
 'hero.image':'hero.alt1','hero.image2':'hero.alt2','hero.image3':'hero.alt3',
 'services.image':'services.alt','about.image':'about.alt',
 'areas.0.image':'areas.0.alt','areas.1.image':'areas.1.alt','areas.2.image':'areas.2.alt',
 'header.logo':'header.logo_alt'
};

// Current public values, read from the live page's data-cms-* markers, so the
// studio shows real website copy wherever no CMS override has been saved yet.
export function readLiveValues(html:string):Record<string,string>{
 const doc=new DOMParser().parseFromString(html,'text/html'),out:Record<string,string>={};
 doc.querySelectorAll<HTMLElement>('[data-cms-field]').forEach(el=>{const k=el.dataset.cmsField!;if(!(k in out))out[k]=(el.textContent||'').trim()});
 doc.querySelectorAll<HTMLElement>('[data-cms-image]').forEach(el=>{
  const k=el.dataset.cmsImage!;if(k in out)return;
  const src=el.getAttribute('src')||'';
  const m=src.match(/^\/_next\/image\?url=([^&]+)/);
  out[k]=m?decodeURIComponent(m[1]):src;
  const alt=ALT_FOR[k];if(alt&&!(alt in out)&&el.getAttribute('alt'))out[alt]=el.getAttribute('alt')!;
 });
 return out;
}
