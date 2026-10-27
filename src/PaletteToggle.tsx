import {useEffect,useState} from 'react';
import {motion,useReducedMotion} from 'framer-motion';
import {IconButton} from './ui';
export function PaletteToggle() {
  const [palette,setPalette]=useState<'pink'|'blue'>(()=>{try{return localStorage.getItem('jeda-palette')==='blue'?'blue':'pink';}catch{return 'pink';}});
  const reduced=useReducedMotion();
  useEffect(()=>{document.documentElement.dataset.palette=palette;try{localStorage.setItem('jeda-palette',palette);}catch{}},[palette]);
  return <span className="palette-toggle" data-color={palette}><IconButton label={palette==='pink'?'Gunakan biru pastel':'Gunakan pink pastel'} aria-pressed={palette==='blue'} onClick={()=>setPalette(value=>value==='pink'?'blue':'pink')}>
    <motion.span className="palette-glyph" animate={{rotate:palette==='blue'?180:0}} transition={reduced?{duration:0}:{type:'spring',stiffness:260,damping:26,mass:.8}}><span className="palette-pink"/><span className="palette-blue"/></motion.span>
  </IconButton></span>;
}
