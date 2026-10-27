// Pure helpers for the public /api/crm/* relays (kept dependency-free so they are unit-testable).

/** Returns the referring page when it belongs to this site, without query string or hash. */
export function sameSiteSource(referer:string|null,siteOrigin:string):string|null{
 if(!referer)return null;
 try{const u=new URL(referer);if(u.origin!==siteOrigin)return null;return (u.origin+u.pathname).slice(0,300)}catch{return null}
}

/** Appends the source page to the enquiry message so staff can see where a lead came from. */
export function withSource(raw:string,source:string|null):string{
 if(!source)return raw;
 let body:unknown;
 try{body=JSON.parse(raw)}catch{return raw}
 if(!body||typeof body!=='object'||Array.isArray(body))return raw;
 const o=body as Record<string,unknown>;
 if(o.message!==undefined&&typeof o.message!=='string')return raw;
 const note=`Source page: ${source}`;
 const message=typeof o.message==='string'&&o.message.trim()?`${o.message.trim().slice(0,3000-note.length-2)}\n\n${note}`:note;
 return JSON.stringify({...o,message});
}
