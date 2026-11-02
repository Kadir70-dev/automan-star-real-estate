import Link from 'next/link';
import Image from 'next/image';
import {Building2,MapPin} from 'lucide-react';
import {type Project,PROJECTS,compactAed,projectLocation,projectPath} from '@/lib/projects';

// Card for a published developer project; shares the .pc property-card styles.
export default function ProjectCard({project:p,priority=false}:{project:Project;priority?:boolean}){
 return <article className="property-card pc pc-project">
  <div className="property-card-image">
   <Image src={p.cover.src} alt={p.cover.alt} fill unoptimized sizes="(max-width: 720px) 100vw, (max-width: 1200px) 50vw, 33vw" priority={priority}/>
   <span className="pc-badge">{p.status.toUpperCase()}</span>
  </div>
  <div className="property-card-body">
   <p className="pc-meta"><MapPin size={14} aria-hidden="true"/> {projectLocation(p)} · {p.developer}</p>
   <h3><Link href={projectPath(p)} className="pc-link">{p.name}</Link></h3>
   <p className="pc-price"><small>Starting from </small>{compactAed(p.startingPrice)}</p>
   <div className="specs"><span><Building2 size={16} aria-hidden="true"/>{p.unitMix.join(' · ')}</span></div>
  </div>
 </article>;
}

// Server-friendly grid of every published project (Buy and Off-plan pages).
export function FeaturedProjects({title='Featured project'}:{title?:string}){
 if(!PROJECTS.length)return null;
 return <section className="project-feature" aria-labelledby="featured-projects">
  <h2 id="featured-projects" className="project-catalog-title">{title}</h2>
  <div className="cs-grid">{PROJECTS.map((p,i)=><ProjectCard key={p.slug} project={p} priority={i===0}/>)}</div>
 </section>;
}
