import { db } from "../prisma.js";
import { after } from "next/server";
import { sendBudgetAlertIfOver } from "../jobs.js";
import { REVIEW_THRESHOLD } from "./parser.js";
import { istMonthKey, istMonthRange } from "../ist.js";

const BUDGET_THRESHOLD_PCT = 75;

async function resolveAccount(userId, accountLast4) {
  const accounts = await db.account.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  if (accounts.length === 0) return null;

  if (accountLast4) {
    const byName = accounts.find((a) =>
      String(a.name).replace(/\D/g, "").endsWith(accountLast4)
    );
    if (byName) return byName;
  }

  return accounts.find((a) => a.isDefault) ?? accounts[0];
}

async function fireBudgetAlertIfCrossed({ userId, account, addedAmount }) {
  try {
    if (!account.isDefault) return false;

    const budget = await db.budget.findUnique({ where: { userId } });
    if (!budget) return false;

    const budgetAmount = budget.amount.toNumber();
    if (budgetAmount <= 0) return false;

    const { start, end } = istMonthRange();

    const sum = await db.transaction.aggregate({
      where: {
        userId,
        accountId: account.id,
        type: "EXPENSE",
        date: { gte: start, lt: end },
      },
      _sum: { amount: true },
    });

    const totalAfter = sum._sum.amount?.toNumber() || 0;
    const totalBefore = totalAfter - addedAmount;

    const justCrossed =
      (totalBefore / budgetAmount) * 100 < BUDGET_THRESHOLD_PCT &&
      (totalAfter / budgetAmount) * 100 >= BUDGET_THRESHOLD_PCT;
    if (!justCrossed) return false;

    const alreadyAlertedThisMonth =
      budget.lastAlertSent && istMonthKey(budget.lastAlertSent) === istMonthKey(new Date());
    if (alreadyAlertedThisMonth) return false;

    after(() =>
      sendBudgetAlertIfOver({ budgetId: budget.id, accountId: account.id }).catch((error) =>
        console.error("[sms/persist] budget alert failed:", error)
      )
    );
    return true;
  } catch (error) {
    console.error("[sms/persist] budget alert check failed:", error.message);
    return false;
  }
}

async function findDuplicate(tx, userId, referenceId, messageText) {
  if (referenceId) {
    const byReference = await tx.transaction.findUnique({
      where: { userId_referenceId: { userId, referenceId } },
      select: { id: true },
    });
    if (byReference) return byReference;
  }
  return tx.transaction.findFirst({
    where: { userId, source: "SMS", rawMessage: messageText },
    select: { id: true },
  });
}

export async function persistParsedTransaction({ user, parsed, category, rawMessage }) {
  const account = await resolveAccount(user.id, parsed.accountLast4);
  if (!account) {
    return { status: "ignored", reason: "no-account" };
  }

  const messageText = rawMessage.replace(/\s+/g, " ").trim();
  const needsReview =
    Math.min(parsed.confidence, category.confidence) < REVIEW_THRESHOLD;
  const balanceChange = parsed.type === "EXPENSE" ? -parsed.amount : parsed.amount;

  const outcome = await db.$transaction(async (tx) => {
    // phone may deliver one SMS twice at once; serialize per user
    await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtext(${user.id}))`;

    const duplicate = await findDuplicate(tx, user.id, parsed.referenceId, messageText);
    if (duplicate) return { status: "duplicate", transactionId: duplicate.id };

    const created = await tx.transaction.create({
      data: {
        type: parsed.type,
        amount: parsed.amount,
        description: parsed.title,
        date: parsed.occurredAt,
        category: category.category,
        status: "COMPLETED",
        userId: user.id,
        accountId: account.id,
        source: "SMS",
        referenceId: parsed.referenceId,
        rawMessage: messageText,
        merchantName: parsed.merchant,
        parseConfidence: parsed.confidence,
        needsReview,
      },
    });

    await tx.account.update({
      where: { id: account.id },
      data: { balance: { increment: balanceChange } },
    });

    return { status: "created", transactionId: created.id };
  });

  if (outcome.status === "duplicate") return outcome;

  const budgetWarning =
    parsed.type === "EXPENSE" &&
    (await fireBudgetAlertIfCrossed({
      userId: user.id,
      account,
      addedAmount: parsed.amount,
    }));

  return { ...outcome, needsReview, budgetWarning };
}
