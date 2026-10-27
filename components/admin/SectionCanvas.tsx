'use client';
import {useState} from 'react';
import type {CmsField} from '@/lib/cms-schema';
import type {CmsDocument} from '@/lib/cms';
import {fieldRole,splitGroups,type StudioSection} from '@/lib/cms-sections';

type Props={section:StudioSection;draft:CmsDocument;live:Record<string,string>;onField:(key:string,value:string)=>void;onSeo:(key:keyof CmsDocument['seo'],value:string)=>void;onPickImage:(key:string)=>void};

// Click-to-edit text that renders in place, styled like the website section.
export function Editable({value,label,multiline,className,onChange}:{value:string;label:string;multiline?:boolean;className?:string;onChange:(v:string)=>void}){
 const[editing,setEditing]=useState(false);
 if(editing){
  const common={autoFocus:true,value,'aria-label':label,onChange:(e:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>)=>onChange(e.target.value),onBlur:()=>setEditing(false),
   onKeyDown:(e:React.KeyboardEvent)=>{if(e.key==='Escape'||(e.key==='Enter'&&!multiline))(e.target as HTMLElement).blur()},className:'st-input '+(className??'')};
  return multiline?<textarea rows={Math.max(3,Math.ceil(value.length/70))} {...common}/>:<input {...common}/>;
 }
 return <span role="button" tabIndex={0} title={'Edit '+label} className={'st-editable '+(className??'')+(value?'':' st-empty')}
  onClick={()=>setEditing(true)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setEditing(true)}}}>{value||'+ '+label}</span>;
}

function ImageSlot({src,label,className,onPick}:{src:string;label:string;className?:string;onPick:()=>void}){
 return <button type="button" className={'st-image '+(className??'')} onClick={onPick} title={'Change '+label}>
  {src?<img src={src} alt=""/>:<span className="st-image-empty">+ {label}</span>}
  <span className="st-image-badge">Change image</span>
 </button>;
}

function Fields({fields,value,props,card}:{fields:CmsField[];value:(k:string)=>string;props:Props;card?:boolean}){
 const by=(r:ReturnType<typeof fieldRole>)=>fields.filter(f=>fieldRole(f)===r);
 const edit=(f:CmsField,cls:string,multiline=false)=><Editable key={f.key} value={value(f.key)} label={f.label} multiline={multiline} className={cls} onChange={v=>props.onField(f.key,v)}/>;
 const images=by('image');
 return <>
  {card&&images.map(f=><ImageSlot key={f.key} src={value(f.key)} label={f.label} className="st-card-image" onPick={()=>props.onPickImage(f.key)}/>)}
  {by('text').map(f=>edit(f,'st-eyebrow'))}
  {by('heading').map(f=>edit(f,card?'st-card-title':'st-heading'))}
  {by('paragraph').map(f=>edit(f,'st-copy',true))}
  {(by('button').length>0||by('link').length>0)&&<div className="st-buttons">
   {by('button').map((f,i)=>edit(f,i?'st-btn st-btn-outline':'st-btn'))}
   {by('link').map(f=><span key={f.key} className="st-link">↗ {edit(f,'')}</span>)}
  </div>}
  {!card&&images.length>1&&<div className="st-thumbs">{images.slice(1).map(f=><figure key={f.key}><ImageSlot src={value(f.key)} label={f.label} onPick={()=>props.onPickImage(f.key)}/><figcaption>{f.label}</figcaption></figure>)}</div>}
  {by('alt').length>0&&<div className="st-alts">{by('alt').map(f=><label key={f.key}><small>{f.label}</small>{edit(f,'st-alt')}</label>)}</div>}
 </>;
}

export default function SectionCanvas(props:Props){
 const{section,draft,live}=props;
 const value=(k:string)=>draft.fields[k]??live[k]??'';
 if(section.kind==='seo')return <SeoCanvas {...props}/>;
 const{top,cards}=splitGroups(section.fields);
 const bg=top.find(f=>f.type==='image');
 const bgSrc=bg?value(bg.key):'';
 return <section className={'st-canvas'+(bgSrc?' st-has-bg':'')}>
  {bg&&<div className="st-bg">{bgSrc&&<img src={bgSrc} alt=""/>}<div className="st-bg-shade"/></div>}
  {bg&&<button type="button" className="st-bg-change" onClick={()=>props.onPickImage(bg.key)}>Change background · {bg.label}</button>}
  <div className="st-canvas-inner">
   <p className="st-kicker">{section.pageName.toUpperCase()} · {section.name.toUpperCase()}</p>
   <Fields fields={top} value={value} props={props}/>
   {cards.length>0&&<div className="st-cards">{cards.map(c=><article key={c.id} className="st-card"><Fields fields={c.fields} value={value} props={props} card/></article>)}</div>}
  </div>
 </section>;
}

function SeoCanvas({section,draft,onSeo,onPickImage}:Props){
 const seo=draft.seo;
 return <section className="st-canvas st-seo">
  <div className="st-canvas-inner">
   <p className="st-kicker">{section.pageName.toUpperCase()} · GOOGLE &amp; SOCIAL PREVIEW</p>
   <div className="st-serp">
    <small>automanstarrealty.com{seo.canonical||section.path}</small>
    <Editable value={seo.title} label="SEO title (blank = default)" className="st-serp-title" onChange={v=>onSeo('title',v.slice(0,140))}/>
    <Editable value={seo.description} label="Meta description (blank = default)" multiline className="st-serp-desc" onChange={v=>onSeo('description',v.slice(0,500))}/>
   </div>
   <div className="st-seo-grid">
    <figure><ImageSlot src={seo.og_image} label="Social share image" onPick={()=>onPickImage('seo:og_image')}/><figcaption>Social share image (WhatsApp, LinkedIn, X)</figcaption></figure>
    <div>
     <label><small>Canonical path</small><Editable value={seo.canonical} label="e.g. /about" className="st-alt" onChange={v=>onSeo('canonical',v)}/></label>
     <small>Search engines</small>
     <div className="st-toggle">{(['index','noindex'] as const).map(r=><button key={r} type="button" aria-pressed={(seo.robots||'index')===r} onClick={()=>onSeo('robots',r)}>{r==='index'?'Show in Google':'Hide from Google'}</button>)}</div>
    </div>
   </div>
  </div>
 </section>;
}
