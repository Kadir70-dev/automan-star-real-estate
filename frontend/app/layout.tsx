import MobileContactBar from '@/components/MobileContactBar';
import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LuxuryPreloader from '@/components/LuxuryPreloader';
export const metadata:Metadata={title:{default:'Saud Kondekar | Dubai Real Estate',template:'%s | Saud Kondekar'},description:'Dubai real estate expertise with a focus on premium properties and investment opportunities across the UAE.',robots:{index:false,follow:false}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><LuxuryPreloader/><Header/>{children}<Footer/><MobileContactBar/></body></html>}
