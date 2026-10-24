import type { NextConfig } from "next";
const nextConfig: NextConfig = { images: {formats:['image/avif','image/webp'],remotePatterns:[{protocol:'https',hostname:'images.unsplash.com'}]}, async redirects(){return [{source:'/rent',destination:'/buy',permanent:true}]} };
export default nextConfig;
