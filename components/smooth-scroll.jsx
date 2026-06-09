"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Global smooth-scrolling wrapper. Initialized once at the root layout.
 * Plays nicely with native anchors, fixed headers, and Clerk modals.
 */
export function SmoothScroll() {
  useEffect(() => {
    // Respect users who'd rather have native scroll (laptop trackpads in
    // particular hate smooth-scroll libraries) and anyone with prefers-
    // reduced-motion. Skip Lenis entirely on touch devices too — native
    // scroll there is already buttery and Lenis adds perceived input lag.
    if (typeof window === "undefined") return;
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isTouch || reducedMotion) return;

    const lenis = new Lenis({
      duration: 0.9, // snappier than the previous 1.1
      smoothWheel: true,
      smoothTouch: false,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return null;
}
