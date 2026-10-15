import MobileContactBar from '@/components/MobileContactBar';
import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LuxuryPreloader from '@/components/LuxuryPreloader';
export const metadata:Metadata={title:{default:'Saud Kondekar | Premium Dubai Real Estate',template:'%s | Saud Kondekar'},description:'Exclusive Dubai real estate. Premier properties, expert guidance, Business Bay offices.',robots:{index:true,follow:true},openGraph:{title:'Saud Kondekar | Dubai Real Estate',description:'Premium properties. Dubai expertise.',type:'website'},twitter:{card:'summary_large_image',title:'Saud Kondekar Real Estate',description:'Dubai luxury properties & investment.'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><LuxuryPreloader/><Header/>{children}<Footer/><MobileContactBar/></body></html>}
