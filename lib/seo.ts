import type {Metadata} from 'next';
import {LEADERSHIP} from './leadership';

// Single source of truth for public business identity used in metadata and
// structured data. Only client-confirmed details belong here: no phone,
// licence (RERA/ORN/BRN), geo coordinates, ratings or opening hours until the
// client supplies and approves them.
export const SITE_URL='https://automanstarrealty.com';
export const BUSINESS={
 name:'Automan Star Real Estate',
 email:'saud@automanstarrealty.com',
 street:'Office 2401, The Prism Tower',
 locality:'Business Bay',
 region:'Dubai',
 country:'AE',
 sameAs:['https://www.linkedin.com/in/saud-kondekar-52238823a','https://www.instagram.com/investwithsaud'],
};
export const OG_IMAGE={url:'/og-image.jpg',width:1200,height:630,alt:'Automan Star Real Estate, Business Bay, Dubai'};

// Per-page metadata with a canonical URL and matching Open Graph/Twitter tags.
export function pageMetadata({path,title,description,socialTitle}:{path:string;title:string;description:string;socialTitle?:string}):Metadata{
 const og=socialTitle||`${title} | ${BUSINESS.name}`;
 return {
  title,description,
  alternates:{canonical:path},
  openGraph:{title:og,description,url:path,type:'website',siteName:BUSINESS.name,locale:'en_AE',images:[OG_IMAGE]},
  twitter:{card:'summary_large_image',title:og,description,images:[OG_IMAGE.url]},
 };
}

export const NOINDEX:Metadata['robots']={index:false,follow:true};

const agencyId=`${SITE_URL}/#agency`;
export function siteJsonLd(){
 return {
  '@context':'https://schema.org',
  '@graph':[
   {
    '@type':['RealEstateAgent','Organization'],
    '@id':agencyId,
    name:BUSINESS.name,
    url:`${SITE_URL}/`,
    logo:`${SITE_URL}/saudlogo-optimized.png`,
    image:`${SITE_URL}${OG_IMAGE.url}`,
    email:BUSINESS.email,
    address:{'@type':'PostalAddress',streetAddress:BUSINESS.street,addressLocality:BUSINESS.locality,addressRegion:BUSINESS.region,addressCountry:BUSINESS.country},
    areaServed:{'@type':'City',name:'Dubai'},
    founder:{'@type':'Person',name:LEADERSHIP[0].name,jobTitle:LEADERSHIP[0].role},
    employee:LEADERSHIP.map(l=>({'@type':'Person',name:l.name,jobTitle:l.role})),
    sameAs:BUSINESS.sameAs,
   },
   {'@type':'WebSite','@id':`${SITE_URL}/#website`,url:`${SITE_URL}/`,name:BUSINESS.name,inLanguage:'en-AE',publisher:{'@id':agencyId}},
  ],
 };
}

export function breadcrumbJsonLd(items:[name:string,path:string][]){
 return {
  '@context':'https://schema.org',
  '@type':'BreadcrumbList',
  itemListElement:[['Home','/'] as [string,string],...items].map(([name,path],i)=>({'@type':'ListItem',position:i+1,name,item:`${SITE_URL}${path==='/'?'/':path}`})),
 };
}

// JSON-LD is serialized into a <script>; escape "<" so data can never close it.
export function jsonLdHtml(data:unknown){return {__html:JSON.stringify(data).replace(/</g,'\\u003c')}}
