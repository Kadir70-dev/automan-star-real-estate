// Buyer calculator maths. Fee rules follow commonly published Dubai purchase costs and
// UAE Central Bank loan-to-value limits; all results are estimates for guidance.
export type Profile='resident'|'national'|'nonresident';

// Typical minimum down payment (% of price) for a first home.
export function minDownPct(profile:Profile,price:number){
 if(profile==='nonresident')return 40;          // bank policy, commonly 40-50%
 if(profile==='national')return price>5_000_000?25:15;
 return price>5_000_000?30:20;
}

export function mortgage(price:number,downPct:number,ratePct:number,years:number){
 const loan=Math.max(0,price*(1-downPct/100));
 const n=Math.max(1,Math.round(years*12));
 const r=ratePct/100/12;
 const monthly=r>0?loan*r/(1-Math.pow(1+r,-n)):loan/n;
 const total=monthly*n;
 return {loan,monthly,total,interest:total-loan,down:price-loan};
}

const VAT=0.05;
export type CostLine={key:'dld'|'admin'|'trustee'|'agency'|'mreg'|'bank'|'valuation';amount:number};

export function purchaseCosts(price:number,{offPlan=false,loan=0}:{offPlan?:boolean;loan?:number}={}){
 const lines:CostLine[]=[
  {key:'dld',amount:price*0.04},
  {key:'admin',amount:offPlan?1150:580},
 ];
 if(!offPlan){
  lines.push({key:'trustee',amount:(price>=500_000?4000:2000)*(1+VAT)});
  lines.push({key:'agency',amount:price*0.02*(1+VAT)});
 }
 if(loan>0){
  lines.push({key:'mreg',amount:loan*0.0025+290});
  lines.push({key:'bank',amount:loan*0.01*(1+VAT)});
  lines.push({key:'valuation',amount:3000*(1+VAT)});
 }
 const fees=lines.reduce((s,l)=>s+l.amount,0);
 return {lines,fees};
}

export function rentalYield(price:number,rent:number,service:number){
 if(price<=0)return {gross:0,net:0};
 return {gross:rent/price*100,net:(rent-service)/price*100};
}

export const num=(v:string)=>{const n=Number(v.replace(/[^\d.]/g,''));return Number.isFinite(n)?n:0};
