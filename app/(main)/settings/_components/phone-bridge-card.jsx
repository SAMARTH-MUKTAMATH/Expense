"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Download, Smartphone, Trash2, TriangleAlert, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { revokeIngestToken } from "@/actions/ingest-token";
import { useAppShell } from "@/hooks/use-app-shell";

const STALE_AFTER_DAYS = 3;
const APK_PATH = "/budgetflow.apk";

function formatWhen(iso) {
  if (!iso) return null;
  const date = new Date(iso);
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

function isStale(iso) {
  if (!iso) return false;
  const days = (Date.now() - new Date(iso).getTime()) / 86_400_000;
  return days > STALE_AFTER_DAYS;
}

export function PhoneBridgeCard({ status }) {
  const { ready, inApp, trackingOn, isAndroid } = useAppShell();
  const [pending, startTransition] = useTransition();

  const onDisconnect = () => {
    startTransition(async () => {
      try {
        await revokeIngestToken();
        toast.success("Phone disconnected. It will stop logging messages.");
      } catch (error) {
        toast.error(error.message || "Could not disconnect.");
      }
    });
  };

  const lastSeen = formatWhen(status.lastSeenAt);
  const stale = isStale(status.lastSeenAt);

  return (
    <div className="space-y-5 rounded-2xl border border-white/10 bg-[#161616] p-5">
      <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-[#0a0a0a] p-4">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
            status.hasToken ? "bg-brand text-ink" : "bg-white/5 text-gray-400"
          }`}
        >
          <Smartphone size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white">
            {status.hasToken ? "Phone connected" : "No phone connected"}
          </p>
          <p className="text-xs text-gray-400">
            {status.hasToken ? (
              <>
                Last message:{" "}
                <span className={stale ? "text-amber-400" : "text-gray-300"}>
                  {lastSeen ?? "none yet"}
                </span>
              </>
            ) : (
              "Payments are only added when you log them yourself."
            )}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
            status.hasToken
              ? "bg-brand/15 text-brand"
              : "bg-white/5 text-gray-400"
          }`}
        >
          {status.hasToken ? "On" : "Off"}
        </span>
      </div>

      {status.hasToken && stale && (
        <p className="flex items-start gap-2 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-200">
          <TriangleAlert size={16} className="mt-0.5 shrink-0" />
          No messages for over {STALE_AFTER_DAYS} days. Open the BudgetFLOW app
          and check auto tracking is still on.
        </p>
      )}

      {ready && inApp && trackingOn && (
        <p className="text-sm text-brand">Auto tracking is on for this phone.</p>
      )}

      {ready && inApp && !trackingOn && (
        <Button asChild className="btn-primary gap-2">
          <a href="paisa://start">
            <Zap size={16} />
            Turn on auto tracking
          </a>
        </Button>
      )}

      {ready && !inApp && isAndroid && (
        <ol className="space-y-5">
          <li className="space-y-2">
            <p className="text-sm font-medium text-white">1. Get the app</p>
            <Button asChild className="btn-primary gap-2">
              <a href={APK_PATH} download>
                <Download size={16} />
                Download app
              </a>
            </Button>
            <p className="text-xs text-white/40">
              Blocked by Play Protect? That happens to SMS apps from outside the
              Play Store. In Play Store, open Play Protect, turn off scanning,
              install, then turn it back on.
            </p>
          </li>
          <li className="space-y-2">
            <p className="text-sm font-medium text-white">2. Turn it on</p>
            <p className="text-sm text-white/60">
              Open the BudgetFLOW app, sign in, and tap Turn on auto tracking.
            </p>
          </li>
        </ol>
      )}

      {ready && !inApp && !isAndroid && (
        <p className="text-sm text-white/60">
          Open this page on your Android phone to get the app.
        </p>
      )}

      {status.hasToken && (
        <Button
          variant="outline"
          className="gap-2 border-red-400/30 bg-transparent text-red-300 hover:bg-red-500/10 hover:text-red-200"
          onClick={onDisconnect}
          disabled={pending}
        >
          <Trash2 size={16} />
          Disconnect phone
        </Button>
      )}
    </div>
  );
}
