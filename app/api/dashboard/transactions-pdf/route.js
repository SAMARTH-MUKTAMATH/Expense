import { db } from "@/lib/prisma";
import { checkUser } from "@/lib/checkUser";
import { renderTransactionsPdf } from "@/lib/dashboard/renderTransactionsPdf";
import { istRangeBounds } from "@/lib/ist";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RANGE_LABELS = {
  all: "All time",
  today: "Today",
  yesterday: "Yesterday",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  month: "This month",
};

export async function GET(request) {
  const user = await checkUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("accountId");
  const range = searchParams.get("range") || "30d";

  if (!accountId) {
    return new Response("Missing accountId", { status: 400 });
  }

  const account = await db.account.findUnique({
    where: { id: accountId },
  });
  if (!account || account.userId !== user.id) {
    return new Response("Account not found", { status: 404 });
  }

  const { start, end } = istRangeBounds(range);
  const where = {
    userId: user.id,
    accountId,
    date: { lt: end },
  };
  if (start) where.date.gte = start;

  const transactions = await db.transaction.findMany({
    where,
    orderBy: { date: "asc" },
  });

  const txns = transactions.map((t) => ({
    id: t.id,
    type: t.type,
    amount: t.amount.toNumber(),
    description: t.description,
    date: t.date.toISOString(),
    category: t.category,
  }));

  const pdf = await renderTransactionsPdf({
    accountName: account.name,
    rangeLabel: RANGE_LABELS[range] || range,
    userName: user.name || "",
    generatedAt: new Date().toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    transactions: txns,
  });

  const safeName = (account.name || "account")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
  const filename = `budgetflow-${safeName}-${range}.pdf`;

  return new Response(pdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
