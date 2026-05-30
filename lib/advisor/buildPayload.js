import { db } from "@/lib/prisma";

/**
 * Assemble the structured JSON payload that the advisor Gemini prompt expects.
 * Pulls directly from Prisma so it works inside Inngest (no auth context).
 *
 * @param {string} userId — the User.id (NOT clerkUserId)
 * @returns {Promise<object>} payload matching the prompt's INPUT DATA CONTRACT
 */
export async function buildAdvisorPayload(userId) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { accounts: true },
  });
  if (!user) throw new Error(`User ${userId} not found`);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const transactions = await db.transaction.findMany({
    where: { userId, date: { gte: monthStart, lte: monthEnd } },
    include: { account: true },
    orderBy: { date: "asc" },
  });

  const budget = await db.budget.findFirst({ where: { userId } });

  const monthlyExpensesAgg = await db.transaction.aggregate({
    where: {
      userId,
      type: "EXPENSE",
      date: { gte: monthStart, lte: monthEnd },
    },
    _sum: { amount: true },
  });
  const monthlyExpenses = monthlyExpensesAgg._sum.amount?.toNumber() || 0;
  const budgetAmount = budget?.amount?.toNumber() || 0;
  const budgetUtilizationPercent =
    budgetAmount > 0 ? +((monthlyExpenses / budgetAmount) * 100).toFixed(1) : 0;

  // Groups created by this user — roll up amount owed to / by user
  const groups = await db.group.findMany({
    where: { createdById: userId },
    include: {
      members: true,
      expenses: { include: { shares: { include: { member: true } } } },
    },
  });

  const groupExpenses = groups.map((g) => {
    let owedToUser = 0;
    let userOwes = 0;
    for (const exp of g.expenses) {
      const paidByUser = exp.paidByName?.toLowerCase() === (user.name || "").toLowerCase();
      for (const s of exp.shares) {
        if (s.settled) continue;
        const amt = s.amount.toNumber();
        const memberIsUser = s.member.email?.toLowerCase() === user.email?.toLowerCase();
        if (paidByUser && !memberIsUser) owedToUser += amt;
        if (!paidByUser && memberIsUser) userOwes += amt;
      }
    }
    return {
      groupName: g.name,
      members: g.members.map((m) => m.name),
      expenses: g.expenses.map((e) => ({
        description: e.description,
        totalAmount: e.amount.toNumber(),
        paidBy: e.paidByName,
        date: e.createdAt.toISOString(),
        settled: e.shares.every((s) => s.settled),
      })),
      amountOwedToUser: +owedToUser.toFixed(2),
      amountUserOwes: +userOwes.toFixed(2),
    };
  });

  // Historical: prior 6 months (excluding current)
  const monthly = [];
  for (let i = 6; i >= 1; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const s = await getMonthlyStatsLocal(userId, d);
    monthly.push({
      month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      totalIncome: +s.totalIncome.toFixed(2),
      totalExpenses: +s.totalExpenses.toFixed(2),
      totalSavings: +(s.totalIncome - s.totalExpenses).toFixed(2),
      budgetUtilizationPercent:
        budgetAmount > 0 ? +((s.totalExpenses / budgetAmount) * 100).toFixed(1) : 0,
      categoryBreakdown: s.byCategory,
    });
  }

  return {
    user: {
      name: user.name || "",
      email: user.email,
      accountCreatedAt: user.createdAt.toISOString(),
    },
    accounts: user.accounts.map((a) => ({
      name: a.name,
      type: a.type.toLowerCase(),
      currentBalance: a.balance.toNumber(),
      initialBalance: a.balance.toNumber(),
      isDefault: a.isDefault,
    })),
    transactions: transactions.map((t) => ({
      type: t.type.toLowerCase(),
      amount: t.amount.toNumber(),
      category: t.category,
      description: t.description || "",
      date: t.date.toISOString(),
      isRecurring: t.isRecurring,
      recurringFrequency: t.recurringInterval ? t.recurringInterval.toLowerCase() : null,
      account: t.account?.name || "",
      status: t.status.toLowerCase() === "completed" ? "cleared" : t.status.toLowerCase(),
    })),
    budget: {
      monthlyBudgetAmount: budgetAmount,
      budgetUtilizationPercent,
    },
    groupExpenses,
    historicalData: { monthly },
  };
}

// Local copy of getMonthlyStats so this module has no circular dep with inngest/function.js
async function getMonthlyStatsLocal(userId, month) {
  const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
  const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);
  const transactions = await db.transaction.findMany({
    where: { userId, date: { gte: startDate, lte: endDate } },
  });
  return transactions.reduce(
    (stats, t) => {
      const amount = t.amount.toNumber();
      if (t.type === "EXPENSE") {
        stats.totalExpenses += amount;
        stats.byCategory[t.category] = (stats.byCategory[t.category] || 0) + amount;
      } else {
        stats.totalIncome += amount;
      }
      return stats;
    },
    { totalExpenses: 0, totalIncome: 0, byCategory: {} }
  );
}
