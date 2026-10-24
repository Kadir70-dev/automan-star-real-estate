export type DemoLead={id:string;name:string;email:string;phone?:string;property:string;message:string;status:string;createdAt:string;source:string};
export type DemoVisit={id:string;name:string;email:string;property:string;date:string;time:string;status:string};
export type DemoProperty={id:string;title:string;community:string;price:number;status:string};
const prefix='automan-phase1-';
export function readDemo<T>(key:string,initial:T):T {if(typeof window==='undefined')return initial;try{return JSON.parse(localStorage.getItem(prefix+key)||'null')??initial}catch{return initial}}
export function writeDemo<T>(key:string,value:T){if(typeof window!=='undefined'){localStorage.setItem(prefix+key,JSON.stringify(value));window.dispatchEvent(new Event('automan-demo-update'))}}
export const seedLeads:DemoLead[]=[{id:'DEMO-101',name:'Aisha Khan (sample)',email:'aisha@example.com',property:'Skyline Penthouse',message:'Interested in a viewing',status:'New',createdAt:'2026-10-12',source:'Website'},{id:'DEMO-102',name:'Omar Malik (sample)',email:'omar@example.com',property:'Waterfront Residence',message:'Looking for investment options',status:'Contacted',createdAt:'2026-10-11',source:'Website'}];
export const seedVisits:DemoVisit[]=[{id:'VIS-001',name:'Aisha Khan (sample)',email:'aisha@example.com',property:'Skyline Penthouse',date:'2026-11-03',time:'11:00',status:'Requested'}];
