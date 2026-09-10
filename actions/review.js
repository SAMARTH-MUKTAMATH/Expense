"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma";
import { checkUser } from "@/lib/checkUser";
import { defaultCategories } from "@/data/categories";

const VALID_CATEGORY_IDS = new Set(defaultCategories.map((c) => c.id));

const serialize = (t) => ({
  ...t,
  amount: t.amount.toNumber(),
  date: t.date.toISOString(),
  createdAt: t.createdAt.toISOString(),
});

export async function getReviewQueue() {
  const user = await checkUser();
  if (!user) throw new Error("Unauthorized");

  const transactions = await db.transaction.findMany({
    where: { userId: user.id, needsReview: true },
    orderBy: { date: "desc" },
    include: { account: { select: { id: true, name: true } } },
  });

  return transactions.map(serialize);
}

export async function getReviewCount() {
  const user = await checkUser();
  if (!user) return 0;
  return db.transaction.count({ where: { userId: user.id, needsReview: true } });
}

export async function confirmTransaction(id, category) {
  const user = await checkUser();
  if (!user) throw new Error("Unauthorized");

  if (category && !VALID_CATEGORY_IDS.has(category)) {
    throw new Error("Unknown category");
  }

  const existing = await db.transaction.findFirst({
    where: { id, userId: user.id },
    select: { id: true, accountId: true },
  });
  if (!existing) throw new Error("Transaction not found");

  await db.transaction.update({
    where: { id: existing.id },
    data: { needsReview: false, ...(category ? { category } : {}) },
  });

  revalidatePath("/review");
  revalidatePath("/dashboard");
  revalidatePath(`/account/${existing.accountId}`);
  return { success: true };
}

export async function confirmTransactions(ids, category) {
  const user = await checkUser();
  if (!user) throw new Error("Unauthorized");

  if (!Array.isArray(ids) || ids.length === 0) return { success: true, count: 0 };
  if (ids.length > 500) throw new Error("Too many at once");

  const where = { id: { in: ids }, userId: user.id };

  if (category) {
    const target = defaultCategories.find((c) => c.id === category);
    if (!target) throw new Error("Unknown category");
    where.type = target.type;
  }

  const result = await db.transaction.updateMany({
    where,
    data: { needsReview: false, ...(category ? { category } : {}) },
  });

  revalidatePath("/review");
  revalidatePath("/dashboard");
  return { success: true, count: result.count };
}

export async function rejectTransaction(id) {
  const user = await checkUser();
  if (!user) throw new Error("Unauthorized");

  const existing = await db.transaction.findFirst({
    where: { id, userId: user.id },
    select: { id: true, accountId: true, amount: true, type: true },
  });
  if (!existing) throw new Error("Transaction not found");

  const amount = existing.amount.toNumber();
  const reversal = existing.type === "EXPENSE" ? amount : -amount;

  await db.$transaction(async (tx) => {
    await tx.transaction.delete({ where: { id: existing.id } });
    await tx.account.update({
      where: { id: existing.accountId },
      data: { balance: { increment: reversal } },
    });
  });

  revalidatePath("/review");
  revalidatePath("/dashboard");
  revalidatePath(`/account/${existing.accountId}`);
  return { success: true };
}
