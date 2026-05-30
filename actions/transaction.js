"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI } from "@google/generative-ai";
import aj from "@/lib/arcjet";
import { request } from "@arcjet/next";
import { checkUser } from "@/lib/checkUser";
import { inngest } from "@/lib/inngest/client";

const BUDGET_THRESHOLD_PCT = 75;

async function checkBudgetCrossing({ userId, account, addedAmount }) {
    if (!account.isDefault) return false;
    const budget = await db.budget.findUnique({ where: { userId } });
    if (!budget) return false;

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
    const budgetAmount = budget.amount.toNumber();
    if (budgetAmount <= 0) return false;

    const justCrossed =
        (totalBefore / budgetAmount) * 100 < BUDGET_THRESHOLD_PCT &&
        (totalAfter / budgetAmount) * 100 >= BUDGET_THRESHOLD_PCT;

    if (!justCrossed) return false;

    const alreadyAlertedThisMonth =
        budget.lastAlertSent &&
        new Date(budget.lastAlertSent).getMonth() === new Date().getMonth() &&
        new Date(budget.lastAlertSent).getFullYear() === new Date().getFullYear();

    if (!alreadyAlertedThisMonth) {
        try {
            await inngest.send({
                name: "budget.threshold.crossed",
                data: { budgetId: budget.id, userId, accountId: account.id },
            });
        } catch (err) {
            console.error("Failed to fire budget.threshold.crossed:", err);
        }
    }
    return true;
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const serializeAmount = (obj) => ({
    ...obj,
    amount: obj.amount.toNumber(),
});

// Create Transaction
export async function createTransaction(data) {
    try {
        const user = await checkUser();
        if (!user) throw new Error("Unauthorized");

        // Get request data for ArcJet
        const req = await request();

        // Check rate limit
        const decision = await aj.protect(req, {
            userId: user.clerkUserId,
            requested: 1, // Specify how many tokens to consume
        });

        if (decision.isDenied()) {
            if (decision.reason.isRateLimit()) {
                const { remaining, reset } = decision.reason;
                console.error({
                    code: "RATE_LIMIT_EXCEEDED",
                    details: {
                        remaining,
                        resetInSeconds: reset,
                    },
                });

                throw new Error("Too many requests. Please try again later.");
            }

            throw new Error("Request blocked");
        }

        const account = await db.account.findUnique({
            where: {
                id: data.accountId,
                userId: user.id,
            },
        });

        if (!account) {
            throw new Error("Account not found");
        }

        // Calculate new balance
        const balanceChange = data.type === "EXPENSE" ? -data.amount : data.amount;
        const newBalance = account.balance.toNumber() + balanceChange;

        // Create transaction and update account balance
        const transaction = await db.$transaction(async (tx) => {
            const newTransaction = await tx.transaction.create({
                data: {
                    ...data,
                    userId: user.id,
                    nextRecurringDate:
                        data.isRecurring && data.recurringInterval
                            ? calculateNextRecurringDate(data.date, data.recurringInterval)
                            : null,
                },
            });

            await tx.account.update({
                where: { id: data.accountId },
                data: { balance: newBalance },
            });

            return newTransaction;
        });

        let budgetWarning = false;
        if (data.type === "EXPENSE") {
            try {
                budgetWarning = await checkBudgetCrossing({
                    userId: user.id,
                    account,
                    addedAmount: data.amount,
                });
            } catch (err) {
                console.error("Budget crossing check failed:", err);
            }
        }

        revalidatePath("/dashboard");
        revalidatePath(`/account/${transaction.accountId}`);

        return {
            success: true,
            data: serializeAmount(transaction),
            budgetWarning,
        };
    } catch (error) {
        throw new Error(error.message);
    }
}

export async function getTransaction(id) {
    const user = await checkUser();
    if (!user) throw new Error("Unauthorized");

    const transaction = await db.transaction.findUnique({
        where: {
            id,
            userId: user.id,
        },
    });

    if (!transaction) throw new Error("Transaction not found");

    return serializeAmount(transaction);
}

export async function updateTransaction(id, data) {
    try {
        const user = await checkUser();
        if (!user) throw new Error("Unauthorized");

        // Get original transaction to calculate balance change
        const originalTransaction = await db.transaction.findUnique({
            where: {
                id,
                userId: user.id,
            },
            include: {
                account: true,
            },
        });

        if (!originalTransaction) throw new Error("Transaction not found");

        // Calculate balance changes
        const oldBalanceChange =
            originalTransaction.type === "EXPENSE"
                ? -originalTransaction.amount.toNumber()
                : originalTransaction.amount.toNumber();

        const newBalanceChange =
            data.type === "EXPENSE" ? -data.amount : data.amount;

        const netBalanceChange = newBalanceChange - oldBalanceChange;

        // Update transaction and account balance in a transaction
        const transaction = await db.$transaction(async (tx) => {
            const updated = await tx.transaction.update({
                where: {
                    id,
                    userId: user.id,
                },
                data: {
                    ...data,
                    nextRecurringDate:
                        data.isRecurring && data.recurringInterval
                            ? calculateNextRecurringDate(data.date, data.recurringInterval)
                            : null,
                },
            });

            // Update account balance
            await tx.account.update({
                where: { id: data.accountId },
                data: {
                    balance: {
                        increment: netBalanceChange,
                    },
                },
            });

            return updated;
        });

        revalidatePath("/dashboard");
        revalidatePath(`/account/${data.accountId}`);

        return { success: true, data: serializeAmount(transaction) };
    } catch (error) {
        throw new Error(error.message);
    }
}

// Get User Transactions
export async function getUserTransactions(query = {}) {
    try {
        const user = await checkUser();
        if (!user) throw new Error("Unauthorized");

        const transactions = await db.transaction.findMany({
            where: {
                userId: user.id,
                ...query,
            },
            include: {
                account: true,
            },
            orderBy: {
                date: "desc",
            },
        });

        return { success: true, data: transactions };
    } catch (error) {
        throw new Error(error.message);
    }
}

// Scan Receipt
export async function scanReceipt(file) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Convert File to ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        // Convert ArrayBuffer to Base64
        const base64String = Buffer.from(arrayBuffer).toString("base64");

        const prompt = `
      Analyze this receipt image and extract the following information in JSON format:
      - Total amount (just the number)
      - Date (in ISO format)
      - Description or items purchased (brief summary)
      - Merchant/store name
      - Suggested category (one of: housing,transportation,groceries,utilities,entertainment,food,shopping,healthcare,education,personal,travel,insurance,gifts,bills,other-expense )
      
      Only respond with valid JSON in this exact format:
      {
        "amount": number,
        "date": "ISO date string",
        "description": "string",
        "merchantName": "string",
        "category": "string"
      }

      If its not a recipt, return an empty object
    `;

        const result = await model.generateContent([
            {
                inlineData: {
                    data: base64String,
                    mimeType: file.type,
                },
            },
            prompt,
        ]);

        const response = await result.response;
        const text = response.text();
        const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

        try {
            const data = JSON.parse(cleanedText);
            return {
                amount: parseFloat(data.amount),
                date: new Date(data.date),
                description: data.description,
                category: data.category,
                merchantName: data.merchantName,
            };
        } catch (parseError) {
            console.error("Error parsing JSON response:", parseError);
            throw new Error("Invalid response format from Gemini");
        }
    } catch (error) {
        console.error("Error scanning receipt:", error);
        throw new Error("Failed to scan receipt");
    }
}

// Helper function to calculate next recurring date
function calculateNextRecurringDate(startDate, interval) {
    const date = new Date(startDate);

    switch (interval) {
        case "DAILY":
            date.setDate(date.getDate() + 1);
            break;
        case "WEEKLY":
            date.setDate(date.getDate() + 7);
            break;
        case "MONTHLY":
            date.setMonth(date.getMonth() + 1);
            break;
        case "YEARLY":
            date.setFullYear(date.getFullYear() + 1);
            break;
    }

    return date;
}