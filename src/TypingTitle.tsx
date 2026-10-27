import { useEffect, useState } from "react";
import { gsap } from "gsap";

export default function TypingTitle({ text: title }: { text: string }) {
  const [count, setCount] = useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches?title.length:0);
  useEffect(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const progress = { count: 0 };
      setCount(0);
      const timeline=gsap
        .timeline({ repeat: -1, delay: 0.15 })
        .to(progress, {
          count: title.length,
          duration: 1.55,
          ease: "none",
          onUpdate: () => setCount(Math.floor(progress.count)),
        })
        .to(progress, { count: title.length, duration: 3.2 })
        .to(progress, {
          count: 0,
          duration: 0.8,
          ease: "power1.inOut",
          onUpdate: () => setCount(Math.floor(progress.count)),
        })
        .to(progress, { count: 0, duration: 0.35 });
      const sync=()=>{if(document.hidden)timeline.pause();else timeline.resume();};
      sync();document.addEventListener('visibilitychange',sync);
      return () => {timeline.kill();document.removeEventListener('visibilitychange',sync);};
    });
    media.add("(prefers-reduced-motion: reduce)",()=>{setCount(title.length);});
    return () => media.revert();
  }, [title]);
  return (
    <span className="typing-title" aria-hidden="true">
      <span className="typing-reserve">{title}</span>
      <span className="typing-ink">
        {title.slice(0, count)}
        <span
          className={
            count < title.length ? "typing-caret" : "typing-caret finished"
          }
        >
          |
        </span>
      </span>
    </span>
  );
}
