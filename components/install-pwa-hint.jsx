"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

const DISMISS_FLAG = "bf_pwa_hint_dismissed_v1";

/**
 * Install-to-home-screen hint.
 *
 *   Android Chrome → captures the `beforeinstallprompt` event and shows a
 *     small lime "Install app" pill bottom-right. Tapping triggers the
 *     native install dialog.
 *   iOS Safari    → no automatic prompt exists; show a one-time slide-up
 *     instruction "Tap Share → Add to Home Screen".
 *   Already-installed (running standalone) → render nothing.
 *
 * Dismiss state persists in localStorage so we don't nag the user.
 */
export function InstallPwaHint() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(true); // assume dismissed until we know

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Skip entirely if the app is already installed/running as a PWA.
    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    if (isStandalone) return;

    // Honour any prior dismissal.
    try {
      if (window.localStorage.getItem(DISMISS_FLAG)) return;
    } catch {
      /* localStorage blocked — fall through and show the hint */
    }
    setDismissed(false);

    // Android / desktop Chromium-based browsers fire this when installable.
    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // iOS Safari heuristic — no UA sniffing for "Safari" specifically because
    // iOS Chrome/Edge actually run under iOS Safari's WebKit and the install
    // flow is identical.
    const ua = window.navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    if (isIos) setShowIosHint(true);

    return () =>
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  const dismiss = () => {
    setDismissed(true);
    setDeferredPrompt(null);
    setShowIosHint(false);
    try {
      window.localStorage.setItem(DISMISS_FLAG, "1");
    } catch {
      /* ignore */
    }
  };

  const triggerInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try {
      await deferredPrompt.userChoice;
    } catch {
      /* user dismissed */
    }
    dismiss();
  };

  if (dismissed) return null;

  // Android / Chromium — small lime pill bottom-right.
  if (deferredPrompt) {
    return (
      <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-brand text-ink shadow-lg shadow-brand/40 pl-3 pr-2 py-2 text-sm font-semibold animate-[fade-up_0.4s_ease-out]">
        <Download size={16} />
        <button
          type="button"
          onClick={triggerInstall}
          className="px-1 hover:underline"
        >
          Install app
        </button>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={dismiss}
          className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-black/10"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  // iOS — slide-up instruction card, bottom-center.
  if (showIosHint) {
    return (
      <div className="fixed bottom-4 inset-x-3 z-50 flex items-start gap-3 rounded-2xl border border-white/10 bg-[#161616] shadow-2xl shadow-black/60 p-4 animate-[fade-up_0.5s_ease-out] max-w-md mx-auto">
        <div className="h-9 w-9 rounded-lg bg-brand text-ink flex items-center justify-center shrink-0 shadow-md shadow-brand/40">
          <Share size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">
            Install BudgetFLOW
          </p>
          <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
            Tap <span className="font-semibold text-white">Share</span> below,
            then choose <span className="font-semibold text-white">Add to Home Screen</span>.
          </p>
        </div>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={dismiss}
          className="h-7 w-7 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 shrink-0"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return null;
}
