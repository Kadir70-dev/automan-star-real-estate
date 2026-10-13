import type { Metadata } from 'next';
import Link from 'next/link';
import ResidenceExperience from '@/components/ResidenceExperience';
export const metadata:Metadata={title:'Interactive 3D Residence Concept',description:'Explore a Dubai-inspired conceptual residence through an interactive 3D architectural demonstration.'};
export default function ExperiencePage(){return <main className="experience-page"><div className="container experience-heading"><div><p className="eyebrow">AUTOMAN STAR / INTERACTIVE EXPERIENCE</p><h1>Architecture in <em>motion.</em></h1></div><Link href="/properties" className="experience-back">Explore properties ↗</Link></div><div className="container"><ResidenceExperience/></div><div className="container experience-footnote">This interactive space is a bespoke conceptual visualization created for design demonstration. It does not represent an actual property, development or verified view in Dubai.</div></main>}
