// Shared (client + server) validation for the consultation popup lead form.
// Kept dependency-free so the same rules run in the browser and in the API route.

export type Country = {iso:string;name:string;dial:string;min:number;max:number};

// National significant number lengths (digits after the country code, trunk prefix removed).
export const COUNTRIES:Country[]=[
 {iso:'AE',name:'United Arab Emirates',dial:'971',min:8,max:9},
 {iso:'SA',name:'Saudi Arabia',dial:'966',min:8,max:9},
 {iso:'QA',name:'Qatar',dial:'974',min:7,max:8},
 {iso:'KW',name:'Kuwait',dial:'965',min:7,max:8},
 {iso:'BH',name:'Bahrain',dial:'973',min:8,max:8},
 {iso:'OM',name:'Oman',dial:'968',min:7,max:8},
 {iso:'EG',name:'Egypt',dial:'20',min:9,max:10},
 {iso:'JO',name:'Jordan',dial:'962',min:8,max:9},
 {iso:'LB',name:'Lebanon',dial:'961',min:7,max:8},
 {iso:'IN',name:'India',dial:'91',min:10,max:10},
 {iso:'PK',name:'Pakistan',dial:'92',min:9,max:10},
 {iso:'BD',name:'Bangladesh',dial:'880',min:9,max:10},
 {iso:'LK',name:'Sri Lanka',dial:'94',min:9,max:9},
 {iso:'PH',name:'Philippines',dial:'63',min:9,max:10},
 {iso:'CN',name:'China',dial:'86',min:9,max:11},
 {iso:'SG',name:'Singapore',dial:'65',min:8,max:8},
 {iso:'GB',name:'United Kingdom',dial:'44',min:9,max:10},
 {iso:'IE',name:'Ireland',dial:'353',min:7,max:9},
 {iso:'FR',name:'France',dial:'33',min:9,max:9},
 {iso:'DE',name:'Germany',dial:'49',min:6,max:13},
 {iso:'IT',name:'Italy',dial:'39',min:6,max:11},
 {iso:'ES',name:'Spain',dial:'34',min:9,max:9},
 {iso:'NL',name:'Netherlands',dial:'31',min:9,max:9},
 {iso:'CH',name:'Switzerland',dial:'41',min:9,max:9},
 {iso:'RU',name:'Russia',dial:'7',min:10,max:10},
 {iso:'KZ',name:'Kazakhstan',dial:'7',min:10,max:10},
 {iso:'TR',name:'Türkiye',dial:'90',min:10,max:10},
 {iso:'US',name:'United States',dial:'1',min:10,max:10},
 {iso:'CA',name:'Canada',dial:'1',min:10,max:10},
 {iso:'AU',name:'Australia',dial:'61',min:9,max:9},
 {iso:'ZA',name:'South Africa',dial:'27',min:9,max:9},
 {iso:'NG',name:'Nigeria',dial:'234',min:8,max:10},
];

export const INTERESTS=['Buying Property','Off-Plan Projects','Property Investment','Selling Property'] as const;
export type Interest=typeof INTERESTS[number];

export type LeadInput={name:string;email:string;country:string;phone:string;interest:string;consent:boolean};
export type LeadErrors=Partial<Record<keyof LeadInput,string>>;
export type CleanLead={name:string;email:string;phoneE164:string;country:string;interest:Interest};

const EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Returns E.164 (e.g. +971501234567) or null if the number does not fit the country's length rules. */
export function toE164(countryIso:string,raw:string):string|null{
 const c=COUNTRIES.find(x=>x.iso===countryIso);
 if(!c||typeof raw!=='string'||raw.length>32)return null;
 if(/[^\d\s()+.\-]/.test(raw))return null;
 let digits=raw.replace(/\D/g,'');
 if(raw.trim().startsWith('+')||raw.trim().startsWith('00')){
  digits=digits.replace(/^00/,'');
  if(!digits.startsWith(c.dial))return null;
  digits=digits.slice(c.dial.length);
 }else if(digits.startsWith('00'+c.dial)){
  digits=digits.slice(2+c.dial.length);
 }
 // Drop the national trunk prefix (e.g. UAE 050… → 50…). Italy keeps its leading 0.
 if(c.iso!=='IT')digits=digits.replace(/^0+/,'');
 if(digits.length<c.min||digits.length>c.max)return null;
 const e164='+'+c.dial+digits;
 return e164.length<=16?e164:null;
}

export function validateLead(v:Partial<LeadInput>):{ok:true;lead:CleanLead}|{ok:false;errors:LeadErrors}{
 const errors:LeadErrors={};
 const name=typeof v.name==='string'?v.name.trim().replace(/\s+/g,' '):'';
 const email=typeof v.email==='string'?v.email.trim().toLowerCase():'';
 const country=typeof v.country==='string'?v.country:'';
 const interest=typeof v.interest==='string'?v.interest:'';
 if(name.length<2)errors.name='Please enter your full name.';
 else if(name.length>120||/[<>{}\\]|https?:\/\//i.test(name))errors.name='Please enter a valid name.';
 if(!email)errors.email='Please enter your email address.';
 else if(email.length>254||!EMAIL.test(email))errors.email='Please enter a valid email address.';
 const phoneE164=toE164(country,typeof v.phone==='string'?v.phone:'');
 if(!COUNTRIES.some(c=>c.iso===country))errors.country='Please select a country code.';
 else if(!(typeof v.phone==='string'&&v.phone.trim()))errors.phone='Please enter your phone number.';
 else if(!phoneE164)errors.phone='Please enter a valid phone number for the selected country.';
 if(!(INTERESTS as readonly string[]).includes(interest))errors.interest='Please choose what you are interested in.';
 if(v.consent!==true)errors.consent='Please agree to be contacted to continue.';
 if(Object.keys(errors).length)return {ok:false,errors};
 return {ok:true,lead:{name,email,phoneE164:phoneE164!,country,interest:interest as Interest}};
}
