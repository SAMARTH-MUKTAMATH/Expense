"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Download, Smartphone, Link2, Trash2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { generateIngestToken, revokeIngestToken } from "@/actions/ingest-token";

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

function buildConnectLink(token, ingestUrl) {
  return `paisa://connect?${new URLSearchParams({ token, api: ingestUrl })}`;
}

export function PhoneBridgeCard({ status, ingestUrl }) {
  const [connectLink, setConnectLink] = useState(null);
  const [pending, startTransition] = useTransition();

  const onConnect = () => {
    startTransition(async () => {
      try {
        const { token } = await generateIngestToken();
        const link = buildConnectLink(token, ingestUrl);
        setConnectLink(link);
        window.location.href = link;
      } catch (error) {
        toast.error(error.message || "Could not connect this phone.");
      }
    });
  };

  const onDisconnect = () => {
    startTransition(async () => {
      try {
        await revokeIngestToken();
        setConnectLink(null);
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
            phone and check it still says Connected.
          </p>
        )}

        <ol className="space-y-5">
          <li className="space-y-2">
            <p className="text-sm font-medium text-white">1. Install the app</p>
            <p className="text-sm text-white/60">
              Open this page on your Android phone and download it. If Android asks
              to allow installs from your browser, allow it.
            </p>
            <Button asChild className="btn-primary gap-2">
              <a href={APK_PATH} download>
                <Download size={16} />
                Download app
              </a>
            </Button>
          </li>

          <li className="space-y-2">
            <p className="text-sm font-medium text-white">2. Connect it</p>
            <p className="text-sm text-white/60">
              Tap the button on the same phone. The app opens, asks for SMS access,
              and that is it.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button className="btn-primary gap-2" onClick={onConnect} disabled={pending}>
                <Link2 size={16} />
                {status.hasToken ? "Reconnect this phone" : "Connect this phone"}
              </Button>
              {connectLink && (
                <Button
                  asChild
                  variant="outline"
                  className="gap-2 border-white/15 bg-transparent text-white hover:bg-white/5 hover:text-white"
                >
                  <a href={connectLink}>Open the app</a>
                </Button>
              )}
            </div>
            {connectLink && (
              <p className="text-xs text-white/50">
                If the app did not open, tap Open the app. Nothing happens on a
                computer, this step needs the phone.
              </p>
            )}
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
