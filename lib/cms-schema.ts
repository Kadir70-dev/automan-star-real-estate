export type CmsField={key:string;label:string;type?:'text'|'textarea'|'image'|'link'};
export type CmsPageDef={slug:string;name:string;path:string;fields:CmsField[]};
const field=(key:string,label:string,type:CmsField['type']='text'):CmsField=>({key,label,type});
const home:CmsField[]=[
 field('hero.title','Hero headline'),field('hero.description','Hero description','textarea'),
 field('hero.image','Hero first image','image'),field('hero.alt1','First image description'),
 field('hero.image2','Hero second image','image'),field('hero.alt2','Second image description'),
 field('hero.image3','Hero third image','image'),field('hero.alt3','Third image description'),
 field('hero.buy_cta','Browse properties button'),field('hero.contact_cta','Consultation button'),
 field('story.heading','3D story heading'),
 ...[0,1,2].flatMap(i=>[field('story.'+i+'.title','3D story chapter '+(i+1)+' title'),field('story.'+i+'.copy','3D story chapter '+(i+1)+' text','textarea')]),
 field('story.note','3D illustration disclosure','textarea'),
 field('collection.title','Collection heading'),field('collection.cta','Collection button'),field('collection.note','Concept listings disclosure','textarea'),
 field('services.title','Services heading'),field('services.image','Services image','image'),field('services.alt','Services image description'),
 ...[['buy','Ready homes'],['offplan','Off-plan'],['commercial','Commercial']].flatMap(([key,label])=>[field('services.'+key+'.title',label+' title'),field('services.'+key+'.copy',label+' description','textarea')]),
 field('areas.title','Communities heading'),
 ...['Downtown Dubai','Dubai Marina','Palm Jumeirah'].flatMap((name,i)=>[field('areas.'+i+'.title',name+' display name'),field('areas.'+i+'.image',name+' image','image'),field('areas.'+i+'.alt',name+' image description')]),
 field('team.image','Founder portrait','image'),field('team.alt','Founder portrait description'),
 field('leadership.0.name','Founder name'),field('leadership.0.role','Founder role'),field('team.cta','Founder button'),
 field('tour.title','3D tour heading'),field('tour.description','3D tour description','textarea'),field('tour.cta','3D tour button')
];
const guideFields:CmsField[]=[
 field('page.cta','Primary button'),field('page.cta.href','Primary button link','link'),
 field('guide.title','Guide heading'),field('guide.intro','Guide introduction','textarea'),
 ...[0,1,2].flatMap(i=>[field('guide.'+i+'.title','Guide item '+(i+1)+' heading'),field('guide.'+i+'.copy','Guide item '+(i+1)+' paragraph','textarea')]),
 field('guide.cta.lead','Guide closing text','textarea'),field('guide.cta.label','Guide link label'),field('guide.cta.href','Guide link destination','link')
];
export const CMS_PAGES:CmsPageDef[]=[
 {slug:'home',name:'Homepage',path:'/',fields:home},
 {slug:'about',name:'About Us',path:'/about',fields:[
  field('about.heading','Page heading'),field('about.image','About image','image'),field('about.alt','About image description'),field('about.title','Story heading'),
  field('about.copy','Company story','textarea'),field('about.secondary_copy','Second story paragraph','textarea'),field('about.cta','Contact button'),
  field('about.leadership_title','Leadership heading'),
  ...[0,1].flatMap(i=>[field('leadership.'+i+'.name','Leader '+(i+1)+' name'),field('leadership.'+i+'.role','Leader '+(i+1)+' role')])]},
 {slug:'contact',name:'Contact',path:'/contact',fields:[field('contact.heading','Page heading'),field('contact.copy','Introduction','textarea'),field('contact.form_heading','Form heading')]},
 {slug:'buy',name:'Buy',path:'/buy',fields:[field('page.heading','Page heading'),field('page.copy','Intro text','textarea'),...guideFields]},
 {slug:'off-plan',name:'Off-plan',path:'/off-plan',fields:[field('page.heading','Page heading'),field('page.copy','Intro text','textarea'),...guideFields]},
 {slug:'commercial',name:'Commercial',path:'/commercial',fields:[field('page.heading','Page heading'),field('page.copy','Intro text','textarea'),...guideFields]},
 {slug:'properties',name:'Properties',path:'/properties',fields:[field('page.heading','Listings heading'),field('page.copy','Listings description','textarea')]},
 {slug:'experience',name:'3D Experience',path:'/experience',fields:[field('page.heading','Page heading'),field('page.copy','Intro text','textarea')]},
 {slug:'privacy',name:'Privacy Policy',path:'/privacy',fields:[
  field('privacy.heading','Page heading'),field('privacy.updated','Last reviewed date'),
  ...[['collection','Information we collect'],['use','How we use it'],['storage','Where it is stored'],['retention','How long we keep it'],['browser','Browser storage'],['choices','Your choices']].flatMap(([key,label])=>[
   field('privacy.'+key+'.title',label+' heading'),field('privacy.'+key+'.copy',label+' paragraph','textarea')
  ])
 ]},
 {slug:'site',name:'Global Settings',path:'/',fields:[
  field('header.logo','Header logo URL','image'),field('header.logo_alt','Logo image description'),field('header.favicon','Favicon URL','image'),
  field('business.name','Business name'),field('business.address','Office address','textarea'),field('business.locality','Area / locality'),field('business.region','Emirate'),field('business.phone','Telephone'),
  field('footer.heading','Footer headline','textarea'),field('footer.cta','Footer button'),field('footer.cta.href','Footer button destination','link'),field('footer.email','Contact email'),
  field('social.linkedin','LinkedIn URL','link'),field('social.instagram','Instagram URL','link'),
  ...[['properties','Properties'],['buy','Buy'],['off-plan','Off-plan'],['commercial','Commercial'],['experience','3D residence'],['about','About'],['contact','Contact'],['privacy','Privacy Policy']].flatMap(([key,label])=>[field('nav.'+key,'Menu: '+label),field('nav.'+key+'.href','Menu link: '+label,'link')]),
  ...[0,1].flatMap(i=>[field('leadership.'+i+'.name','Leader '+(i+1)+' name'),field('leadership.'+i+'.role','Leader '+(i+1)+' role')])
 ]}
];
