import {getCms,cmsText,cmsMetadata} from '@/lib/cms';
import {pageMetadata} from '@/lib/seo';
const baseMetadata=pageMetadata({path:'/privacy',title:'Privacy Policy',description:'How Automan Star Real Estate handles the personal information you share through this website.'});
const updated='22 October 2026';
export async function generateMetadata(){return cmsMetadata(await getCms('privacy'),baseMetadata)}
export default function Privacy(){return <main className="page-shell privacy-page"><div className="container"><p className="eyebrow dark-eyebrow">LEGAL / PRIVACY</p><h1 className="display-heading">Privacy <em>policy.</em></h1><p className="privacy-updated">Last updated: {updated}</p><div className="privacy-body">
<section><h2>Information we collect</h2><p>When you submit an enquiry, viewing request or consultation request on this website, we collect the details you provide — such as your name, email address, phone number and the type of property service you are interested in — together with the date and time of submission and the page you submitted it from.</p></section>
<section><h2>How we use it</h2><p>We use this information only to respond to your request, contact you about your property enquiry and keep a record of our communication with you. We do not sell your personal information.</p></section>
<section><h2>Where it is stored</h2><p>Submissions are transmitted over an encrypted connection and stored with the service providers we use to host this website and manage enquiries. Access is limited to the team members who handle your request.</p></section>
<section><h2>How long we keep it</h2><p>We keep enquiry details for as long as needed to respond to you and manage any resulting relationship, or as required by applicable law. You can ask us to delete your details at any time.</p></section>
<section><h2>Browser storage</h2><p>This website uses your browser&apos;s session storage to remember small preferences during your visit, such as whether the introduction animation or consultation popup has already been shown. This information stays in your browser and is cleared when the session ends.</p></section>
<section><h2>Your choices</h2><p>To access, correct or delete the personal information you have shared with us, or to stop being contacted, email <a href="mailto:saud@automanstarrealty.com">saud@automanstarrealty.com</a>.</p></section>
</div></div></main>}
