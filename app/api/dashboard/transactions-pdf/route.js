import { db } from "@/lib/prisma";
import { checkUser } from "@/lib/checkUser";
import { renderTransactionsPdf } from "@/lib/dashboard/renderTransactionsPdf";

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

function getRangeBounds(range) {
  const now = new Date();
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  if (range === "today") {
    const s = new Date(now);
    s.setHours(0, 0, 0, 0);
    return { start: s, end: endOfToday };
  }
  if (range === "yesterday") {
    const s = new Date(now);
    s.setDate(s.getDate() - 1);
    s.setHours(0, 0, 0, 0);
    const e = new Date(s);
    e.setHours(23, 59, 59, 999);
    return { start: s, end: e };
  }
  if (range === "7d") {
    const s = new Date(now);
    s.setDate(s.getDate() - 6);
    s.setHours(0, 0, 0, 0);
    return { start: s, end: endOfToday };
  }
  if (range === "30d") {
    const s = new Date(now);
    s.setDate(s.getDate() - 29);
    s.setHours(0, 0, 0, 0);
    return { start: s, end: endOfToday };
  }
  if (range === "month") {
    const s = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: s, end: endOfToday };
  }
  return { start: null, end: endOfToday };
}

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

  const { start, end } = getRangeBounds(range);
  const where = {
    userId: user.id,
    accountId,
    date: { lte: end },
  };
  if (start) where.date.gte = start;

  const transactions = await db.transaction.findMany({
    where,
    orderBy: { date: "asc" },
  });

  // Decimals need converting before serialization to the PDF renderer.
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
