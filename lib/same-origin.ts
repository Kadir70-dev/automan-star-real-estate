import type {NextRequest} from 'next/server';
// On Netlify req.url carries the deploy permalink host, not the custom domain the
// browser used, so the public origin is rebuilt from the forwarded Host header.
export function publicOrigin(req:NextRequest):string{
 const url=new URL(req.url);
 const host=req.headers.get('x-forwarded-host')?.split(',')[0].trim()||req.headers.get('host');
 const proto=req.headers.get('x-forwarded-proto')?.split(',')[0].trim()||url.protocol.replace(':','');
 return host?`${proto}://${host}`:url.origin;
}
// CSRF guard for state-changing relay requests. A cross-site page cannot forge Origin or Host.
export function isSameOrigin(req:NextRequest):boolean{
 if(req.headers.get('sec-fetch-site')==='cross-site')return false;
 const origin=req.headers.get('origin');
 return !origin||origin===publicOrigin(req)||origin===new URL(req.url).origin;
}
