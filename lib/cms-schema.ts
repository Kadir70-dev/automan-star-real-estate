export type CmsField={key:string;label:string;type?:'text'|'textarea'|'image'|'link'};
export type CmsPageDef={slug:string;name:string;path:string;fields:CmsField[]};
export const CMS_PAGES:CmsPageDef[]=[
 {slug:'home',name:'Homepage',path:'/',fields:[
  {key:'hero.title',label:'Hero heading'},{key:'hero.description',label:'Hero description',type:'textarea'},
  {key:'hero.image',label:'Hero slide image URL',type:'image'},
  {key:'collection.title',label:'Collection heading'},{key:'collection.note',label:'Concept listing notice',type:'textarea'},
  {key:'services.title',label:'Services heading'},{key:'services.image',label:'Services image URL',type:'image'},
  {key:'areas.title',label:'Communities heading'}, {key:'team.title',label:'Team heading'},
  {key:'tour.title',label:'3D tour heading'},{key:'tour.description',label:'3D tour description',type:'textarea'}]},
 {slug:'about',name:'About Us',path:'/about',fields:[
  {key:'about.heading',label:'Page heading'},{key:'about.image',label:'About image URL',type:'image'},
  {key:'about.title',label:'Story heading'},{key:'about.copy',label:'Company story',type:'textarea'},
  {key:'about.leadership_title',label:'Leadership heading'}]},
 {slug:'contact',name:'Contact',path:'/contact',fields:[
  {key:'contact.heading',label:'Page heading'}, {key:'contact.copy',label:'Introduction',type:'textarea'},
  {key:'contact.form_heading',label:'Form heading'}]},
 {slug:'buy',name:'Buy',path:'/buy',fields:[{key:'page.heading',label:'Page heading'},{key:'page.copy',label:'Intro text',type:'textarea'}]},
 {slug:'off-plan',name:'Off-plan',path:'/off-plan',fields:[{key:'page.heading',label:'Page heading'},{key:'page.copy',label:'Intro text',type:'textarea'}]},
 {slug:'commercial',name:'Commercial',path:'/commercial',fields:[{key:'page.heading',label:'Page heading'},{key:'page.copy',label:'Intro text',type:'textarea'}]},
 {slug:'properties',name:'Properties',path:'/properties',fields:[]},
 {slug:'experience',name:'3D Experience',path:'/experience',fields:[{key:'page.heading',label:'Page heading'},{key:'page.copy',label:'Intro text',type:'textarea'}]},
 {slug:'privacy',name:'Privacy Policy',path:'/privacy',fields:[]},
 {slug:'site',name:'Global Settings',path:'/',fields:[
  {key:'footer.heading',label:'Footer lead heading'},
  {key:'footer.email',label:'Contact email'},
  {key:'header.logo',label:'Header logo URL',type:'image'}]}
];
