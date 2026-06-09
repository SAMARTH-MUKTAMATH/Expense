"use server";

import { db } from "@/lib/prisma";
import { checkUser } from "@/lib/checkUser";

/**
 * Persist a browser-issued PushSubscription. Endpoint is unique — a re-call
 * with the same endpoint is a no-op (handled via upsert keyed on endpoint).
 */
export async function savePushSubscription(subscription) {
  const user = await checkUser();
  if (!user) throw new Error("Unauthorized");

  const { endpoint, keys } = subscription || {};
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    throw new Error("Invalid subscription payload");
  }

  await db.pushSubscription.upsert({
    where: { endpoint },
    update: { userId: user.id, p256dh: keys.p256dh, auth: keys.auth },
    create: {
      userId: user.id,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
  });

  return { success: true };
}

/**
 * Drop the subscription with the given endpoint for the current user.
 */
export async function deletePushSubscription(endpoint) {
  const user = await checkUser();
  if (!user) throw new Error("Unauthorized");

  await db.pushSubscription.deleteMany({
    where: { endpoint, userId: user.id },
  });
  return { success: true };
}

/**
 * Was this user already subscribed in the past on ANY device? Used so the
 * subscribe banner only shows if they truly have no subscriptions.
 */
export async function hasAnyPushSubscription() {
  const user = await checkUser();
  if (!user) return false;
  const found = await db.pushSubscription.findFirst({
    where: { userId: user.id },
    select: { id: true },
  });
  return !!found;
}
