"use server";

import { revalidatePath } from "next/cache";
import { checkUser } from "@/lib/checkUser";
import { parseSMSVerbose } from "@/lib/sms/parser";
import { categorizeTransaction } from "@/lib/sms/categorize";
import { persistParsedTransaction } from "@/lib/sms/persist";

const MAX_CHARS = 2000;

export async function importPastedSms({ text, sender = "" }) {
  const user = await checkUser();
  if (!user) throw new Error("Unauthorized");

  const body = typeof text === "string" ? text.trim() : "";
  if (!body) return { status: "empty" };
  if (body.length > MAX_CHARS) return { status: "too-long" };

  const { parsed, reason } = parseSMSVerbose(body, sender, new Date());
  if (!parsed) {
    return { status: "ignored", reason };
  }

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

  if (result.status !== "created") {
    return { status: result.status, reason: result.reason };
  }

  revalidatePath("/dashboard");
  revalidatePath("/review");

  return {
    status: "created",
    transactionId: result.transactionId,
    amount: parsed.amount,
    type: parsed.type,
    merchant: parsed.merchant,
    accountLast4: parsed.accountLast4,
    bank: parsed.bank,
    category: category.category,
    needsReview: result.needsReview,
  };
}
