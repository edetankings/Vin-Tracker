import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export function ProgressRing({
  percent,
  size = 88,
  stroke = 9,
}: {
  percent: number;
  size?: number;
  stroke?: number;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference;
  const ring = useRef<SVGCircleElement>(null);
  useEffect(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(ring.current, { strokeDashoffset: circumference }, { strokeDashoffset: offset, duration: 0.9, ease: "power3.out" });
    });
    return () => media.revert();
  }, [circumference, offset]);

  return (
    <svg width={size} height={size} className="-rotate-90" role="img" aria-label={`${percent}% complete`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={stroke}
        className="stroke-primary/15"
      />
      <circle
        ref={ring}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="progress-arc stroke-primary"
      />
    </svg>
  );
}
