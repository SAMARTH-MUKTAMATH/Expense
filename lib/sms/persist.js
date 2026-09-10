import { db } from "../prisma.js";
import { inngest } from "../inngest/client.js";
import { REVIEW_THRESHOLD } from "./parser.js";

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

    const startDate = new Date();
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const sum = await db.transaction.aggregate({
      where: {
        userId,
        accountId: account.id,
        type: "EXPENSE",
        date: { gte: startDate },
      },
      _sum: { amount: true },
    });

    const totalAfter = sum._sum.amount?.toNumber() || 0;
    const totalBefore = totalAfter - addedAmount;

    const justCrossed =
      (totalBefore / budgetAmount) * 100 < BUDGET_THRESHOLD_PCT &&
      (totalAfter / budgetAmount) * 100 >= BUDGET_THRESHOLD_PCT;
    if (!justCrossed) return false;

    const lastAlert = budget.lastAlertSent ? new Date(budget.lastAlertSent) : null;
    const now = new Date();
    const alreadyAlertedThisMonth =
      lastAlert &&
      lastAlert.getMonth() === now.getMonth() &&
      lastAlert.getFullYear() === now.getFullYear();
    if (alreadyAlertedThisMonth) return false;

    await inngest.send({
      name: "budget.threshold.crossed",
      data: { budgetId: budget.id, userId, accountId: account.id },
    });
    return true;
  } catch (error) {
    console.error("[sms/persist] budget alert check failed:", error.message);
    return false;
  }
}

export async function persistParsedTransaction({ user, parsed, category, rawMessage }) {
  if (parsed.referenceId) {
    const existing = await db.transaction.findUnique({
      where: {
        userId_referenceId: { userId: user.id, referenceId: parsed.referenceId },
      },
      select: { id: true },
    });
    if (existing) {
      return { status: "duplicate", transactionId: existing.id };
    }
  }

  const account = await resolveAccount(user.id, parsed.accountLast4);
  if (!account) {
    return { status: "ignored", reason: "no-account" };
  }

  const needsReview =
    Math.min(parsed.confidence, category.confidence) < REVIEW_THRESHOLD;

  const balanceChange = parsed.type === "EXPENSE" ? -parsed.amount : parsed.amount;

  try {
    const transaction = await db.$transaction(async (tx) => {
      const created = await tx.transaction.create({
        data: {
          type: parsed.type,
          amount: parsed.amount,
          description: parsed.merchant || "Auto-imported from bank SMS",
          date: parsed.occurredAt,
          category: category.category,
          status: "COMPLETED",
          userId: user.id,
          accountId: account.id,
          source: "SMS",
          referenceId: parsed.referenceId,
          rawMessage,
          merchantName: parsed.merchant,
          parseConfidence: parsed.confidence,
          needsReview,
        },
      });

      // increment, not read-then-write, so concurrent ingests cannot clobber
      await tx.account.update({
        where: { id: account.id },
        data: { balance: { increment: balanceChange } },
      });

      return created;
    });

    let budgetWarning = false;
    if (parsed.type === "EXPENSE") {
      budgetWarning = await fireBudgetAlertIfCrossed({
        userId: user.id,
        account,
        addedAmount: parsed.amount,
      });
    }

    return {
      status: "created",
      transactionId: transaction.id,
      needsReview,
      budgetWarning,
    };
  } catch (error) {
    // raced past the findUnique above; a duplicate, not a failure
    if (error?.code === "P2002") {
      return { status: "duplicate" };
    }
    throw error;
  }
}
