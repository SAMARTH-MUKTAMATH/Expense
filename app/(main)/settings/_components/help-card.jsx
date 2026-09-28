"use client";

import Link from "next/link";
import { BellDot, ChevronRight, Compass } from "lucide-react";

function Row({ Icon, title, detail }) {
  return (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand">
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-white">{title}</span>
        <span className="block text-xs text-gray-400">{detail}</span>
      </span>
      <ChevronRight size={16} className="shrink-0 text-gray-500" />
    </>
  );
}

const ROW_CLASS =
  "flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-white/5";

export function HelpCard() {
  return (
    <div className="divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-[#161616]">
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event("bf:open-onboarding"))}
        className={ROW_CLASS}
      >
        <Row
          Icon={Compass}
          title="App tour"
          detail="A one-minute walk through every feature."
        />
      </button>
      <Link href="/review" className={ROW_CLASS}>
        <Row
          Icon={BellDot}
          title="Review queue"
          detail="Auto-imported payments the parser was unsure about."
        />
      </Link>
    </div>
  );
}
