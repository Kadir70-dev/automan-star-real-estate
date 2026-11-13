// Display currencies. Prices are stored in AED; other currencies are indicative conversions.
export const CURRENCIES=['AED','USD','EUR','GBP','INR','SAR','CNY'] as const;
export type Currency=typeof CURRENCIES[number];
export type Rates=Record<Currency,number>;

// Units of each currency per 1 AED. USD and SAR are fixed pegs; the rest are a
// fallback used only when the live rate service cannot be reached.
export const FALLBACK_RATES:Rates={AED:1,USD:1/3.6725,EUR:0.235,GBP:0.207,INR:24.0,SAR:3.75/3.6725,CNY:1.95};

export const isCurrency=(v:unknown):v is Currency=>CURRENCIES.includes(v as Currency);

export async function getRates():Promise<{rates:Rates;live:boolean}>{
 try{
  const res=await fetch('https://open.er-api.com/v6/latest/AED',{next:{revalidate:43200},signal:AbortSignal.timeout(4000)});
  if(!res.ok)throw new Error(String(res.status));
  const json=await res.json() as {result?:string;rates?:Record<string,number>};
  if(json.result!=='success'||!json.rates)throw new Error('bad payload');
  const rates={...FALLBACK_RATES};
  for(const c of CURRENCIES){const r=json.rates[c];if(typeof r==='number'&&r>0)rates[c]=r}
  rates.AED=1;
  return {rates,live:true};
 }catch{return {rates:FALLBACK_RATES,live:false}}
}

export function formatMoney(aed:number,currency:Currency,rates:Rates){
 const value=aed*(rates[currency]||1);
 const digits=value>=1000?0:2;
 return `${currency} ${new Intl.NumberFormat(currency==='INR'?'en-IN':'en-AE',{maximumFractionDigits:digits}).format(value)}`;
}
