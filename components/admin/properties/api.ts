// Browser-side calls to the staff relay (/api/staff/*), which forwards the
// HttpOnly session cookie to the Go API. Errors carry the API's friendly message.
export type Staff={id:string;name:string;role:string};
export type AdminProperty={
 id:string;slug:string;reference_code:string;title:string;description:string;emirate:string;community:string;
 category:string;listing_type:string;construction_status:string;price_aed:number;bedrooms:number|null;bathrooms:number|null;area_sqft:number|null;
 permit_number:string;developer:string;price_from:boolean;community_size:string;unit_mix:string[];highlights:string[];
 seo_title:string;seo_description:string;featured:boolean;publish_status:'draft'|'published'|'archived';
 deleted_at:string|null;created_at:string;updated_at:string;cover_id:string|null;media_count:number;
};
export type PropertyForm=Omit<AdminProperty,'id'|'publish_status'|'deleted_at'|'created_at'|'updated_at'|'cover_id'|'media_count'>;
export type Photo={id:string;alt_text:string;sort_order:number;is_cover:boolean;url:string};

export const canEdit=(s:Staff|null)=>!!s&&['admin','manager'].includes(s.role);

async function call<T>(path:string,init?:RequestInit):Promise<T>{
 let res:Response;
 try{res=await fetch('/api/staff/'+path,{cache:'no-store',...init,headers:init?.body instanceof FormData?init.headers:{'Content-Type':'application/json',...init?.headers}})}
 catch{throw new Error('No connection. Check your internet and try again.')}
 const body=await res.json().catch(()=>({}));
 if(res.status===401)throw new Error(path==='login'?'Email or password is not correct.':'Your session has expired. Please log in again.');
 if(res.status===403)throw new Error('Your account is not allowed to do this.');
 if(!res.ok)throw new Error(body.error||`Something went wrong (error ${res.status}). Please try again.`);
 return body as T;
}
const json=(method:string,body?:unknown):RequestInit=>({method,body:body===undefined?undefined:JSON.stringify(body)});

export const api={
 session:()=>fetch('/api/staff/session',{cache:'no-store'}).then(r=>r.ok?r.json():{staff:null}).then(j=>(j.staff??null) as Staff|null).catch(()=>null),
 login:(email:string,password:string)=>call<{staff:Staff}>('login',json('POST',{email,password})),
 logout:()=>fetch('/api/staff/logout',{method:'POST'}),
 list:(trash=false)=>call<{data:AdminProperty[]}>('properties'+(trash?'?view=trash':'')).then(r=>r.data),
 get:(id:string)=>call<AdminProperty>('properties/'+id),
 create:(f:PropertyForm)=>call<{id:string}>('properties',json('POST',f)),
 update:(id:string,f:PropertyForm)=>call<{id:string}>('properties/'+id,json('PUT',f)),
 setStatus:(id:string,status:'draft'|'published')=>call('properties/'+id+'/status',json('PATCH',{status})),
 trash:(id:string)=>call('properties/'+id,{method:'DELETE'}),
 erase:(id:string)=>call('properties/'+id+'?permanent=1',{method:'DELETE'}),
 restore:(id:string)=>call('properties/'+id+'/restore',{method:'POST'}),
 photos:(id:string)=>call<{data:Photo[]}>('properties/'+id+'/media').then(r=>r.data),
 upload:(id:string,file:Blob,name:string,alt:string)=>{const fd=new FormData();fd.append('file',file,name);fd.append('alt_text',alt);return call<{id:string}>('properties/'+id+'/media',{method:'POST',body:fd})},
 setCover:(id:string,mid:string)=>call('properties/'+id+'/media/'+mid+'/cover',{method:'PATCH'}),
 setAlt:(id:string,mid:string,alt:string)=>call('properties/'+id+'/media/'+mid,json('PATCH',{alt_text:alt})),
 order:(id:string,ids:string[])=>call('properties/'+id+'/media/order',json('PUT',{ids})),
 removePhoto:(id:string,mid:string)=>call('properties/'+id+'/media/'+mid,{method:'DELETE'}),
};

export const slugify=(s:string)=>s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g,'').replace(/&/g,' and ').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,120);
export const newReference=()=>{const d=new Date();return `AMS-${String(d.getFullYear()).slice(2)}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${Math.random().toString(36).slice(2,6).toUpperCase()}`};
export const blankForm=():PropertyForm=>({slug:'',reference_code:newReference(),title:'',description:'',emirate:'Dubai',community:'',category:'apartment',listing_type:'sale',construction_status:'ready',price_aed:0,bedrooms:null,bathrooms:null,area_sqft:null,permit_number:'',developer:'',price_from:false,community_size:'',unit_mix:[],highlights:[],seo_title:'',seo_description:'',featured:false});
const FORM_KEYS=Object.keys(blankForm()) as (keyof PropertyForm)[];
export const toForm=(p:AdminProperty):PropertyForm=>{const f=Object.fromEntries(FORM_KEYS.map(k=>[k,p[k]])) as PropertyForm;return {...f,permit_number:f.permit_number||'',unit_mix:f.unit_mix||[],highlights:f.highlights||[],price_aed:Number(f.price_aed)}};
export const statusLabel=(p:AdminProperty)=>p.deleted_at?'In trash':p.publish_status==='published'?'Live on website':'Draft (not on website)';
