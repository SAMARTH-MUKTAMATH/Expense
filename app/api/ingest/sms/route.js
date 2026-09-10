import { createHash } from "crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma";
import { parseSMSVerbose } from "@/lib/sms/parser";
import { categorizeTransaction } from "@/lib/sms/categorize";
import { persistParsedTransaction } from "@/lib/sms/persist";
import { isLikelyBankSender } from "@/lib/sms/banks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_CHARS = 2000;
const RATE_LIMIT_PER_MINUTE = 60;

const rateLimitBuckets = new Map();

function isRateLimited(userId) {
  const now = Date.now();
  const windowStart = now - 60_000;
  const hits = (rateLimitBuckets.get(userId) ?? []).filter((t) => t > windowStart);
  hits.push(now);
  rateLimitBuckets.set(userId, hits);

  if (rateLimitBuckets.size > 500) {
    for (const [key, times] of rateLimitBuckets) {
      if (times.every((t) => t <= windowStart)) rateLimitBuckets.delete(key);
    }
  }

  return hits.length > RATE_LIMIT_PER_MINUTE;
}

const json = (payload, status = 200) => Response.json(payload, { status });

// middleware skips Arcjet here, so these checks are everything
export async function POST(request) {
  const header = request.headers.get("authorization") || "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ error: "Unauthorized" }, 401);

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const user = await db.user.findUnique({
    where: { ingestTokenHash: tokenHash },
    select: { id: true },
  });
  if (!user) return json({ error: "Unauthorized" }, 401);

  if (isRateLimited(user.id)) {
    return json({ error: "Too many requests" }, 429);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const sender = typeof payload?.sender === "string" ? payload.sender.trim() : "";
  const body = typeof payload?.body === "string" ? payload.body : "";

  if (!body.trim()) return json({ error: "Missing body" }, 400);
  if (body.length > MAX_BODY_CHARS) return json({ error: "Body too large" }, 413);

  const receivedAt = payload?.receivedAt ? new Date(payload.receivedAt) : new Date();
  const validReceivedAt = Number.isNaN(receivedAt.getTime()) ? new Date() : receivedAt;

  await db.user.update({
    where: { id: user.id },
    data: { ingestLastSeenAt: new Date() },
  });

  if (sender && !isLikelyBankSender(sender)) {
    return json({ ignored: true, reason: "sender-not-a-bank" });
  }

  const { parsed, reason } = parseSMSVerbose(body, sender, validReceivedAt);
  if (!parsed) {
    return json({ ignored: true, reason });
  }

  try {
    const category = await categorizeTransaction({
      merchant: parsed.merchant,
      description: body,
      type: parsed.type,
      useAI: false,
    });

    const result = await persistParsedTransaction({
      user,
      parsed,
      category,
      rawMessage: body,
    });

    if (result.status === "duplicate") {
      return json({ duplicate: true, transactionId: result.transactionId });
    }
    if (result.status === "ignored") {
      return json({ ignored: true, reason: result.reason });
    }

    revalidatePath("/dashboard");

    return json(
      {
        created: true,
        transactionId: result.transactionId,
        amount: parsed.amount,
        type: parsed.type,
        merchant: parsed.merchant,
        category: category.category,
        categoryTier: category.tier,
        parseConfidence: parsed.confidence,
        needsReview: result.needsReview,
        budgetWarning: result.budgetWarning,
      },
      201
    );
  } catch (error) {
    console.error("[ingest/sms] failed:", error.message);
    return json({ error: "Ingest failed" }, 500);
  }
}
