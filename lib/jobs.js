import { db } from "@/lib/prisma";
import EmailTemplate from "@/emails/template";
import { sendEmail } from "@/actions/send-email";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildAdvisorPayload } from "@/lib/advisor/buildPayload";
import { generateAdvisorReport } from "@/lib/advisor/generateReport";
import { renderAdvisorPdf } from "@/lib/advisor/renderPdf";
import { istMonthKey, istMonthRange } from "@/lib/ist";

const ACTIVE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const BUDGET_ALERT_PCT = 75;
const ADVISOR_CONCURRENCY = 3;

function activeUsersWhere() {
  return { updatedAt: { gte: new Date(Date.now() - ACTIVE_WINDOW_MS) } };
}

async function runEach(items, label, fn) {
  const failed = [];
  for (const item of items) {
    try {
      await fn(item);
    } catch (error) {
      failed.push(item.id);
      console.error(`[cron] ${label} failed for ${item.id}:`, error);
    }
  }
  return { processed: items.length - failed.length, failed };
}

function calculateNextRecurringDate(date, interval) {
  const next = new Date(date);
  switch (interval) {
    case "DAILY":
      next.setDate(next.getDate() + 1);
      break;
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
    case "YEARLY":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

async function processRecurringTransaction(transaction) {
  const now = new Date();
  await db.$transaction(async (tx) => {
    // claim first, so an overlapping run cannot double-post
    const claimed = await tx.transaction.updateMany({
      where: { id: transaction.id, lastProcessed: transaction.lastProcessed },
      data: {
        lastProcessed: now,
        nextRecurringDate: calculateNextRecurringDate(now, transaction.recurringInterval),
      },
    });
    if (claimed.count === 0) return;

    await tx.transaction.create({
      data: {
        type: transaction.type,
        amount: transaction.amount,
        description: `${transaction.description} (Recurring)`,
        date: now,
        category: transaction.category,
        userId: transaction.userId,
        accountId: transaction.accountId,
        isRecurring: false,
      },
    });

    const amount = transaction.amount.toNumber();
    await tx.account.update({
      where: { id: transaction.accountId },
      data: { balance: { increment: transaction.type === "EXPENSE" ? -amount : amount } },
    });
  });
}

export async function runRecurringTransactions() {
  const due = await db.transaction.findMany({
    where: {
      isRecurring: true,
      status: "COMPLETED",
      OR: [{ lastProcessed: null }, { nextRecurringDate: { lte: new Date() } }],
    },
  });
  return runEach(due, "recurring", processRecurringTransaction);
}

async function getMonthlyStats(userId, month) {
  const { start, end } = istMonthRange(month);
  const transactions = await db.transaction.findMany({
    where: { userId, date: { gte: start, lt: end } },
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
    { totalExpenses: 0, totalIncome: 0, byCategory: {}, transactionCount: transactions.length }
  );
}

async function generateFinancialInsights(stats, month) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
    Analyze this financial data and give exactly 3 SHORT insights.
    Each insight: max 14 words, one sentence, actionable.
    All amounts are in Indian Rupees (INR). Use the ₹ symbol — never $.

    Financial Data for ${month}:
    - Total Income: ₹${stats.totalIncome}
    - Total Expenses: ₹${stats.totalExpenses}
    - Net Income: ₹${stats.totalIncome - stats.totalExpenses}
    - Expense Categories: ${Object.entries(stats.byCategory)
      .map(([category, amount]) => `${category}: ₹${amount}`)
      .join(", ")}

    Respond with ONLY a JSON array of 3 strings, e.g.
    ["insight 1", "insight 2", "insight 3"]
  `;

  try {
    const result = await model.generateContent(prompt);
    const cleanedText = result.response.text().replace(/```(?:json)?\n?/g, "").trim();
    return JSON.parse(cleanedText)
      .slice(0, 3)
      .map((s) => String(s).replace(/\$/g, "₹").slice(0, 140));
  } catch (error) {
    console.error("Error generating insights:", error);
    return [
      "Your highest expense category this month might need attention.",
      "Consider setting up a budget for better financial management.",
      "Track your recurring expenses to identify potential savings.",
    ];
  }
}

export async function sendMonthlyReports() {
  const users = await db.user.findMany({ where: activeUsersWhere() });
  const lastMonth = istMonthRange(new Date(), -1).start;
  const monthName = lastMonth.toLocaleString("en-IN", { month: "long", timeZone: "Asia/Kolkata" });

  return runEach(users, "monthly-report", async (user) => {
    const stats = await getMonthlyStats(user.id, lastMonth);
    const insights = await generateFinancialInsights(stats, monthName);
    const result = await sendEmail({
      to: user.email,
      subject: `Your Monthly Financial Report - ${monthName}`,
      react: EmailTemplate({
        userName: user.name,
        type: "monthly-report",
        data: { stats, month: monthName, insights },
      }),
    });
    if (!result?.success) throw new Error("email not sent");
  });
}

export async function runAdvisorReport(userId, { source = "on-demand", deliveryMode = "web" } = {}) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error(`User ${userId} not found`);

  const monthKey = istMonthKey(new Date());
  const payload = await buildAdvisorPayload(userId);
  const { markdown, healthScore } = await generateAdvisorReport(payload);

  const report = await db.financialReport.create({
    data: { userId, monthKey, contentMarkdown: markdown, healthScore, source, deliveryMode },
  });

  if (deliveryMode === "email") {
    const pdf = await renderAdvisorPdf(markdown, { monthKey, userName: user.name || "" });
    const result = await sendEmail({
      to: user.email,
      subject: `Your ${monthKey} financial intelligence report`,
      react: EmailTemplate({
        userName: user.name,
        type: "advisor-ready",
        data: { reportId: report.id, monthKey, healthScore },
      }),
      attachments: [
        { filename: `BudgetFLOW-${monthKey}.pdf`, content: Buffer.from(pdf).toString("base64") },
      ],
    });
    if (result?.success) {
      await db.financialReport.update({
        where: { id: report.id },
        data: { emailSentAt: new Date() },
      });
    }
  }

  return report;
}

export async function runMonthlyAdvisor() {
  const monthKey = istMonthKey(new Date());
  const users = await db.user.findMany({
    where: {
      ...activeUsersWhere(),
      // a retried or duplicate cron run must not re-send
      financialReports: { none: { monthKey, source: "cron" } },
    },
    select: { id: true },
  });

  const failed = [];
  for (let i = 0; i < users.length; i += ADVISOR_CONCURRENCY) {
    const batch = users.slice(i, i + ADVISOR_CONCURRENCY);
    const settled = await Promise.allSettled(
      batch.map((u) => runAdvisorReport(u.id, { source: "cron", deliveryMode: "email" }))
    );
    settled.forEach((outcome, j) => {
      if (outcome.status === "fulfilled") return;
      failed.push(batch[j].id);
      console.error(`[cron] advisor failed for ${batch[j].id}:`, outcome.reason);
    });
  }
  return { processed: users.length - failed.length, failed };
}

export async function sendBudgetAlertIfOver({ budgetId, accountId }) {
  const budget = await db.budget.findUnique({ where: { id: budgetId }, include: { user: true } });
  const account = await db.account.findUnique({ where: { id: accountId } });
  if (!budget || !account) return;

  const now = new Date();
  if (budget.lastAlertSent && istMonthKey(budget.lastAlertSent) === istMonthKey(now)) return;

  const { start, end } = istMonthRange(now);
  const expenses = await db.transaction.aggregate({
    where: { userId: budget.userId, accountId, type: "EXPENSE", date: { gte: start, lt: end } },
    _sum: { amount: true },
  });
  const totalExpenses = expenses._sum.amount?.toNumber() || 0;
  const budgetAmount = budget.amount.toNumber();
  const percentageUsed = (totalExpenses / budgetAmount) * 100;
  if (percentageUsed < BUDGET_ALERT_PCT) return;

  const result = await sendEmail({
    to: budget.user.email,
    subject: `Budget Alert for ${account.name}`,
    react: EmailTemplate({
      userName: budget.user.name,
      type: "budget-alert",
      data: {
        percentageUsed,
        budgetAmount: budgetAmount.toFixed(1),
        totalExpenses: totalExpenses.toFixed(1),
        accountName: account.name,
      },
    }),
  });

  if (result.success) {
    await db.budget.update({ where: { id: budgetId }, data: { lastAlertSent: now } });
  }
}
