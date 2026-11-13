// Buyer tools: calculator maths, currency fallback rates, language strings and routes.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';

const source=(path)=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const load=async(path)=>import('data:text/javascript,'+encodeURIComponent(stripTypeScriptTypes(source(path))));

test('mortgage payment matches the standard amortisation formula',async()=>{
 const {mortgage,minDownPct}=await load('lib/calc.ts');
 const m=mortgage(2_000_000,20,4.5,25);
 assert.equal(m.loan,1_600_000);
 assert.ok(Math.abs(m.monthly-8893.33)<1,`monthly ${m.monthly}`);
 assert.ok(Math.abs(m.total-m.loan-m.interest)<1e-6);
 assert.equal(mortgage(1_200_000,0,0,10).monthly,10_000);
 assert.equal(minDownPct('resident',4_000_000),20);
 assert.equal(minDownPct('resident',6_000_000),30);
 assert.equal(minDownPct('national',4_000_000),15);
 assert.equal(minDownPct('nonresident',1_000_000),40);
});

test('purchase costs include DLD 4%, trustee, agency and mortgage fees',async()=>{
 const {purchaseCosts,rentalYield,num}=await load('lib/calc.ts');
 const ready=purchaseCosts(2_000_000);
 const by=Object.fromEntries(ready.lines.map(l=>[l.key,l.amount]));
 assert.equal(by.dld,80_000);
 assert.equal(by.trustee,4200);
 assert.equal(by.agency,42_000);
 assert.ok(!('mreg' in by));
 const offPlan=Object.fromEntries(purchaseCosts(2_000_000,{offPlan:true}).lines.map(l=>[l.key,l.amount]));
 assert.ok(!('agency' in offPlan)&&!('trustee' in offPlan));
 const loan=Object.fromEntries(purchaseCosts(2_000_000,{loan:1_600_000}).lines.map(l=>[l.key,l.amount]));
 assert.equal(loan.mreg,4290);
 const y=rentalYield(2_000_000,140_000,20_000);
 assert.ok(Math.abs(y.gross-7)<1e-9&&Math.abs(y.net-6)<1e-9);
 assert.equal(num('1,250,000'),1_250_000);
});

test('currency fallback keeps the AED pegs and formats INR in lakh style',async()=>{
 const {FALLBACK_RATES,formatMoney,CURRENCIES}=await load('lib/currency.ts');
 assert.equal(FALLBACK_RATES.AED,1);
 assert.ok(Math.abs(FALLBACK_RATES.USD*3.6725-1)<1e-9);
 for(const c of CURRENCIES)assert.ok(FALLBACK_RATES[c]>0,c);
 assert.equal(formatMoney(1_000_000,'AED',FALLBACK_RATES),'AED 1,000,000');
 assert.equal(formatMoney(1_000_000,'INR',{...FALLBACK_RATES,INR:24}),'INR 2,40,00,000');
});

test('every language defines every interface string',async()=>{
 const {DICT,LANGS}=await load('lib/i18n.ts');
 const keys=Object.keys(DICT.en);
 for(const {code} of LANGS)for(const k of keys)assert.ok(DICT[code][k]?.trim(),`${code} missing ${k}`);
});

test('guides and calculators are linked, indexed and have unique slugs',async()=>{
 const {NEIGHBOURHOODS}=await load('lib/neighbourhoods.ts');
 const slugs=NEIGHBOURHOODS.map(n=>n.slug);
 assert.equal(new Set(slugs).size,slugs.length);
 const sitemap=source('app/sitemap.ts');
 for(const p of ['/calculators','/calculators/mortgage','/calculators/property-costs','/neighbourhoods'])assert.ok(sitemap.includes(`'${p}'`),p);
 assert.match(sitemap,/NEIGHBOURHOODS\.map/);
 const footer=source('components/Footer.tsx');
 for(const p of ['/calculators/mortgage','/calculators/property-costs','/neighbourhoods'])assert.ok(footer.includes(p),p);
 const guides=source('lib/neighbourhoods.ts');
 assert.doesNotMatch(guides,/AED\s?\d|yield of|ROI|guaranteed/i,'guides must not state prices or returns');
});
