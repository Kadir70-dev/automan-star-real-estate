'use client';
import {createContext,useCallback,useContext,useEffect,useRef,useState} from 'react';

type Ask={title:string;body?:string;ok:string;danger?:boolean};
type Pending=Ask&{resolve:(ok:boolean)=>void};
const Ctx=createContext<(a:Ask)=>Promise<boolean>>(async()=>false);
export const useConfirm=()=>useContext(Ctx);

// In-page confirmation dialog (large buttons, works on phones, Esc = cancel).
export function ConfirmProvider({children}:{children:React.ReactNode}){
 const[pending,setPending]=useState<Pending|null>(null);
 const cancelRef=useRef<HTMLButtonElement>(null);
 const ask=useCallback((a:Ask)=>new Promise<boolean>(resolve=>setPending({...a,resolve})),[]);
 const close=useCallback((ok:boolean)=>{setPending(p=>{p?.resolve(ok);return null})},[]);
 useEffect(()=>{if(!pending)return;cancelRef.current?.focus();const k=(e:KeyboardEvent)=>{if(e.key==='Escape')close(false)};window.addEventListener('keydown',k);return()=>window.removeEventListener('keydown',k)},[pending,close]);
 return <Ctx.Provider value={ask}>{children}{pending&&<div className="pm-modal" onClick={e=>{if(e.target===e.currentTarget)close(false)}}>
  <div className="pm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="pm-confirm-title" aria-describedby={pending.body?'pm-confirm-body':undefined}>
   <h2 id="pm-confirm-title">{pending.title}</h2>
   {pending.body&&<p id="pm-confirm-body">{pending.body}</p>}
   <div className="pm-dialog-actions">
    <button ref={cancelRef} type="button" className="pm-btn" onClick={()=>close(false)}>Cancel</button>
    <button type="button" className={'pm-btn '+(pending.danger?'pm-danger':'pm-primary')} onClick={()=>close(true)}>{pending.ok}</button>
   </div>
  </div>
 </div>}</Ctx.Provider>;
}
