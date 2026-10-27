import {useEffect,useRef,useState} from 'react';
export function AmbientBackground() {
  const element=useRef<HTMLDivElement>(null);
  const [visible,setVisible]=useState(true);
  useEffect(()=>{
    const sync=()=>{document.documentElement.dataset.motionPaused=String(document.hidden);};
    sync();document.addEventListener('visibilitychange',sync);
    const observer=new IntersectionObserver(entries=>setVisible(entries.some(entry=>entry.isIntersecting)));
    if(element.current)observer.observe(element.current);
    return()=>{observer.disconnect();document.removeEventListener('visibilitychange',sync);};
  },[]);
  return <div ref={element} className="glass-scene ambient-scene" aria-hidden="true" data-active={visible}>
    <div className="ambient-drift"><span className="ambient-ribbon ribbon-one"/><span className="ambient-ribbon ribbon-two"/><span className="ambient-ribbon ribbon-three"/></div>
  </div>;
}
