import type { NextConfig } from "next";
// Baseline browser hardening. The CSP only restricts framing, plugins, <base> and form
// targets, so inline JSON-LD, next/font and the WebGL scenes are unaffected.
const securityHeaders=[
 {key:'X-Frame-Options',value:'SAMEORIGIN'},
 {key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},
 {key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=(), payment=(), usb=()'},
 {key:'Content-Security-Policy',value:"frame-ancestors 'self'; base-uri 'self'; object-src 'none'; form-action 'self'"},
];
const nextConfig: NextConfig = { poweredByHeader:false, images: {formats:['image/avif','image/webp'],remotePatterns:[{protocol:'https',hostname:'images.unsplash.com'}]}, async redirects(){return [{source:'/rent',destination:'/buy',permanent:true}]}, async headers(){return [{source:'/:path*',headers:securityHeaders}]} };
export default nextConfig;
