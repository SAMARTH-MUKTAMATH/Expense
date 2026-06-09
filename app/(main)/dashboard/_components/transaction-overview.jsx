"use client";

import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { format } from "date-fns";
import {
  ArrowUpRight as ArrowUpRightIcon,
  ArrowDownRight as ArrowDownRightIcon,
  Receipt as ReceiptIcon,
  PieChart as ChartPieIcon,
  Download,
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatINR } from "@/lib/utils";
import { toast } from "sonner";

const COLORS = [
  "#89E900",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#84cc16",
];

const DATE_RANGES = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "month", label: "This month" },
];

// Returns an inclusive [start, end] (both Date objects) for the selected range.
// `null` start means no lower bound (all-time).
function getRangeBounds(range) {
  const now = new Date();
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  if (range === "all") return { start: null, end: endOfToday };

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

export function DashboardOverview({ accounts, transactions }) {
  const [selectedAccountId, setSelectedAccountId] = useState(
    accounts.find((a) => a.isDefault)?.id || accounts[0]?.id
  );
  const [dateRange, setDateRange] = useState("7d");

  const accountTransactions = transactions.filter(
    (t) => t.accountId === selectedAccountId
  );

  const { start, end } = getRangeBounds(dateRange);
  const filteredByDate = accountTransactions.filter((t) => {
    const d = new Date(t.date);
    if (start && d < start) return false;
    if (d > end) return false;
    return true;
  });

  const recentTransactions = filteredByDate
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  // Export as PDF — the heavy lifting (Prisma fetch + @react-pdf render)
  // happens server-side at /api/dashboard/transactions-pdf. The browser
  // navigates there and the response triggers a file download via the
  // Content-Disposition: attachment header.
  const handleExport = (rangeValue) => {
    if (!selectedAccountId) {
      toast.error("Pick an account first.");
      return;
    }
    const range = DATE_RANGES.find((r) => r.value === rangeValue);
    const url = `/api/dashboard/transactions-pdf?accountId=${encodeURIComponent(
      selectedAccountId
    )}&range=${encodeURIComponent(rangeValue)}`;

    // Use an off-DOM <a> so we don't navigate the current page away.
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => document.body.removeChild(a), 1000);

    toast.success(`Preparing ${range?.label || rangeValue} PDF…`);
  };

  const currentDate = new Date();
  const currentMonthExpenses = accountTransactions.filter((t) => {
    const transactionDate = new Date(t.date);
    return (
      t.type === "EXPENSE" &&
      transactionDate.getMonth() === currentDate.getMonth() &&
      transactionDate.getFullYear() === currentDate.getFullYear()
    );
  });

  const expensesByCategory = currentMonthExpenses.reduce((acc, transaction) => {
    const category = transaction.category;
    if (!acc[category]) acc[category] = 0;
    acc[category] += transaction.amount;
    return acc;
  }, {});

  const pieChartData = Object.entries(expensesByCategory)
    .map(([category, amount]) => ({ name: category, value: amount }))
    .sort((a, b) => b.value - a.value);

  const totalExpenses = pieChartData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Recent Transactions */}
      <Card className="bg-[#161616] border-white/10">
        <CardHeader className="space-y-0 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-9 w-9 rounded-lg bg-[#89E900] text-[#0a0a0a] flex items-center justify-center shadow-md shadow-[#89E900]/30 shrink-0">
                <ReceiptIcon size={16} />
              </div>
              <CardTitle className="text-base font-semibold text-white truncate">
                Recent transactions
              </CardTitle>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[130px] bg-[#0a0a0a] border-white/15 text-white text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_RANGES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedAccountId}
                onValueChange={setSelectedAccountId}
              >
                <SelectTrigger className="w-[140px] bg-[#0a0a0a] border-white/15 text-white text-xs h-8">
                  <SelectValue placeholder="Account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Download CSV — opens a range picker so the user can pick
                  the export window separately from the view filter. */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Download transactions"
                    className="h-8 w-8 rounded-md border border-white/15 bg-[#0a0a0a] text-gray-300 hover:text-brand hover:border-brand/40 flex items-center justify-center transition-colors"
                  >
                    <Download size={14} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-[#161616] border-white/10 text-white"
                >
                  <DropdownMenuLabel className="text-xs text-gray-400 uppercase tracking-wider">
                    Export range
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />
                  {DATE_RANGES.map((r) => (
                    <DropdownMenuItem
                      key={r.value}
                      onClick={() => handleExport(r.value)}
                      className="cursor-pointer focus:bg-white/5 text-sm"
                    >
                      {r.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTransactions.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm text-gray-400">No transactions yet</p>
                <p className="text-xs text-gray-500 mt-1">
                  Add one to see it here
                </p>
              </div>
            ) : (
              recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "h-9 w-9 rounded-full flex items-center justify-center shrink-0",
                        transaction.type === "EXPENSE"
                          ? "bg-red-500/15 text-red-400"
                          : "bg-emerald-500/15 text-emerald-400"
                      )}
                    >
                      {transaction.type === "EXPENSE" ? (
                        <ArrowDownRightIcon size={16} />
                      ) : (
                        <ArrowUpRightIcon size={16} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate text-white">
                        {transaction.description || "Untitled transaction"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {format(new Date(transaction.date), "PP")}
                      </p>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "text-sm font-semibold shrink-0 ml-3",
                      transaction.type === "EXPENSE"
                        ? "text-red-400"
                        : "text-emerald-400"
                    )}
                  >
                    {transaction.type === "EXPENSE" ? "-" : "+"}
                    {formatINR(transaction.amount)}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Expense Breakdown */}
      <Card className="bg-[#161616] border-white/10">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-[#89E900] text-[#0a0a0a] flex items-center justify-center shadow-md shadow-[#89E900]/30">
              <ChartPieIcon size={16} />
            </div>
            <CardTitle className="text-base font-semibold text-white">
              Monthly expense breakdown
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0 pb-5">
          {pieChartData.length === 0 ? (
            <div className="text-center py-14">
              <p className="text-sm text-gray-400">No expenses this month</p>
            </div>
          ) : (
            <>
              <div className="h-[260px] sm:h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius="48%"
                      outerRadius="80%"
                      paddingAngle={2}
                      dataKey="value"
                      // Only label slices >= 8% so small categories don't
                      // overlap each other on mobile. Everything else lives
                      // in the legend grid below.
                      label={({ name, percent }) =>
                        percent >= 0.08
                          ? `${(percent * 100).toFixed(0)}%`
                          : ""
                      }
                      labelLine={false}
                    >
                      {pieChartData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          stroke="#0a0a0a"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatINR(value)}
                      contentStyle={{
                        backgroundColor: "#161616",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                        color: "white",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Custom legend grid — replaces recharts' Legend so we can
                  show full category names, color dots, and INR amounts in a
                  tidy responsive layout (and avoid label overlap on mobile). */}
              <div className="px-5 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                {pieChartData.map((d, idx) => {
                  const pct = totalExpenses
                    ? ((d.value / totalExpenses) * 100).toFixed(0)
                    : 0;
                  return (
                    <div
                      key={d.name}
                      className="flex items-center gap-2 text-xs min-w-0"
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <span className="text-gray-300 capitalize truncate flex-1">
                        {d.name}
                      </span>
                      <span className="text-gray-400 shrink-0 tabular-nums">
                        {pct}% · {formatINR(d.value)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
