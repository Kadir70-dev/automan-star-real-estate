import MobileContactBar from '@/components/MobileContactBar';
import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LuxuryPreloader from '@/components/LuxuryPreloader';
export const metadata: Metadata = {
  metadataBase: new URL('https://automanstarrealty.com'),
  title: {
    default: 'Automan Star Real Estate | Buy Property in Dubai',
    template: '%s | Automan Star Real Estate',
  },
  description:
    'Explore properties for sale, off-plan projects and commercial real estate in Dubai with Automan Star Real Estate, Business Bay.',
  applicationName: 'Automan Star Real Estate',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_AE',
    siteName: 'Automan Star Real Estate',
    title: 'Automan Star Real Estate | Dubai Property Advisory',
    description: 'Explore Dubai properties with guidance from our team in Business Bay.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Automan Star Real Estate | Dubai Property Advisory',
    description: 'Dubai property sales, off-plan developments and commercial real estate.',
  },
};

const realEstateAgentSchema = {
  '@context': 'https://schema.org',
  '@type': 'RealEstateAgent',
  '@id': 'https://automanstarrealty.com/#agency',
  name: 'Automan Star Real Estate',
  url: 'https://automanstarrealty.com/',
  email: 'saud@automanstarrealty.com',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Office 2401, The Prism Tower',
    addressLocality: 'Business Bay',
    addressRegion: 'Dubai',
    addressCountry: 'AE',
  },
  areaServed: { '@type': 'Place', name: 'Dubai, United Arab Emirates' },
};

export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(realEstateAgentSchema)}}/><LuxuryPreloader/><Header/>{children}<Footer/><MobileContactBar/></body></html>}
