import {Breadcrumbs} from '@/components/SeoGuide';
import AreaGrid from '@/components/AreaGrid';
import {NEIGHBOURHOODS} from '@/lib/neighbourhoods';
import {pageMetadata} from '@/lib/seo';
export const metadata=pageMetadata({path:'/neighbourhoods',title:'Dubai Neighbourhood Guides',description:'Guides to Downtown Dubai, Business Bay, Dubai Marina, Palm Jumeirah, Dubai Hills Estate, JVC, Dubai Creek Harbour and Sharjah: homes, lifestyle and transport.'});
export default function Page(){return <main className="page-shell area-page"><Breadcrumbs items={[['Neighbourhood guides','/neighbourhoods']]}/><div className="container">
 <header className="tool-hero">
  <p className="eyebrow dark-eyebrow">NEIGHBOURHOOD GUIDES</p>
  <h1 className="display-heading">Choose the area <em>before the building.</em></h1>
  <p className="calc-lede">What each community is like to live in: the kind of homes, everyday lifestyle, how you get around and who it suits. Ask us for current listings and prices in any area.</p>
 </header>
 <AreaGrid areas={NEIGHBOURHOODS}/>
</div></main>}
