import { useEffect, type RefObject } from "react";
import { gsap } from "gsap";

export function useInterfaceMotion(ref: RefObject<HTMLElement | null>, key?: string) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(root.querySelectorAll("[data-enter]"), {
        opacity: 0, y: 18, rotationX: -4, transformPerspective: 900,
        duration: 0.65, stagger: 0.085, ease: "power3.out", clearProps: "all",
      });
      const move = (event: PointerEvent) => {
        if (event.pointerType !== "mouse") return;
        const target = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-depth]") : null;
        if (!target || !root.contains(target)) return;
        const rect = target.getBoundingClientRect();
        gsap.to(target, {
          rotationY: ((event.clientX - rect.left) / rect.width - 0.5) * 7,
          rotationX: -((event.clientY - rect.top) / rect.height - 0.5) * 7,
          transformPerspective: 1000, duration: 0.45, ease: "power2.out", overwrite: "auto",
        });
      };
      const reset = (event: PointerEvent) => {
        const target = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-depth]") : null;
        if (!target || (event.relatedTarget instanceof Node && target.contains(event.relatedTarget))) return;
        gsap.to(target, { rotationX: 0, rotationY: 0, duration: 0.7, ease: "elastic.out(1, 0.6)", overwrite: "auto" });
      };
      const press = (event: PointerEvent) => {
        const target = event.target instanceof Element ? event.target.closest<HTMLElement>("button, [data-tactile]") : null;
        if (!target || !root.contains(target)) return;
        gsap.fromTo(target, { scale: 0.94 }, { scale: 1, duration: 0.4, ease: "back.out(2)", clearProps: "scale", overwrite: "auto" });
      };
      root.addEventListener("pointermove", move);
      root.addEventListener("pointerout", reset);
      root.addEventListener("pointerdown", press);
      return () => {
        root.removeEventListener("pointermove", move);
        root.removeEventListener("pointerout", reset);
        root.removeEventListener("pointerdown", press);
      };
    }, root);
    return () => media.revert();
  }, [ref, key]);
}