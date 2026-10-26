import CmsInlineEditor from '@/components/CmsInlineEditor';
'use client';
import {usePathname} from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileContactBar from '@/components/MobileContactBar';
import ConsultationPopup from '@/components/ConsultationPopup';
// The CMS studio is a separate authenticated application experience.
// Public site chrome and the consultation modal never render on /admin.
export default function SiteChrome({children}:{children:React.ReactNode}){
 const path=usePathname();
 if(path?.startsWith('/admin'))return <>{children}</>;
 return <><a className="skip-link" href="#main">Skip to content</a><Header/><div id="main" tabIndex={-1}>{children}</div><Footer/><MobileContactBar/><ConsultationPopup/><CmsInlineEditor/></>;
}
