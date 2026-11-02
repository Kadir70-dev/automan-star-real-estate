// Verified developer projects published directly from the site (not the
// property database). Each project has its own detail page at
// /properties/<slug> and is shown on Home, Buy, Off-plan and /properties.
export type ProjectImage={src:string;alt:string;width:number;height:number};
export type ProjectStatus='Off-plan'|'Ready';
export type UnitType='Apartment'|'Townhouse'|'Villa';
export type Project={
 slug:string;name:string;developer:string;community:string;emirate:string;
 category:string;status:ProjectStatus;startingPrice:number;communitySize:string;seoTitle:string;seoDescription:string;
 summary:string;description:string;unitTypes:UnitType[];unitMix:string[];highlights:string[];
 cover:ProjectImage;gallery:ProjectImage[];
};

const dir='/projects/azizi-florence/';
const img=(file:string,alt:string,width:number,height:number):ProjectImage=>({src:dir+file,alt,width,height});
// Source files supplied 2026-11-02 (~/Downloads), renamed for SEO:
// villa-facade=97d44122, townhouse-streetscape=762c8e34, masterplan-aerial=3a87bce9,
// contemporary-villa=2bddce20, garden-pool=a392e11b, double-height-living=c12d5e60,
// dining-room=cf520352, lounge=1e25d919, master-bedroom=9ee32cf1.
const florenceCover=img('azizi-florence-villa-facade.webp','Azizi Florence villa exterior with landscaped front garden and water feature, Um Fanain, Sharjah',1080,607);

export const PROJECTS:Project[]=[
 {
  slug:'azizi-florence',
  name:'Azizi Florence',
  developer:'Azizi Developments',
  community:'Um Fanain',
  emirate:'Sharjah',
  category:'Master-Planned Residential Community',
  status:'Off-plan',
  startingPrice:2090000,
  communitySize:'~30M sq. ft.',
  seoTitle:'Azizi Florence Sharjah | Off-Plan from AED 2.09M',
  seoDescription:'Azizi Florence by Azizi Developments, Um Fanain, Sharjah: off-plan apartments, 3-4BR townhouses and 4-6BR villas by a 1.7M sq. ft. park. From AED 2.09M.',
  summary:'European-inspired master-planned community in Um Fanain, Sharjah, with apartments, townhouses and villas around a 1.7M sq. ft. central park.',
  description:'Azizi Florence is a European-inspired residential community by Azizi Developments, spanning approximately 30 million sq. ft. in Um Fanain, Sharjah. It is planned around six residential clusters with landscaped gardens and green spaces, designed for a family-friendly lifestyle.',
  unitTypes:['Apartment','Townhouse','Villa'],
  unitMix:['Apartments','3 & 4 bedroom townhouses','4, 5 & 6 bedroom villas'],
  highlights:['1.7M sq. ft. central park','100+ lifestyle amenities','Walking, jogging and cycling tracks','Shopping and retail','Family recreation','Six residential clusters with landscaped gardens'],
  cover:florenceCover,
  gallery:[
   florenceCover,
   img('azizi-florence-townhouse-streetscape.webp','Tree-lined street of contemporary townhouses at Azizi Florence',1080,607),
   img('azizi-florence-masterplan-aerial.webp','Aerial view of the Azizi Florence master plan with green corridors and residential clusters',1080,607),
   img('azizi-florence-contemporary-villa.webp','Three-storey contemporary villa with roof terrace and garden at Azizi Florence',1080,602),
   img('azizi-florence-garden-pool.webp','Private villa garden with plunge pool, fire pit and outdoor seating at Azizi Florence',1080,580),
   img('azizi-florence-double-height-living.webp','Double-height villa living room with marble floors and feature staircase at Azizi Florence',1080,702),
   img('azizi-florence-dining-room.webp','Open-plan dining and living area with crystal chandeliers at Azizi Florence',1080,971),
   img('azizi-florence-lounge.webp','Villa lounge with full-height windows and garden view at Azizi Florence',1080,971),
   img('azizi-florence-master-bedroom.webp','Master bedroom with upholstered bed and chandelier at Azizi Florence',1080,809),
  ],
 },
];

export const getProject=(slug:string)=>PROJECTS.find(p=>p.slug===slug);
export const projectPath=(p:Project)=>`/properties/${p.slug}`;
export const projectLocation=(p:Project)=>`${p.community}, ${p.emirate}`;
// 2090000 -> "AED 2.09M"
export const compactAed=(n:number)=>n>=1e6?`AED ${Number((n/1e6).toFixed(2))}M`:`AED ${new Intl.NumberFormat('en-AE').format(n)}`;

export type ProjectFilter={query?:string;location?:string;type?:string;purpose?:string;maxPrice?:number};
// Shared by the /properties catalog and server pages so URL filters behave the same.
export function matchProject(p:Project,f:ProjectFilter){
 const hay=`${p.name} ${p.developer} ${p.community} ${p.emirate} ${p.category} ${p.unitMix.join(' ')}`.toLowerCase();
 const has=(v?:string)=>!v||v.toLowerCase().split(/[\s,]+/).filter(Boolean).every(t=>hay.includes(t));
 const purposeOk=!f.purpose||f.purpose==='All'||f.purpose==='Buy'||f.purpose==='sale'||(f.purpose==='Off-plan'&&p.status==='Off-plan');
 return has(f.query)&&has(f.location)&&(!f.type||p.unitTypes.includes(f.type as UnitType))&&purposeOk&&(!f.maxPrice||p.startingPrice<=f.maxPrice);
}
