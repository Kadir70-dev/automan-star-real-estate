import type {NextRequest} from 'next/server';
// Server-only. Lets the Go API rate-limit per visitor instead of per Netlify function.
// x-nf-client-connection-ip is set by Netlify's edge and cannot be supplied by the browser.
export function relayHeaders(req:NextRequest):Record<string,string>{
 const secret=process.env.BACKEND_PROXY_SECRET,ip=req.headers.get('x-nf-client-connection-ip');
 return secret&&ip?{'X-Automan-Proxy-Secret':secret,'X-Automan-Client-IP':ip}:{};
}
