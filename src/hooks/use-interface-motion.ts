import { useEffect, type RefObject } from "react";
import { gsap } from "gsap";

export function useInterfaceMotion(ref: RefObject<HTMLElement | null>, key?: string) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const media = gsap.matchMedia();
    media.add(
      "(prefers-reduced-motion: no-preference)",
      (context) => {
        gsap.from(root.querySelectorAll("[data-enter]"), {
          opacity: 0,
          y: 18,
          rotationX: -4,
          transformPerspective: 900,
          duration: 0.65,
          stagger: 0.085,
          ease: "power3.out",
          clearProps: "all",
        });
        let activeTouchTarget: HTMLElement | null = null;
        const tilt = context.add(
          "tilt",
          (target: HTMLElement, clientX: number, clientY: number) => {
            const rect = target.getBoundingClientRect();
            gsap.to(target, {
              rotationY: ((clientX - rect.left) / rect.width - 0.5) * 7,
              rotationX: -((clientY - rect.top) / rect.height - 0.5) * 7,
              transformPerspective: 1000,
              duration: 0.45,
              ease: "power2.out",
              overwrite: "auto",
            });
          },
        );
        const release = context.add("release", (target: HTMLElement | null) => {
          if (!target) return;
          gsap.to(target, {
            rotationX: 0,
            rotationY: 0,
            duration: 0.7,
            ease: "elastic.out(1, 0.6)",
            overwrite: "auto",
          });
        });
        const move = (event: PointerEvent) => {
          if (event.pointerType !== "mouse") return;
          const target =
            event.target instanceof Element
              ? event.target.closest<HTMLElement>("[data-depth]")
              : null;
          if (!target || !root.contains(target)) return;
          tilt(target, event.clientX, event.clientY);
        };
        const reset = (event: PointerEvent) => {
          const target =
            event.target instanceof Element
              ? event.target.closest<HTMLElement>("[data-depth]")
              : null;
          if (
            !target ||
            (event.relatedTarget instanceof Node && target.contains(event.relatedTarget))
          )
            return;
          release(target);
        };
        const touchStart = (event: TouchEvent) => {
          const touch = event.touches[0];
          const target =
            touch?.target instanceof Element
              ? touch.target.closest<HTMLElement>("[data-depth]")
              : null;
          if (!touch || !target || !root.contains(target)) return;
          activeTouchTarget = target;
          tilt(target, touch.clientX, touch.clientY);
        };
        const touchMove = (event: TouchEvent) => {
          const touch = event.touches[0];
          if (!touch || !activeTouchTarget) return;
          tilt(activeTouchTarget, touch.clientX, touch.clientY);
        };
        const touchEnd = () => {
          release(activeTouchTarget);
          activeTouchTarget = null;
        };
        const animatePress = context.add("press", (event: PointerEvent) => {
          const target =
            event.target instanceof Element
              ? event.target.closest<HTMLElement>("button, [data-tactile]")
              : null;
          if (!target || !root.contains(target)) return;
          gsap.fromTo(
            target,
            { scale: 0.94 },
            {
              scale: 1,
              duration: 0.4,
              ease: "back.out(2)",
              clearProps: "scale",
              overwrite: "auto",
            },
          );
        });
        const press = (event: PointerEvent) => animatePress(event);
        root.addEventListener("pointermove", move);
        root.addEventListener("pointerout", reset);
        root.addEventListener("pointerdown", press);
        root.addEventListener("touchstart", touchStart, { passive: true });
        root.addEventListener("touchmove", touchMove, { passive: true });
        root.addEventListener("touchend", touchEnd);
        root.addEventListener("touchcancel", touchEnd);
        return () => {
          root.removeEventListener("pointermove", move);
          root.removeEventListener("pointerout", reset);
          root.removeEventListener("pointerdown", press);
          root.removeEventListener("touchstart", touchStart);
          root.removeEventListener("touchmove", touchMove);
          root.removeEventListener("touchend", touchEnd);
          root.removeEventListener("touchcancel", touchEnd);
        };
      },
      root,
    );
    return () => media.revert();
  }, [ref, key]);
}
