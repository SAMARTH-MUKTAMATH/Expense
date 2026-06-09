"use client";

import { useEffect } from "react";

/**
 * Registers public/sw.js on mount. Only runs in the browser, only on HTTPS
 * (or localhost), and silently no-ops if the browser doesn't support service
 * workers. The SW itself is intentionally minimal — see public/sw.js.
 */
export function RegisterSW() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {
          /* swallow — install just won't be available */
        });
    };

    // Defer slightly so SW registration doesn't compete with the initial paint.
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
  }, []);

  return null;
}
