import {MapPin,Mail} from 'lucide-react';import Enquiry from '@/components/Enquiry';
export const metadata = {
  title: 'Contact Our Dubai Real Estate Team',
  description: 'Contact Automan Star Real Estate at Office 2401, The Prism Tower, Business Bay, Dubai. Enquire about apartments, villas and commercial properties.',
  alternates: { canonical: '/contact' },
  openGraph: { title: 'Contact Automan Star Real Estate | Business Bay Dubai', description: 'Reach our team at The Prism Tower, Business Bay, Dubai.', url: '/contact' },
};
export default function Contact(){return <main className="page-shell contact-page"><div className="container"><p className="eyebrow dark-eyebrow">CONTACT / LET&apos;S START A CONVERSATION</p><h1 className="display-heading">Let&apos;s find <em>your place.</em></h1><div className="contact-grid"><div><p className="contact-lead">Every extraordinary journey begins with a conversation. Tell us what you&apos;re looking for, and we&apos;ll take it from there.</p><div className="contact-method"><MapPin/><div><b>OUR LOCATION</b><p>Office 2401, The Prism Tower, Business Bay, Dubai, UAE</p></div></div><div className="contact-method"><Mail/><div><b>BUSINESS ENQUIRIES</b><p><a href="mailto:saud@automanstarrealty.com">saud@automanstarrealty.com</a></p></div></div><p className="contact-note">Tell us your preferred location, budget and timeline so we can understand your requirements.</p></div><div className="contact-form-wrap"><p className="eyebrow dark-eyebrow">SEND US A MESSAGE</p><h2>We&apos;d love to hear from you.</h2><Enquiry/></div></div></div></main>}
