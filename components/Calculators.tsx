'use client';
import Link from 'next/link';
import {useId,useState} from 'react';
import {ArrowUpRight,Info} from 'lucide-react';
import {Price,usePrefs} from '@/components/Prefs';
import {minDownPct,mortgage,purchaseCosts,rentalYield,type Profile} from '@/lib/calc';
import type {Key} from '@/lib/i18n';

const PRICE_PICKS=[1_000_000,2_090_000,3_500_000,5_000_000,10_000_000];
const short=(n:number)=>n>=1_000_000?`${+(n/1_000_000).toFixed(2)}M`:`${Math.round(n/1000)}K`;

// Amount field that shows thousands separators while typing and keeps a numeric value.
function MoneyField({label,value,onChange,picks}:{label:string;value:number;onChange:(v:number)=>void;picks?:number[]}){
 const id=useId();
 return <div className="calc-field">
  <label htmlFor={id}>{label}</label>
  <span className="calc-input"><em>AED</em><input id={id} inputMode="numeric" autoComplete="off" value={value?value.toLocaleString('en-AE'):''} onChange={e=>{const n=Number(e.target.value.replace(/[^\d]/g,''));onChange(Number.isFinite(n)?Math.min(n,999_000_000):0)}}/></span>
  {picks&&<div className="calc-picks" role="group" aria-label={label}>{picks.map(p=><button type="button" key={p} aria-pressed={value===p} onClick={()=>onChange(p)}>{short(p)}</button>)}</div>}
 </div>;
}

// Slider paired with a number box, for percentages and years.
function RangeField({label,value,onChange,min,max,step,suffix,hint,warn}:{label:string;value:number;onChange:(v:number)=>void;min:number;max:number;step:number;suffix:string;hint?:string;warn?:boolean}){
 const id=useId();
 const pct=((value-min)/(max-min))*100;
 return <div className="calc-field">
  <div className="calc-range-head"><label htmlFor={id}>{label}</label><span className="calc-range-val"><input aria-label={label} type="number" inputMode="decimal" min={min} max={max} step={step} value={value} onChange={e=>onChange(Math.min(max,Math.max(min,Number(e.target.value)||0)))}/>{suffix}</span></div>
  <input id={id} className="calc-range" type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))} style={{'--fill':`${Math.max(0,Math.min(100,pct))}%`} as React.CSSProperties}/>
  {hint&&<p className={'calc-hint'+(warn?' calc-warn':'')} role={warn?'alert':undefined}>{warn&&<Info size={14} aria-hidden="true"/>}{hint}</p>}
 </div>;
}

function Bar({parts}:{parts:{label:string;value:number;tone:string}[]}){
 const total=parts.reduce((s,p)=>s+Math.max(0,p.value),0)||1;
 return <div className="calc-bar-wrap">
  <div className="calc-bar" aria-hidden="true">{parts.map(p=><span key={p.label} className={p.tone} style={{width:`${Math.max(0,p.value)/total*100}%`}}/>)}</div>
  <ul className="calc-legend">{parts.map(p=><li key={p.label}><i className={p.tone} aria-hidden="true"/>{p.label} <b>{Math.round(Math.max(0,p.value)/total*100)}%</b></li>)}</ul>
 </div>;
}

// Compact live result that stays in view on small screens while the inputs are edited.
function Mini({label,aed}:{label:string;aed:number}){return <div className="calc-mini" aria-hidden="true"><span>{label}</span><strong><Price aed={aed}/></strong></div>}

function Note(){const {t}=usePrefs();return <div className="calc-foot"><p className="calc-note">{t('calc.estimate')}</p><Link className="calc-ask" href="/contact">{t('tools.ask')} <ArrowUpRight size={16} aria-hidden="true"/></Link></div>}

export function MortgageCalculator(){
 const {t,dir}=usePrefs();
 const [price,setPrice]=useState(2_090_000);
 const [profile,setProfile]=useState<Profile>('resident');
 const [down,setDown]=useState(20);
 const [rate,setRate]=useState(4.5);
 const [years,setYears]=useState(25);
 const min=minDownPct(profile,price);
 const m=mortgage(price,down,rate,years);
 const profiles:[Profile,Key][]=[['resident','mort.resident'],['national','mort.national'],['nonresident','mort.nonresident']];
 return <section className="calc" dir={dir} aria-label={t('mort.title')}>
  <Mini label={t('mort.monthly')} aed={m.monthly}/>
  <div className="calc-form">
   <MoneyField label={t('calc.price')} value={price} onChange={setPrice} picks={PRICE_PICKS}/>
   <fieldset className="calc-field calc-seg"><legend>{t('mort.residency')}</legend>
    {profiles.map(([v,k])=><button type="button" key={v} aria-pressed={profile===v} onClick={()=>{setProfile(v);setDown(minDownPct(v,price))}}>{t(k)}</button>)}
   </fieldset>
   <RangeField label={t('mort.down')} value={down} onChange={setDown} min={0} max={80} step={1} suffix="%" warn={down<min} hint={down<min?t('mort.belowMin'):`${t('mort.min')}: ${min}%`}/>
   <RangeField label={t('mort.rate')} value={rate} onChange={setRate} min={1} max={10} step={0.05} suffix="%"/>
   <RangeField label={t('mort.years')} value={years} onChange={setYears} min={5} max={25} step={1} suffix=""/>
  </div>
  <div className="calc-result" aria-live="polite">
   <span className="calc-kicker">{t('mort.monthly')}</span>
   <strong className="calc-big"><Price aed={m.monthly}/></strong>
   <Bar parts={[{label:t('mort.down'),value:m.down,tone:'tone-sand'},{label:t('mort.loan'),value:m.loan,tone:'tone-light'}]}/>
   <dl>
    <div><dt>{t('mort.down')}</dt><dd><Price aed={m.down}/></dd></div>
    <div><dt>{t('mort.loan')}</dt><dd><Price aed={m.loan}/></dd></div>
    <div><dt>{t('mort.interest')}</dt><dd><Price aed={m.interest}/></dd></div>
    <div className="calc-total"><dt>{t('mort.total')}</dt><dd><Price aed={m.total}/></dd></div>
   </dl>
   <Note/>
  </div>
 </section>;
}

export function CostCalculator(){
 const {t,dir}=usePrefs();
 const [price,setPrice]=useState(2_090_000);
 const [offPlan,setOffPlan]=useState(false);
 const [withLoan,setWithLoan]=useState(false);
 const [ltv,setLtv]=useState(80);
 const [rent,setRent]=useState(140_000);
 const [service,setService]=useState(15_000);
 const loan=withLoan?Math.round(price*ltv/100):0;
 const c=purchaseCosts(price,{offPlan,loan});
 const y=rentalYield(price,rent,service);
 const cash=price+c.fees-loan;
 return <section className="calc" dir={dir} aria-label={t('cost.title')}>
  <Mini label={t('cost.cash')} aed={cash}/>
  <div className="calc-form">
   <MoneyField label={t('calc.price')} value={price} onChange={setPrice} picks={PRICE_PICKS}/>
   <fieldset className="calc-field calc-seg"><legend>{t('cost.status')}</legend>
    <button type="button" aria-pressed={!offPlan} onClick={()=>setOffPlan(false)}>{t('cost.ready')}</button>
    <button type="button" aria-pressed={offPlan} onClick={()=>setOffPlan(true)}>{t('cost.offplan')}</button>
   </fieldset>
   <label className="calc-switch"><input type="checkbox" role="switch" checked={withLoan} onChange={e=>setWithLoan(e.target.checked)}/><span aria-hidden="true"/>{t('cost.mortgage')}</label>
   {withLoan&&<RangeField label={t('cost.ltv')} value={ltv} onChange={setLtv} min={10} max={85} step={1} suffix="%" hint={`${t('mort.loan')}: AED ${loan.toLocaleString('en-AE')}`}/>}
   <div className="calc-group">
    <h3>{t('cost.yield')}</h3>
    <MoneyField label={t('cost.rent')} value={rent} onChange={setRent}/>
    <MoneyField label={t('cost.service')} value={service} onChange={setService}/>
   </div>
  </div>
  <div className="calc-result" aria-live="polite">
   <span className="calc-kicker">{t('cost.cash')}</span>
   <strong className="calc-big"><Price aed={cash}/></strong>
   <Bar parts={[{label:withLoan?t('mort.down'):t('calc.price').replace(/\s*\(.*\)/,''),value:price-loan,tone:'tone-light'},{label:t('cost.upfront'),value:c.fees,tone:'tone-sand'}]}/>
   <dl>{c.lines.map(l=><div key={l.key}><dt>{t(('cost.'+l.key) as Key)}</dt><dd><Price aed={l.amount}/></dd></div>)}
    <div className="calc-total"><dt>{t('cost.upfront')}</dt><dd><Price aed={c.fees}/></dd></div>
   </dl>
   <div className="calc-yield">
    <div><span>{t('cost.gross')}</span><strong>{y.gross.toFixed(2)}%</strong></div>
    <div><span>{t('cost.net')}</span><strong>{y.net.toFixed(2)}%</strong></div>
   </div>
   <Note/>
  </div>
 </section>;
}
