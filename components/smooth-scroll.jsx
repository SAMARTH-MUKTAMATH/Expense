"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Global smooth-scrolling wrapper. Initialized once at the root layout.
 * Plays nicely with native anchors, fixed headers, and Clerk modals.
 */
export function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.1,
      smoothWheel: true,
      // Don't smooth touch — iOS/Android scroll is already smooth and
      // smoothing it again feels laggy on mobile.
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
