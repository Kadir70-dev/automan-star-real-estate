import type {MetadataRoute} from 'next';
import {SITE_URL} from '@/lib/seo';
// Private and demo pages are kept crawlable on purpose: they carry a noindex
// robots meta tag, which Google can only see if it may fetch the page.
export default function robots():MetadataRoute.Robots{
 return {rules:[{userAgent:'*',allow:'/',disallow:['/api/']}],sitemap:`${SITE_URL}/sitemap.xml`,host:SITE_URL};
}
