'use client';
import type {CmsDocument} from '@/lib/cms';
import CmsInlineEditor from '@/components/CmsInlineEditor';
import {usePathname} from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileContactBar from '@/components/MobileContactBar';
import ConsultationPopup from '@/components/ConsultationPopup';
import {PrefsProvider} from '@/components/Prefs';
import type {Rates} from '@/lib/currency';
// The CMS studio is a separate authenticated application experience.
// Public site chrome and the consultation modal never render on /admin.
export default function SiteChrome({children,site,rates,live}:{children:React.ReactNode;site:CmsDocument;rates?:Rates;live?:boolean}){
 const path=usePathname();
 if(path?.startsWith('/admin'))return <>{children}</>;
 return <PrefsProvider rates={rates} live={live}><a className="skip-link" href="#main">Skip to content</a><Header site={site}/><div id="main" tabIndex={-1}>{children}</div><Footer site={site}/><MobileContactBar/><ConsultationPopup/><CmsInlineEditor/></PrefsProvider>;
}
