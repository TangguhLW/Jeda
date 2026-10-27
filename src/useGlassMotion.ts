import { useEffect, type RefObject } from "react";
import { gsap } from "gsap";

export function useGlassMotion(root: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    if (!root.current) return;
    const media = gsap.matchMedia();
    media.add(
      {
        motion: "(prefers-reduced-motion: no-preference)",
        fine: "(hover: hover) and (pointer: fine)",
      },
      (context) => {
        if (!context.conditions?.motion) return;
        const scene = root.current!.querySelector(".glass-scene");
        const animations = new Set<gsap.core.Timeline>();
        const layers = new Set<HTMLElement>();
        const bubble = (target: EventTarget | null, x?: number, y?: number) => {
          const button =
            target instanceof Element
              ? target.closest<HTMLElement>("button, a.apk-download")
              : null;
          if (
            !button ||
            button.matches(":disabled, [aria-disabled=true], .drawer-scrim") ||
            button.matches(".section-label > button:not(.icon-button)")
          )
            return;
          const bounds = button.getBoundingClientRect();
          const layer = document.createElement("span"),
            dot = document.createElement("span");
          layer.className = "tap-layer";
          dot.className = "tap-bubble";
          layer.setAttribute("aria-hidden", "true");
          const size = Math.max(bounds.width, bounds.height) * 2;
          Object.assign(dot.style, {
            width: size + "px",
            height: size + "px",
            left: (x == null ? bounds.width / 2 : x - bounds.left) + "px",
            top: (y == null ? bounds.height / 2 : y - bounds.top) + "px",
          });
          layer.append(dot);
          button.append(layer);
          layers.add(layer);
          const animation = gsap.timeline({
            onComplete: () => {
              layer.remove();
              layers.delete(layer);
              animations.delete(animation);
            },
          });
          animations.add(animation);
          animation
            .fromTo(
              dot,
              { scale: 0.04, opacity: 0.65 },
              { scale: 1, opacity: 0.18, duration: 0.5, ease: "power3.out" },
            )
            .to(dot, { scale: 1.12, opacity: 0, duration: 0.2 }, 0.4);
        };
        const down = (event: PointerEvent) => {
          if (event.isPrimary && event.button === 0)
            bubble(event.target, event.clientX, event.clientY);
        };
        const key = (event: KeyboardEvent) => {
          if (!event.repeat && (event.key === "Enter" || event.key === " "))
            bubble(event.target);
        };
        document.addEventListener("pointerdown", down, { passive: true });
        document.addEventListener("keydown", key);
        const x = scene
          ? gsap.quickTo(scene, "x", { duration: 0.9, ease: "power3.out" })
          : null;
        const y = scene
          ? gsap.quickTo(scene, "y", { duration: 0.9, ease: "power3.out" })
          : null;
        const move = (event: PointerEvent) => {
          if (
            document.hidden ||
            !context.conditions?.fine ||
            matchMedia("(max-width: 850px)").matches ||
            event.pointerType === "touch"
          )
            return;
          x?.((event.clientX / innerWidth - 0.5) * 18);
          y?.((event.clientY / innerHeight - 0.5) * 14);
        };
        const reset = () => {
          x?.(0);
          y?.(0);
        };
        root.current!.addEventListener("pointermove", move, { passive: true });
        const element = root.current!;
        element.addEventListener("pointerleave", reset);
        const resize = () => {
          if (matchMedia("(max-width: 850px)").matches) reset();
        };
        window.addEventListener("resize", resize);
        return () => {
          document.removeEventListener("pointerdown", down);
          document.removeEventListener("keydown", key);
          element.removeEventListener("pointermove", move);
          element.removeEventListener("pointerleave", reset);
          window.removeEventListener("resize", resize);
          animations.forEach((animation) => animation.kill());
          layers.forEach((layer) => layer.remove());
        };
      },
    );
    return () => media.revert();
  }, [root]);
}
