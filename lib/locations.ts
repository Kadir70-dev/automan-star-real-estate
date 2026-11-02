// Approximate area centres ([lng, lat]) for the listing map. Listings store only
// community + emirate, so the map shows the AREA, never a plot. Unknown
// communities fall back to the emirate centre at a wider zoom.
type Spot = {c:[number,number];z:number};
const COMMUNITIES:Record<string,[number,number]>={
 'um fanain':[55.5082,25.3547],'umm fanain':[55.5082,25.3547],'aljada':[55.4553,25.3166],'muwaileh':[55.4600,25.2980],
 'al khan':[55.3560,25.3290],'al majaz':[55.3870,25.3230],'al mamzar':[55.3410,25.3060],'tilal city':[55.6010,25.2400],
 'dubai marina':[55.1390,25.0800],'jbr':[55.1330,25.0780],'jumeirah beach residence':[55.1330,25.0780],
 'downtown dubai':[55.2744,25.1972],'downtown':[55.2744,25.1972],'business bay':[55.2620,25.1860],'difc':[55.2800,25.2130],
 'palm jumeirah':[55.1380,25.1124],'dubai hills estate':[55.2450,25.1110],'dubai hills':[55.2450,25.1110],
 'jumeirah village circle':[55.2090,25.0600],'jvc':[55.2090,25.0600],'jumeirah lake towers':[55.1450,25.0700],'jlt':[55.1450,25.0700],
 'arabian ranches':[55.2700,25.0500],'dubai creek harbour':[55.3500,25.2000],'dubai south':[55.1600,24.8900],
 'meydan':[55.3000,25.1600],'mohammed bin rashid city':[55.3000,25.1600],'al furjan':[55.1450,25.0250],
 'damac hills':[55.2550,25.0270],'tilal al ghaf':[55.2400,25.0180],'emaar beachfront':[55.1420,25.0950],
 'al barsha':[55.2000,25.1050],'jumeirah':[55.2400,25.2050],'city walk':[55.2620,25.2070],'deira':[55.3150,25.2700],
 'al reem island':[54.4040,24.4960],'saadiyat island':[54.4350,24.5400],'yas island':[54.6050,24.4900],
 'al raha beach':[54.6000,24.4500],'al marjan island':[55.7380,25.6650],'mina al arab':[55.7800,25.7000],
};
const EMIRATES:Record<string,[number,number]>={
 'dubai':[55.2708,25.2048],'abu dhabi':[54.3773,24.4539],'sharjah':[55.4033,25.3463],'ajman':[55.5136,25.4052],
 'ras al khaimah':[55.9432,25.8007],'umm al quwain':[55.5550,25.5647],'fujairah':[56.3265,25.1288],
};
const key=(s?:string)=>(s||'').toLowerCase().replace(/[^a-z ]+/g,' ').replace(/\s+/g,' ').trim();
export function locateArea(community?:string,emirate?:string):Spot|null{
 const c=COMMUNITIES[key(community)];if(c)return {c,z:13};
 const e=EMIRATES[key(emirate)];return e?{c:e,z:10.5}:null;
}
