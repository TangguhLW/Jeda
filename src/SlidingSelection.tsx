import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { motion, useReducedMotion, useSpring } from 'framer-motion';

const glide = { stiffness: 245, damping: 32, mass: 1.05 };
export function SlidingSelection({value,variant,label,children}:{value:string;variant:'modes'|'navigation';label:string;children:ReactNode}) {
 const root=useRef<HTMLDivElement>(null);
 const initialized=useRef(false);
 const reduced=useReducedMotion();
 const x=useSpring(0,glide),y=useSpring(0,glide),width=useSpring(0,glide),height=useSpring(0,glide);
 useLayoutEffect(()=>{
  const group=root.current;if(!group)return;
  const measure=()=>{
   const active=group.querySelector<HTMLElement>('[data-selection-active="true"]');if(!active)return;
   const next=[active.offsetLeft,active.offsetTop,active.offsetWidth,active.offsetHeight];
   [x,y,width,height].forEach((v,i)=>{if(!initialized.current||reduced)v.jump(next[i]);else v.set(next[i])});
   initialized.current=true;
  };
  measure();const observer=new ResizeObserver(measure);observer.observe(group);
  group.querySelectorAll('button').forEach(button=>observer.observe(button));
  return()=>observer.disconnect();
 },[value,reduced,x,y,width,height]);
 return <div ref={root} className={`selection-group ${variant==='modes'?'mode-tabs':'navigation-options'}`} role="group" aria-label={label}>
  <motion.span aria-hidden="true" className={`selection-indicator ${variant==='modes'?'tab-indicator':'navigation-indicator'}`} style={{x,y,width,height}}/>
  {children}
 </div>;
}
