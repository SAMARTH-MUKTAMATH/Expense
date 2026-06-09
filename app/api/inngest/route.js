import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import {
  processRecurringTransaction,
  triggerRecurringTransactions,
  generateMonthlyReports,
  notifyBudgetThreshold,
  runFinancialAdvisor,
  triggerFinancialAdvisor,
  testPushEvery2Min,
} from "@/lib/inngest/function";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processRecurringTransaction,
    triggerRecurringTransactions,
    generateMonthlyReports,
    notifyBudgetThreshold,
    runFinancialAdvisor,
    triggerFinancialAdvisor,
    testPushEvery2Min,
  ],
});
