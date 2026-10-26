import {getCms,cmsText,cmsMetadata} from '@/lib/cms';
import type { Metadata } from 'next';
import ResidenceExperience from '@/components/ResidenceExperience';
import './experience.css';
import {pageMetadata} from '@/lib/seo';
const baseMetadata:Metadata=pageMetadata({path:'/experience',title:'3D Concept Residence Walkthrough',description:'Walk through an illustrative Dubai apartment in 3D: move between rooms, compare finishes and see how the view changes by floor. Concept only, not a listed unit.'});
export async function generateMetadata(){return cmsMetadata(await getCms('experience'),baseMetadata)}
export default async function ExperiencePage(){const cms=await getCms('experience');return <main className="experience-v2">
 <div className="container rx-head">
  <h1 data-cms-field="page.heading">{cmsText(cms,'page.heading','Walk through a concept residence')}</h1>
  <p data-cms-field="page.copy">{cmsText(cms,'page.copy',"Move between rooms, compare two finishes and see how the view changes by floor. It is built for illustration and is not a real unit.")}</p>
 </div>
 <div className="container"><ResidenceExperience/></div>
</main>}
