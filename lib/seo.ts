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
export function siteJsonLd(overrides:Record<string,string>={}){
 const name=overrides['business.name']||BUSINESS.name;
 const email=overrides['footer.email']||BUSINESS.email;
 const street=overrides['business.address']||BUSINESS.street;
 const locality=overrides['business.locality']||BUSINESS.locality;
 const region=overrides['business.region']||BUSINESS.region;
 const social=[overrides['social.linkedin']||BUSINESS.sameAs[0],overrides['social.instagram']||BUSINESS.sameAs[1]];
 const staff=LEADERSHIP.map((l,i)=>({
  '@type':'Person',name:overrides[`leadership.${i}.name`]||l.name,jobTitle:overrides[`leadership.${i}.role`]||l.role
 }));
 const logo=overrides['header.logo']||'/saudlogo-optimized.png';
 return {
  '@context':'https://schema.org',
  '@graph':[
   {
    '@type':['RealEstateAgent','Organization'],
    '@id':agencyId,
    name,
    url:`${SITE_URL}/`,
    logo:new URL(logo,SITE_URL).toString(),
    image:`${SITE_URL}${OG_IMAGE.url}`,
    email,
    ...(overrides['business.phone']?{telephone:overrides['business.phone']}:{}),
    address:{'@type':'PostalAddress',streetAddress:street,addressLocality:locality,addressRegion:region,addressCountry:BUSINESS.country},
    areaServed:{'@type':'City',name:'Dubai'},
    founder:staff[0],
    employee:staff,
    sameAs:social,
   },
   {'@type':'WebSite','@id':`${SITE_URL}/#website`,url:`${SITE_URL}/`,name,inLanguage:'en-AE',publisher:{'@id':agencyId}},
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
