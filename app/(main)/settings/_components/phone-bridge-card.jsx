"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Download, Smartphone, Trash2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { revokeIngestToken } from "@/actions/ingest-token";

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
    <Card className="glass-dark border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Smartphone size={20} className="text-brand" />
          Automatic tracking
        </CardTitle>
        <CardDescription className="text-white/60">
          Install the BudgetFLOW app on your Android phone once. After that every
          bank SMS is logged the moment it arrives, even when the app is closed.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span className="text-white/60">
            Status:{" "}
            <span className={status.hasToken ? "text-brand" : "text-white/80"}>
              {status.hasToken ? "connected" : "not connected"}
            </span>
          </span>
          {status.hasToken && (
            <span className="text-white/60">
              Last message:{" "}
              <span className={stale ? "text-amber-400" : "text-white/80"}>
                {lastSeen ?? "none yet"}
              </span>
            </span>
          )}
        </div>

        {status.hasToken && stale && (
          <p className="flex items-start gap-2 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-200">
            <TriangleAlert size={16} className="mt-0.5 shrink-0" />
            No messages for over {STALE_AFTER_DAYS} days. Open the app on your
            phone and check it still says Auto tracking is on.
          </p>
        )}

        <ol className="space-y-5">
          <li className="space-y-2">
            <p className="text-sm font-medium text-white">1. Install the app</p>
            <p className="text-sm text-white/60">
              Download it on your Android phone and install it. If Android asks to
              allow installs from your browser, allow it.
            </p>
            <Button asChild className="btn-primary gap-2">
              <a href={APK_PATH} download>
                <Download size={16} />
                Download app
              </a>
            </Button>
            <p className="text-xs text-white/40">
              Blocked by Play Protect? That happens to SMS apps from outside the Play
              Store. In Play Store, open Play Protect, turn off scanning, install, then
              turn it back on.
            </p>
          </li>

          <li className="space-y-2">
            <p className="text-sm font-medium text-white">2. Tap Start auto tracking</p>
            <p className="text-sm text-white/60">
              Open the app, tap Start auto tracking and allow SMS access. That is all.
            </p>
          </li>
        </ol>

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
      </CardContent>
    </Card>
  );
}
