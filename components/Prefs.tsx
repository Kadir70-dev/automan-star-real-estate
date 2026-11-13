'use client';
import {Coins,Globe} from 'lucide-react';
import {createContext,useCallback,useContext,useEffect,useMemo,useState} from 'react';
import {CURRENCIES,FALLBACK_RATES,formatMoney,isCurrency,type Currency,type Rates} from '@/lib/currency';
import {DICT,LANGS,isLang,type Key,type Lang} from '@/lib/i18n';

type Prefs={lang:Lang;currency:Currency;rates:Rates;live:boolean;setLang:(l:Lang)=>void;setCurrency:(c:Currency)=>void;t:(k:Key)=>string;dir:'ltr'|'rtl'};
const Ctx=createContext<Prefs|null>(null);
const LANG_KEY='automan-lang',CUR_KEY='automan-currency';
const read=(k:string)=>{try{return localStorage.getItem(k)}catch{return null}};
const write=(k:string,v:string)=>{try{localStorage.setItem(k,v)}catch{}};

export function PrefsProvider({children,rates=FALLBACK_RATES,live=false}:{children:React.ReactNode;rates?:Rates;live?:boolean}){
 const [lang,setLangState]=useState<Lang>('en');
 const [currency,setCurState]=useState<Currency>('AED');
 useEffect(()=>{const l=read(LANG_KEY),c=read(CUR_KEY);if(isLang(l))setLangState(l);if(isCurrency(c))setCurState(c)},[]);
 useEffect(()=>{document.documentElement.lang=lang==='en'?'en-AE':lang},[lang]);
 const setLang=useCallback((l:Lang)=>{setLangState(l);write(LANG_KEY,l)},[]);
 const setCurrency=useCallback((c:Currency)=>{setCurState(c);write(CUR_KEY,c)},[]);
 const value=useMemo<Prefs>(()=>({lang,currency,rates,live,setLang,setCurrency,t:k=>DICT[lang][k]??DICT.en[k],dir:LANGS.find(l=>l.code===lang)?.dir??'ltr'}),[lang,currency,rates,live,setLang,setCurrency]);
 return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

const fallback:Prefs={lang:'en',currency:'AED',rates:FALLBACK_RATES,live:false,setLang:()=>{},setCurrency:()=>{},t:k=>DICT.en[k],dir:'ltr'};
export const usePrefs=()=>useContext(Ctx)??fallback;

// An AED amount shown in the visitor's chosen currency; non-AED values are marked approximate.
export function Price({aed,className}:{aed:number;className?:string}){
 const {currency,rates}=usePrefs();
 if(!Number.isFinite(aed))return null;
 return <span className={className}>{currency==='AED'?formatMoney(aed,'AED',rates):<>≈ {formatMoney(aed,currency,rates)}<span className="sr-only"> (approximate, converted from AED {Math.round(aed).toLocaleString('en-AE')})</span></>}</span>;
}

export function PrefsSwitcher({className=''}:{className?:string}){
 const {lang,currency,setLang,setCurrency,t}=usePrefs();
 return <div className={'prefs-switch '+className}>
  <label className="prefs-pill"><Globe size={15} aria-hidden="true"/><span className="sr-only">{t('prefs.language')}</span><select value={lang} onChange={e=>isLang(e.target.value)&&setLang(e.target.value)} aria-label={t('prefs.language')}>{LANGS.map(l=><option key={l.code} value={l.code} lang={l.code}>{l.label}</option>)}</select></label>
  <label className="prefs-pill"><Coins size={15} aria-hidden="true"/><span className="sr-only">{t('prefs.currency')}</span><select value={currency} onChange={e=>isCurrency(e.target.value)&&setCurrency(e.target.value)} aria-label={t('prefs.currency')}>{CURRENCIES.map(c=><option key={c} value={c}>{c}</option>)}</select></label>
 </div>;
}

// Inline interface string that follows the selected language (English on the server).
export function T({k}:{k:Key}){return <>{usePrefs().t(k)}</>}

// Secondary line under an AED price, shown only when another currency is selected.
export function PriceAlt({aed}:{aed:number}){
 const {currency,rates}=usePrefs();
 if(currency==='AED'||!Number.isFinite(aed)||aed<=0)return null;
 return <span className="price-alt">≈ {formatMoney(aed,currency,rates)}</span>;
}
