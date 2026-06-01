"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SparklesIcon } from "@/components/ui/sparkles";
import { toast } from "sonner";
import { requestAdvisorReport } from "@/actions/advisor";

// Total wait estimate. Gemini + DB + email step usually finish in ~30s. We
// give a small cushion. After this elapses we trigger a router.refresh which
// re-fetches the report list — if the real report has landed it'll appear and
// the pending card disappears via the unmount.
const WAIT_MS = 38_000;

const STATUS_MESSAGES = [
  { at: 0,     text: "Pulling your latest transactions..." },
  { at: 4_000, text: "Analyzing spending patterns..." },
  { at: 9_000, text: "Computing your financial health score..." },
  { at: 15_000, text: "Forecasting savings & cash flow..." },
  { at: 21_000, text: "Spotting opportunities to save..." },
  { at: 27_000, text: "Building your 12-month action plan..." },
  { at: 33_000, text: "Almost there — formatting your report..." },
];

function pickStatus(elapsedMs) {
  let current = STATUS_MESSAGES[0];
  for (const m of STATUS_MESSAGES) {
    if (elapsedMs >= m.at) current = m;
  }
  return current.text;
}

export function GenerateButton() {
  const [, startTransition] = useTransition();
  const [pendingMode, setPendingMode] = useState(null); // "web" | "email" | null
  const [elapsedMs, setElapsedMs] = useState(0);
  const startedAtRef = useRef(null);
  const router = useRouter();

  // Tick while pending so the progress bar + status messages update.
  useEffect(() => {
    if (!pendingMode) return;
    startedAtRef.current = performance.now();
    setElapsedMs(0);

    const tick = setInterval(() => {
      const now = performance.now();
      const e = now - startedAtRef.current;
      setElapsedMs(e);
      if (e >= WAIT_MS) {
        clearInterval(tick);
        // Refresh the page to fetch the new report; the pending state clears
        // when the user sees the new card.
        router.refresh();
        setPendingMode(null);
      }
    }, 200);

    return () => clearInterval(tick);
  }, [pendingMode, router]);

  const run = (deliveryMode) => {
    startTransition(async () => {
      try {
        const res = await requestAdvisorReport(deliveryMode);
        if (res?.rateLimited) {
          toast.warning(res.message || "Please wait before generating another report.");
          return;
        }
        if (!res?.success) {
          toast.error("Could not start the report. Please try again.");
          return;
        }
        // Kick off the engaging loader
        setPendingMode(deliveryMode);
        toast.success(
          deliveryMode === "email"
            ? "Report queued — we'll email the PDF and it'll appear here in ~30 seconds."
            : "Report queued — it'll appear here in ~30 seconds."
        );
      } catch (e) {
        toast.error(e?.message || "Failed to queue report.");
      }
    });
  };

  const isPending = !!pendingMode;
  const progressPct = Math.min(100, (elapsedMs / WAIT_MS) * 100);
  const statusText = pickStatus(elapsedMs);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button disabled={isPending} className="gap-2 btn-primary">
            <SparklesIcon size={16} />
            {isPending ? "Generating..." : "Generate now"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-72 bg-[#161616] border-white/10 text-white"
        >
          <DropdownMenuLabel className="text-xs text-gray-400 uppercase tracking-wider">
            How should we deliver it?
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-white/10" />
          <DropdownMenuItem
            onClick={() => run("web")}
            className="flex flex-col items-start gap-1 py-3 cursor-pointer focus:bg-white/5"
          >
            <span className="font-semibold text-white">Show on website only</span>
            <span className="text-xs text-gray-400">
              Report appears here. No email is sent.
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => run("email")}
            className="flex flex-col items-start gap-1 py-3 cursor-pointer focus:bg-white/5"
          >
            <span className="font-semibold text-white">
              Email me the PDF
              <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-[#89E900]">
                + saved here
              </span>
            </span>
            <span className="text-xs text-gray-400">
              PDF attached to your inbox. Also viewable here.
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {isPending && (
        <PendingCard
          mode={pendingMode}
          statusText={statusText}
          progressPct={progressPct}
        />
      )}
    </>
  );
}

function PendingCard({ mode, statusText, progressPct }) {
  return (
    <div className="mt-6 w-full rounded-xl border border-[#89E900]/30 bg-gradient-to-br from-[#161616] via-[#1a1f12] to-[#161616] p-5 sm:p-6 shadow-lg shadow-[#89E900]/10 relative overflow-hidden">
      {/* Subtle pulsing halo for life */}
      <div
        aria-hidden
        className="absolute -top-20 -right-20 h-48 w-48 rounded-full bg-[#89E900]/15 blur-3xl animate-pulse"
      />

      <div className="relative flex items-center gap-3 mb-4">
        <div className="h-9 w-9 rounded-lg bg-[#89E900] text-[#0a0a0a] flex items-center justify-center shadow-md shadow-[#89E900]/40">
          <SparklesIcon size={18} className="animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-[#89E900]">
            Generating your report
          </p>
          <p className="text-sm font-semibold text-white truncate">
            {statusText}
          </p>
        </div>
      </div>

      <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full bg-gradient-to-r from-[#89E900] via-emerald-400 to-[#89E900] transition-[width] duration-200 ease-linear"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <p className="mt-3 text-xs text-gray-400">
        {mode === "email"
          ? "Hang tight — we're crunching data, generating insights, rendering the PDF, and sending the email. About 30 seconds total."
          : "Hang tight — we're crunching data and generating insights. About 30 seconds total."}
      </p>
    </div>
  );
}
