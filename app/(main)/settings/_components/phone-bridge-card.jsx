"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Copy, Check, Smartphone, RefreshCw, Trash2, TriangleAlert } from "lucide-react";
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

export function PhoneBridgeCard({ status, ingestUrl }) {
  const [token, setToken] = useState(null);
  const [copied, setCopied] = useState(null);
  const [pending, startTransition] = useTransition();

  const copy = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Could not copy. Select the text and copy manually.");
    }
  };

  const onGenerate = () => {
    startTransition(async () => {
      try {
        const { token: fresh } = await generateIngestToken();
        setToken(fresh);
        toast.success(
          status.hasToken ? "New token created. The old one no longer works." : "Token created."
        );
      } catch (error) {
        toast.error(error.message || "Could not create the token.");
      }
    });
  };

  const onRevoke = () => {
    startTransition(async () => {
      try {
        await revokeIngestToken();
        setToken(null);
        toast.success("Token revoked. Your phone can no longer post transactions.");
      } catch (error) {
        toast.error(error.message || "Could not revoke the token.");
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
          Connect your phone
        </CardTitle>
        <CardDescription className="text-white/60">
          Forward bank SMS to paisa and transactions get logged automatically. The
          token below is how your phone proves it is you.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* --- current state ------------------------------------------------ */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span className="text-white/60">
            Status:{" "}
            <span className={status.hasToken ? "text-brand" : "text-white/80"}>
              {status.hasToken ? "token active" : "not connected"}
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
            No messages for over {STALE_AFTER_DAYS} days. Android may have killed
            the forwarder in the background. Check it is still running on your phone.
          </p>
        )}

        {/* --- the token, shown exactly once -------------------------------- */}
        {token && (
          <div className="space-y-2 rounded-lg border border-brand/40 bg-brand/5 p-4">
            <p className="text-sm font-medium text-white">
              Copy this now. It is not shown again.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 break-all rounded bg-black/40 p-3 font-mono text-xs text-brand">
                {token}
              </code>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 border-white/15 bg-transparent text-white hover:bg-white/5 hover:text-white"
                onClick={() => copy(token, "token")}
              >
                {copied === "token" ? <Check size={16} /> : <Copy size={16} />}
              </Button>
            </div>
            <p className="text-xs text-white/50">
              Anyone holding this can add transactions to your account. Treat it
              like a password. If it leaks, generate a new one to invalidate it.
            </p>
          </div>
        )}

        {/* --- actions ------------------------------------------------------ */}
        <div className="flex flex-wrap gap-3">
          <Button className="btn-primary gap-2" onClick={onGenerate} disabled={pending}>
            <RefreshCw size={16} className={pending ? "animate-spin" : ""} />
            {status.hasToken ? "Generate a new token" : "Generate token"}
          </Button>
          {status.hasToken && (
            <Button
              variant="outline"
              className="gap-2 border-red-400/30 bg-transparent text-red-300 hover:bg-red-500/10 hover:text-red-200"
              onClick={onRevoke}
              disabled={pending}
            >
              <Trash2 size={16} />
              Revoke
            </Button>
          )}
        </div>

        {/* --- setup instructions ------------------------------------------- */}
        <details className="rounded-lg border border-white/10 bg-black/20 p-4">
          <summary className="cursor-pointer text-sm font-medium text-white">
            How to set up forwarding on your phone
          </summary>
          <div className="mt-4 space-y-3 text-sm text-white/70">
            <p>
              Install MacroDroid from the Play Store. It is free and one macro is
              all this needs.
            </p>
            <ol className="list-decimal space-y-2 pl-5">
              <li>Create a macro with the trigger <strong>SMS Received</strong>.</li>
              <li>
                Filter the sender so it only fires for your bank, for example a
                sender containing <code className="text-brand">UNIONB</code>.
              </li>
              <li>
                Add the action <strong>HTTP Request</strong>, method POST, to this
                address:
              </li>
            </ol>
            <div className="flex items-center gap-2">
              <code className="flex-1 break-all rounded bg-black/40 p-2 font-mono text-xs text-brand">
                {ingestUrl}
              </code>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 border-white/15 bg-transparent text-white hover:bg-white/5 hover:text-white"
                onClick={() => copy(ingestUrl, "url")}
              >
                {copied === "url" ? <Check size={16} /> : <Copy size={16} />}
              </Button>
            </div>
            <p>Add two headers:</p>
            <pre className="overflow-x-auto rounded bg-black/40 p-3 font-mono text-xs text-white/80">
{`Authorization: Bearer <your token>
Content-Type: application/json`}
            </pre>
            <p>And this request body, using MacroDroid&apos;s magic text:</p>
            <pre className="overflow-x-auto rounded bg-black/40 p-3 font-mono text-xs text-white/80">
{`{"sender":"[sms_sender]","body":"[sms_message]"}`}
            </pre>
            <p className="text-white/50">
              Then pay one rupee to yourself over UPI. The transaction should
              appear on your dashboard within a few seconds.
            </p>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
