// Placeholder "Coming Soon" cards shown until verified listings are published.
// No prices, sizes or addresses — images are illustrative only.
export type ComingSoonItem={title:string;label:string;image:string};
export type ComingSoonCategory='buy'|'off-plan'|'commercial';
const img=(id:string)=>`https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1000&q=80`;

export const COMING_SOON:Record<ComingSoonCategory,ComingSoonItem[]>={
 buy:[
  {title:'Signature Villa',label:'FOR SALE · DUBAI',image:img('1613490493576-7fde63acd811')},
  {title:'Contemporary Family Home',label:'FOR SALE · DUBAI',image:img('1580587771525-78b9dba3b914')},
  {title:'Penthouse Residence',label:'FOR SALE · DUBAI',image:img('1600607687939-ce8a6c25118c')},
  {title:'Waterfront Villa',label:'FOR SALE · DUBAI',image:img('1512917774080-9991f1c4c750')},
  {title:'Luxury Apartment',label:'FOR SALE · DUBAI',image:img('1600210492486-724fe5c67fb0')},
  {title:'Garden Townhouse',label:'FOR SALE · DUBAI',image:img('1600596542815-ffad4c1539a9')},
 ],
 'off-plan':[
  {title:'Skyline Tower Project',label:'OFF-PLAN · DUBAI',image:img('1512453979798-5ea266f8880c')},
  {title:'Beachfront Development',label:'OFF-PLAN · DUBAI',image:img('1518684079-3c830dcef090')},
  {title:'Business District Towers',label:'OFF-PLAN · DUBAI',image:img('1486406146926-c627a92ad1ab')},
  {title:'New Community Launch',label:'OFF-PLAN · DUBAI',image:img('1541888946425-d81bb19240f5')},
  {title:'Contemporary Villas',label:'OFF-PLAN · DUBAI',image:img('1580587771525-78b9dba3b914')},
  {title:'Waterfront Residences',label:'OFF-PLAN · DUBAI',image:img('1582407947304-fd86f028f716')},
 ],
 commercial:[
  {title:'Grade-A Office Space',label:'COMMERCIAL · DUBAI',image:img('1497366216548-37526070297c')},
  {title:'Open-Plan Office Floor',label:'COMMERCIAL · DUBAI',image:img('1497366811353-6870744d04b2')},
  {title:'Corporate Tower Suite',label:'COMMERCIAL · DUBAI',image:img('1486406146926-c627a92ad1ab')},
  {title:'Business Bay Office',label:'COMMERCIAL · DUBAI',image:img('1582407947304-fd86f028f716')},
  {title:'Retail & Showroom Space',label:'COMMERCIAL · DUBAI',image:img('1441986300917-64674bd600d8')},
  {title:'Mixed-Use Building',label:'COMMERCIAL · DUBAI',image:img('1460317442991-0ec209397118')},
 ],
};

export const COMING_SOON_MIXED:ComingSoonItem[]=[COMING_SOON.buy[0],COMING_SOON['off-plan'][0],COMING_SOON.commercial[0],COMING_SOON.buy[1],COMING_SOON.buy[2],COMING_SOON['off-plan'][1]];
