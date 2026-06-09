import webpush from "web-push";
import { db } from "@/lib/prisma";

let configured = false;

function ensureConfigured() {
  if (configured) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:hello@budgetflow.app";
  if (!pub || !priv) {
    console.warn(
      "[push] VAPID keys missing — set NEXT_PUBLIC_VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY"
    );
    return false;
  }
  webpush.setVapidDetails(subject, pub, priv);
  configured = true;
  return true;
}

/**
 * Send a push notification payload to every subscription owned by a user.
 * Subscriptions that the browser/OS rejects with 404/410 are auto-deleted
 * so we don't keep retrying dead endpoints.
 *
 * @param {string} userId — User.id (NOT clerkUserId)
 * @param {{ title: string, body: string, url?: string, tag?: string }} payload
 * @returns {Promise<{ sent: number, removed: number }>}
 */
export async function sendPushToUser(userId, payload) {
  if (!ensureConfigured()) return { sent: 0, removed: 0 };

  const subs = await db.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return { sent: 0, removed: 0 };

  const json = JSON.stringify(payload);
  let sent = 0;
  const toRemove = [];

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          },
          json
        );
        sent++;
      } catch (err) {
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          toRemove.push(s.id);
        } else {
          console.warn("[push] send failed:", err?.statusCode, err?.body);
        }
      }
    })
  );

  if (toRemove.length > 0) {
    await db.pushSubscription.deleteMany({ where: { id: { in: toRemove } } });
  }

  return { sent, removed: toRemove.length };
}
