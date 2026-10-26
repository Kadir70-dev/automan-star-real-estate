import {getCms,cmsText,cmsMetadata} from '@/lib/cms';
import {pageMetadata} from '@/lib/seo';
const baseMetadata=pageMetadata({path:'/privacy',title:'Privacy Policy',description:'How Automan Star Real Estate handles the personal information you share through this website.'});
const sections=[
 {key:'collection',title:'Information we collect',copy:'When you submit an enquiry, viewing request or consultation request on this website, we collect the details you provide — such as your name, email address, phone number and the type of property service you are interested in — together with the date and time of submission and the page you submitted it from.'},
 {key:'use',title:'How we use it',copy:'We use this information only to respond to your request, contact you about your property enquiry and keep a record of our communication with you. We do not sell your personal information.'},
 {key:'storage',title:'Where it is stored',copy:'Submissions are transmitted over an encrypted connection and stored with the service providers we use to host this website and manage enquiries. Access is limited to the team members who handle your request.'},
 {key:'retention',title:'How long we keep it',copy:'We keep enquiry details for as long as needed to respond to you and manage any resulting relationship, or as required by applicable law. You can ask us to delete your details at any time.'},
 {key:'browser',title:'Browser storage',copy:'This website uses your browser\u2019s session storage to remember small preferences during your visit, such as whether the introduction animation or consultation popup has already been shown. This information stays in your browser and is cleared when the session ends.'},
 {key:'choices',title:'Your choices',copy:'To access, correct or delete the personal information you have shared with us, or to stop being contacted, email'}
];
export async function generateMetadata(){return cmsMetadata(await getCms('privacy'),baseMetadata)}
export default async function Privacy(){
 const [cms,site]=await Promise.all([getCms('privacy'),getCms('site')]);
 const address=cmsText(site,'footer.email','saud@automanstarrealty.com');
 return <main className="page-shell privacy-page"><div className="container">
 <p className="eyebrow dark-eyebrow">LEGAL / PRIVACY</p>
 <h1 className="display-heading" data-cms-field="privacy.heading">{cms.fields['privacy.heading']??<>Privacy <em>policy.</em></>}</h1>
 <p className="privacy-updated" data-cms-field="privacy.updated">Last updated: {cmsText(cms,'privacy.updated','22 October 2026')}</p>
 <div className="privacy-body">{sections.map(section=><section key={section.key}>
 <h2 data-cms-field={`privacy.${section.key}.title`}>{cmsText(cms,`privacy.${section.key}.title`,section.title)}</h2>
 <p data-cms-field={`privacy.${section.key}.copy`}>{cmsText(cms,`privacy.${section.key}.copy`,section.copy)}{section.key==='choices'&&<> <a href={'mailto:'+address}>{address}</a>.</>}</p>
 </section>)}</div></div></main>;
}
