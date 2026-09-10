import { inngest } from "./client";
import { db } from "@/lib/prisma";
import EmailTemplate from "@/emails/template";
import { sendEmail } from "@/actions/send-email";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildAdvisorPayload } from "@/lib/advisor/buildPayload";
import { generateAdvisorReport } from "@/lib/advisor/generateReport";
import { renderAdvisorPdf } from "@/lib/advisor/renderPdf";

export const processRecurringTransaction = inngest.createFunction(
  {
    id: "process-recurring-transaction",
    name: "Process Recurring Transaction",
    throttle: {
      limit: 10,
      period: "1m",
      key: "event.data.userId",
    },
    event: "transaction.recurring.process",
  },
  async ({ event, step }) => {
    if (!event?.data?.transactionId || !event?.data?.userId) {
      console.error("Invalid event data:", event);
      return { error: "Missing required event data" };
    }

    await step.run("process-transaction", async () => {
      const transaction = await db.transaction.findUnique({
        where: {
          id: event.data.transactionId,
          userId: event.data.userId,
        },
        include: {
          account: true,
        },
      });

      if (!transaction || !isTransactionDue(transaction)) return;

      await db.$transaction(async (tx) => {
        await tx.transaction.create({
          data: {
            type: transaction.type,
            amount: transaction.amount,
            description: `${transaction.description} (Recurring)`,
            date: new Date(),
            category: transaction.category,
            userId: transaction.userId,
            accountId: transaction.accountId,
            isRecurring: false,
          },
        });

        const balanceChange =
          transaction.type === "EXPENSE"
            ? -transaction.amount.toNumber()
            : transaction.amount.toNumber();

        await tx.account.update({
          where: { id: transaction.accountId },
          data: { balance: { increment: balanceChange } },
        });

        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            lastProcessed: new Date(),
            nextRecurringDate: calculateNextRecurringDate(
              new Date(),
              transaction.recurringInterval
            ),
          },
        });
      });
    });
  }
);

export const triggerRecurringTransactions = inngest.createFunction(
  {
    id: "trigger-recurring-transactions",
    name: "Trigger Recurring Transactions",
    cron: "0 0 * * *", // Daily at midnight
  },
  async ({ step }) => {
    const recurringTransactions = await step.run(
      "fetch-recurring-transactions",
      async () => {
        return await db.transaction.findMany({
          where: {
            isRecurring: true,
            status: "COMPLETED",
            OR: [
              { lastProcessed: null },
              {
                nextRecurringDate: {
                  lte: new Date(),
                },
              },
            ],
          },
        });
      }
    );

    if (recurringTransactions.length > 0) {
      const events = recurringTransactions.map((transaction) => ({
        name: "transaction.recurring.process",
        data: {
          transactionId: transaction.id,
          userId: transaction.userId,
        },
      }));

      await inngest.send(events);
    }

    return { triggered: recurringTransactions.length };
  }
);

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
    const response = result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

    const parsed = JSON.parse(cleanedText);
    return parsed
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

export const generateMonthlyReports = inngest.createFunction(
  {
    id: "generate-monthly-reports",
    name: "Generate Monthly Reports",
    triggers: [{ cron: "TZ=Asia/Kolkata 0 0 28 * *" }],
  },
  async ({ step }) => {
    const ACTIVE_WINDOW_DAYS = 30;
    const cutoff = new Date(
      Date.now() - ACTIVE_WINDOW_DAYS * 24 * 60 * 60 * 1000
    );

    const users = await step.run("fetch-users", async () => {
      return await db.user.findMany({
        where: { updatedAt: { gte: cutoff } },
        include: { accounts: true },
      });
    });

    for (const user of users) {
      await step.run(`generate-report-${user.id}`, async () => {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const stats = await getMonthlyStats(user.id, lastMonth);
        const monthName = lastMonth.toLocaleString("default", {
          month: "long",
        });

        const insights = await generateFinancialInsights(stats, monthName);

        await sendEmail({
          to: user.email,
          subject: `Your Monthly Financial Report - ${monthName}`,
          react: EmailTemplate({
            userName: user.name,
            type: "monthly-report",
            data: {
              stats,
              month: monthName,
              insights,
            },
          }),
        });
      });
    }

    return { processed: users.length };
  }
);

export const notifyBudgetThreshold = inngest.createFunction(
  {
    id: "notify-budget-threshold",
    name: "Notify Budget Threshold",
    triggers: [{ event: "budget.threshold.crossed" }],
  },
  async ({ event, step }) => {
    const { budgetId, accountId } = event.data;
    if (!budgetId || !accountId) {
      return { error: "missing-event-data" };
    }

    await step.sleep("wait-before-notifying", "1m");

    return await step.run("send-if-still-over", async () => {
      const budget = await db.budget.findUnique({
        where: { id: budgetId },
        include: { user: true },
      });
      if (!budget) return { skipped: "budget-missing" };

      const account = await db.account.findUnique({
        where: { id: accountId },
      });
      if (!account) return { skipped: "account-missing" };

      if (
        budget.lastAlertSent &&
        !isNewMonth(new Date(budget.lastAlertSent), new Date())
      ) {
        return { skipped: "already-alerted-this-month" };
      }

      const startDate = new Date();
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);

      const expenses = await db.transaction.aggregate({
        where: {
          userId: budget.userId,
          accountId,
          type: "EXPENSE",
          date: { gte: startDate },
        },
        _sum: { amount: true },
      });
      const totalExpenses = expenses._sum.amount?.toNumber() || 0;
      const budgetAmount = budget.amount.toNumber();
      const percentageUsed = (totalExpenses / budgetAmount) * 100;

      if (percentageUsed < 75) {
        return { skipped: "back-under-threshold", percentageUsed };
      }

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
        await db.budget.update({
          where: { id: budgetId },
          data: { lastAlertSent: new Date() },
        });
      }

      return { sent: result.success, percentageUsed };
    });
  }
);

function isNewMonth(lastAlertDate, currentDate) {
  return (
    lastAlertDate.getMonth() !== currentDate.getMonth() ||
    lastAlertDate.getFullYear() !== currentDate.getFullYear()
  );
}

function isTransactionDue(transaction) {
  if (!transaction.lastProcessed) return true;

  const today = new Date();
  const nextDue = new Date(transaction.nextRecurringDate);

  return nextDue <= today;
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

async function getMonthlyStats(userId, month) {
  const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
  const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  const transactions = await db.transaction.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  return transactions.reduce(
    (stats, t) => {
      const amount = t.amount.toNumber();
      if (t.type === "EXPENSE") {
        stats.totalExpenses += amount;
        stats.byCategory[t.category] =
          (stats.byCategory[t.category] || 0) + amount;
      } else {
        stats.totalIncome += amount;
      }
      return stats;
    },
    {
      totalExpenses: 0,
      totalIncome: 0,
      byCategory: {},
      transactionCount: transactions.length,
    }
  );
}

export const runFinancialAdvisor = inngest.createFunction(
  {
    id: "run-financial-advisor",
    name: "Run Financial Advisor",
    concurrency: { limit: 3 },
    triggers: [{ event: "advisor.generate.request" }],
  },
  async ({ event, step }) => {
    const { userId, source = "on-demand", deliveryMode = "web" } = event.data || {};
    if (!userId) return { error: "missing-userId" };

    const user = await step.run("fetch-user", async () => {
      return await db.user.findUnique({ where: { id: userId } });
    });
    if (!user) return { error: "user-not-found" };

    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const payload = await step.run("build-payload", async () => {
      return await buildAdvisorPayload(userId);
    });

    const { markdown, healthScore } = await step.run("generate-report", async () => {
      return await generateAdvisorReport(payload);
    });

    const report = await step.run("persist-report", async () => {
      return await db.financialReport.create({
        data: {
          userId,
          monthKey,
          contentMarkdown: markdown,
          healthScore,
          source,
          deliveryMode,
        },
      });
    });

    if (deliveryMode === "email") {
      const pdfBase64 = await step.run("render-pdf", async () => {
        const buf = await renderAdvisorPdf(markdown, {
          monthKey,
          userName: user.name || "",
        });
        return Buffer.from(buf).toString("base64");
      });

      await step.run("notify-email", async () => {
        return await sendEmail({
          to: user.email,
          subject: `Your ${monthKey} financial intelligence report`,
          react: EmailTemplate({
            userName: user.name,
            type: "advisor-ready",
            data: { reportId: report.id, monthKey, healthScore },
          }),
          attachments: [
            {
              filename: `BudgetFLOW-${monthKey}.pdf`,
              content: pdfBase64,
            },
          ],
        });
      });

      await step.run("mark-email-sent", async () => {
        await db.financialReport.update({
          where: { id: report.id },
          data: { emailSentAt: new Date() },
        });
      });
    }

    return { reportId: report.id, healthScore, deliveryMode };
  }
);

export const triggerFinancialAdvisor = inngest.createFunction(
  {
    id: "trigger-financial-advisor",
    name: "Trigger Financial Advisor",
    triggers: [{ cron: "TZ=Asia/Kolkata 0 1 1 * *" }],
  },
  async ({ step }) => {
    const users = await step.run("fetch-active-users", async () => {
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return await db.user.findMany({
        where: { updatedAt: { gte: cutoff } },
        select: { id: true },
      });
    });

    if (users.length > 0) {
      await inngest.send(
        users.map((u) => ({
          name: "advisor.generate.request",
          data: { userId: u.id, source: "cron", deliveryMode: "email" },
        }))
      );
    }

    return { fannedOut: users.length };
  }
);
