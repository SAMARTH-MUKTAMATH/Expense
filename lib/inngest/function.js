import { inngest } from "./client";
import { db } from "@/lib/prisma";
import EmailTemplate from "@/emails/template";
import { sendEmail } from "@/actions/send-email";
import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. Recurring Transaction Processing with Throttling
export const processRecurringTransaction = inngest.createFunction(
  {
    id: "process-recurring-transaction",
    name: "Process Recurring Transaction",
    throttle: {
      limit: 10, // Process 10 transactions
      period: "1m", // per minute
      key: "event.data.userId", // Throttle per user
    },
    event: "transaction.recurring.process",
  },
  async ({ event, step }) => {
    // Validate event data
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

      // Create new transaction and update account balance in a transaction
      await db.$transaction(async (tx) => {
        // Create new transaction
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

        // Update account balance
        const balanceChange =
          transaction.type === "EXPENSE"
            ? -transaction.amount.toNumber()
            : transaction.amount.toNumber();

        await tx.account.update({
          where: { id: transaction.accountId },
          data: { balance: { increment: balanceChange } },
        });

        // Update last processed date and next recurring date
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

// Trigger recurring transactions with batching
export const triggerRecurringTransactions = inngest.createFunction(
  {
    id: "trigger-recurring-transactions", // Unique ID,
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

    // Send event for each recurring transaction in batches
    if (recurringTransactions.length > 0) {
      const events = recurringTransactions.map((transaction) => ({
        name: "transaction.recurring.process",
        data: {
          transactionId: transaction.id,
          userId: transaction.userId,
        },
      }));

      // Send events directly using inngest.send()
      await inngest.send(events);
    }

    return { triggered: recurringTransactions.length };
  }
);

// 2. Monthly Report Generation
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
    // Belt-and-braces: scrub any stray $ the model might still emit, and cap
    // both the count and per-insight length so the email stays compact.
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
    // 28th of every month at midnight IST.
    triggers: [{ cron: "TZ=Asia/Kolkata 0 0 28 * *" }],
  },
  async ({ step }) => {
    // Only email users active in the last 30 days. `updatedAt` is bumped
    // on every checkUser() call, so it tracks the most recent app activity.
    // This automatically skips stale Clerk sign-ins / dormant accounts.
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

        // Generate AI insights
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

// 3. Budget Threshold Notifier — event-driven, fires 3h after crossing.
//
// The transaction server action emits `budget.threshold.crossed` when an
// expense pushes the user from <75% to >=75% of their monthly budget. This
// function sleeps 3h then re-checks: if the user is still over the threshold
// AND no email was already sent this month, it sends one and stamps
// `lastAlertSent`. If they dropped back under during the 3h window (e.g.
// deleted a wrong transaction), the email is skipped.
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

    // TESTING: was "3h". Revert before commit.
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

// Utility functions
function isTransactionDue(transaction) {
  // If no lastProcessed date, transaction is due
  if (!transaction.lastProcessed) return true;

  const today = new Date();
  const nextDue = new Date(transaction.nextRecurringDate);

  // Compare with nextDue date
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