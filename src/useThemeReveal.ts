import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import { flushSync } from 'react-dom';
import { useReducedMotion } from 'framer-motion';

export function useThemeReveal(dark:boolean,setDark:(value:boolean)=>void){
 const reduced=useReducedMotion();
 const busy=useRef(false);
 const current=useRef<Animation|null>(null);
 const [transitioning,setTransitioning]=useState(false);
 useEffect(()=>()=>{current.current?.cancel()},[]);
 const toggle=useCallback(async(event:MouseEvent<HTMLButtonElement>)=>{
  if(busy.current)return;
  const next=!dark;
  const apply=()=>{flushSync(()=>setDark(next));document.documentElement.dataset.theme=next?'dark':'light'};
  if(reduced||!document.startViewTransition){apply();return}
  const box=event.currentTarget.getBoundingClientRect();
  const x=box.left+box.width/2,y=box.top+box.height/2;
  const radius=Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y))+4;
  busy.current=true;setTransitioning(true);
  document.documentElement.dataset.themeTransition='running';
  try{
   const transition=document.startViewTransition(apply);
   await transition.ready;
   current.current=document.documentElement.animate(
    {clipPath:[`circle(0px at ${x}px ${y}px)`,`circle(${radius}px at ${x}px ${y}px)`]},
    {duration:720,easing:'cubic-bezier(.22,1,.36,1)',pseudoElement:'::view-transition-new(root)',fill:'both'},
   );
   await current.current.finished;
   await transition.finished;
  }catch{if(document.documentElement.dataset.theme!==(next?'dark':'light'))apply()}
  finally{current.current=null;busy.current=false;setTransitioning(false);delete document.documentElement.dataset.themeTransition}
 },[dark,reduced,setDark]);
 return {toggle,transitioning};
}
