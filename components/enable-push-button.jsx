"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";
import { savePushSubscription } from "@/actions/push";

// Convert the URL-safe base64 VAPID public key into the Uint8Array the
// PushManager.subscribe() call needs.
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function EnablePushButton({ compact = false }) {
  const [permission, setPermission] = useState("default");
  const [subscribed, setSubscribed] = useState(false);
  const [pending, setPending] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setSupported(false);
      return;
    }
    setPermission(Notification.permission);

    // Already subscribed on this device?
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((s) => setSubscribed(!!s))
      .catch(() => {});
  }, []);

  const enable = async () => {
    setPending(true);
    try {
      const reg = await navigator.serviceWorker.ready;

      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        toast.warning("Notifications denied. You can enable them in browser settings.");
        return;
      }

      const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!pub) {
        toast.error("Push not configured (missing VAPID public key).");
        return;
      }

      // If there's already a subscription, reuse it.
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(pub),
        });
      }

      const res = await savePushSubscription(sub.toJSON());
      if (res?.success) {
        setSubscribed(true);
        toast.success("Notifications enabled. You'll get budget alerts here.");
      } else {
        toast.error("Could not save your subscription.");
      }
    } catch (e) {
      toast.error(e?.message || "Failed to enable notifications.");
    } finally {
      setPending(false);
    }
  };

  if (!supported) return null;
  if (subscribed) {
    return (
      <button
        type="button"
        disabled
        className={`inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/5 text-xs ${
          compact ? "px-2.5 py-1.5" : "px-3 py-2"
        } text-gray-300 cursor-default`}
        title="Notifications enabled on this device"
      >
        <Bell size={14} />
        Notifications on
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={enable}
      disabled={pending}
      className={`inline-flex items-center gap-2 rounded-md btn-primary text-xs font-semibold ${
        compact ? "px-2.5 py-1.5" : "px-3 py-2"
      }`}
    >
      {pending ? (
        <BellOff size={14} className="animate-pulse" />
      ) : (
        <Bell size={14} />
      )}
      {pending ? "Enabling…" : "Enable notifications"}
    </button>
  );
}
