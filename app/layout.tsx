import {getCms} from '@/lib/cms';
import SiteChrome from '@/components/SiteChrome';
import MobileContactBar from '@/components/MobileContactBar';
import type { Metadata, Viewport } from 'next';
import { Bodoni_Moda, Manrope } from 'next/font/google';
import './globals.css';
import './design-system.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ConsultationPopup from '@/components/ConsultationPopup';
import {BUSINESS,OG_IMAGE,SITE_URL,jsonLdHtml,siteJsonLd} from '@/lib/seo';
const serif=Bodoni_Moda({subsets:['latin'],weight:['400','500'],style:['normal','italic'],variable:'--font-serif',display:'swap'});
const sans=Manrope({subsets:['latin'],weight:['400','500','600','700'],variable:'--font-sans',display:'swap'});
export const metadata:Metadata={
 metadataBase:new URL(SITE_URL),
 title:{default:'Automan Star Real Estate | Dubai Real Estate Agency, Business Bay',template:'%s | Automan Star Real Estate'},
 description:'Dubai real estate agency in Business Bay. Automan Star Real Estate helps you buy apartments, villas, off-plan and commercial property in Dubai.',
 applicationName:BUSINESS.name,
 robots:{index:true,follow:true,googleBot:{index:true,follow:true,'max-image-preview':'large','max-snippet':-1,'max-video-preview':-1}},
 openGraph:{type:'website',locale:'en_AE',siteName:BUSINESS.name,title:'Automan Star Real Estate | Dubai Real Estate Agency',description:'Apartments, villas, off-plan and commercial property in Dubai, advised from Office 2401, The Prism Tower, Business Bay.',images:[OG_IMAGE]},
 twitter:{card:'summary_large_image',title:'Automan Star Real Estate | Dubai Real Estate Agency',description:'Dubai property advisory from Business Bay.',images:[OG_IMAGE.url]},
 ...(process.env.GOOGLE_SITE_VERIFICATION?{verification:{google:process.env.GOOGLE_SITE_VERIFICATION}}:{}),
};
export const viewport:Viewport={themeColor:'#0f1b20',viewportFit:'cover'};
export default async function RootLayout({children}:{children:React.ReactNode}){const site=await getCms('site');return <html lang="en-AE" className={`${serif.variable} ${sans.variable}`}><body><script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(siteJsonLd())}/><SiteChrome site={site}>{children}</SiteChrome></body></html>}
