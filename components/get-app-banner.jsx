"use client";

import { useState, useSyncExternalStore } from "react";
import { Download, X, Zap } from "lucide-react";
import { useAppShell } from "@/hooks/use-app-shell";

const APK_PATH = "/budgetflow.apk";
const DISMISS_KEY = "bf_app_banner_dismissed_v1";

const subscribe = () => () => {};

function wasDismissed() {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export function GetAppBanner() {
  const { inApp, isAndroid } = useAppShell();
  const dismissedEarlier = useSyncExternalStore(subscribe, wasDismissed, () => true);
  const [dismissed, setDismissed] = useState(false);

  if (!isAndroid || inApp || dismissedEarlier || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  };

  return (
    <div className="fixed inset-x-3 bottom-4 z-50 mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-white/10 bg-[#161616] p-4 shadow-2xl shadow-black/60 animate-[fade-up_0.5s_ease-out]">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-ink shadow-md shadow-brand/40">
        <Zap size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white">Get the BudgetFLOW app</p>
        <p className="mt-0.5 text-xs leading-relaxed text-gray-400">
          Payments from your bank SMS get added automatically. Everything else
          works just like here.
        </p>
        <a
          href={APK_PATH}
          download
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-ink"
        >
          <Download size={16} />
          Download app
        </a>
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={dismiss}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-white/5 hover:text-white"
      >
        <X size={14} />
      </button>
    </div>
  );
}
