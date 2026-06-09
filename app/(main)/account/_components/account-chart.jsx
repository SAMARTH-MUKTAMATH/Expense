"use client";

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import {
  BarChart,
  Bar,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, addDays, startOfDay, endOfDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatINR } from "@/lib/utils";
import { TrendingUp as TrendingUpIcon } from "lucide-react";
import { defaultCategories, categoryColors } from "@/data/categories";

const CATEGORY_NAME_BY_ID = defaultCategories.reduce((acc, c) => {
  acc[c.id] = c.name;
  return acc;
}, {});

const EXPENSE_FALLBACK_COLOR = "#ef4444";

const DATE_RANGES = {
  "7D": { label: "Last 7 days", days: 7 },
  "1M": { label: "Last month", days: 30 },
  "3M": { label: "Last 3 months", days: 90 },
  "6M": { label: "Last 6 months", days: 180 },
  ALL: { label: "All time", days: null },
};

export function AccountChart({ transactions }) {
  const [dateRange, setDateRange] = useState("1M");
  const [chartType, setChartType] = useState("bar");

  const { filteredData, expenseCategories, counts } = useMemo(() => {
    const range = DATE_RANGES[dateRange];
    const now = new Date();
    const startDate = range.days
      ? startOfDay(subDays(now, range.days))
      : startOfDay(new Date(0));

    const filtered = transactions.filter(
      (t) => new Date(t.date) >= startDate && new Date(t.date) <= endOfDay(now)
    );

    const categoriesSeen = new Set();
    let incomeCount = 0;
    let expenseCount = 0;

    const grouped = filtered.reduce((acc, transaction) => {
      const dateObj = startOfDay(new Date(transaction.date));
      const date = format(dateObj, "MMM dd");
      if (!acc[date]) {
        acc[date] = { date, _date: dateObj, income: 0, expense: 0 };
      }
      if (transaction.type === "INCOME") {
        acc[date].income += transaction.amount;
        incomeCount += 1;
      } else {
        const key = transaction.category || "other-expense";
        acc[date][key] = (acc[date][key] || 0) + transaction.amount;
        acc[date].expense += transaction.amount;
        categoriesSeen.add(key);
        expenseCount += 1;
      }
      return acc;
    }, {});

    const sorted = Object.values(grouped).sort(
      (a, b) => a._date - b._date
    );

    return {
      filteredData: sorted,
      expenseCategories: Array.from(categoriesSeen),
      counts: { income: incomeCount, expense: expenseCount },
    };
  }, [transactions, dateRange]);

  // Line chart needs ≥2 points to render an actual line. If only one day has
  // data, prepend/append zero days so the single point renders as a spike.
  const lineData = useMemo(() => {
    if (filteredData.length === 0) return filteredData;
    if (filteredData.length >= 2) return filteredData;
    const [only] = filteredData;
    const prev = subDays(only._date, 1);
    const next = addDays(only._date, 1);
    return [
      { date: format(prev, "MMM dd"), _date: prev, income: 0, expense: 0 },
      only,
      { date: format(next, "MMM dd"), _date: next, income: 0, expense: 0 },
    ];
  }, [filteredData]);

  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, day) => ({
        income: acc.income + (day.income || 0),
        expense: acc.expense + (day.expense || 0),
      }),
      { income: 0, expense: 0 }
    );
  }, [filteredData]);

  const net = totals.income - totals.expense;
  const savingsRate =
    totals.income > 0 ? Math.round((net / totals.income) * 100) : null;

  return (
    <Card className="bg-[#161616] border-white/10">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-[#89E900] text-[#0a0a0a] flex items-center justify-center shadow-md shadow-[#89E900]/30">
            <TrendingUpIcon size={16} />
          </div>
          <CardTitle className="text-base font-semibold text-white">
            Transaction overview
          </CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <ChartTypeToggle value={chartType} onChange={setChartType} />
          <Select defaultValue={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px] bg-[#0a0a0a] border-white/15 text-white">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DATE_RANGES).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <KpiCard
            label="Income"
            value={totals.income}
            count={counts.income}
            tone="emerald"
            arrow="up"
          />
          <KpiCard
            label="Expenses"
            value={totals.expense}
            count={counts.expense}
            tone="amber"
            arrow="down"
          />
          <KpiCard
            label="Net"
            value={net}
            sub={
              savingsRate === null
                ? `${counts.income + counts.expense} txns`
                : net >= 0
                ? `${savingsRate}% saved`
                : `${Math.abs(savingsRate)}% over budget`
            }
            tone={net >= 0 ? "emerald" : "amber"}
            arrow={net >= 0 ? "up" : "down"}
            forceSign
          />
        </div>

        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "bar" ? (
              <BarChart
                data={filteredData}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                barCategoryGap="30%"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgba(255,255,255,0.08)"
                />
                <XAxis
                  dataKey="date"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#9ca3af" }}
                />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#9ca3af" }}
                  tickFormatter={(value) => formatINR(value, { compact: true })}
                />
                <Tooltip
                  formatter={(value, name) => [formatINR(value), name]}
                  contentStyle={{
                    backgroundColor: "#161616",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "white",
                  }}
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                />
                <Legend wrapperStyle={{ color: "#d1d5db" }} />
                <Bar
                  dataKey="income"
                  name="Income"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={56}
                />
                {expenseCategories.map((cat, idx) => (
                  <Bar
                    key={cat}
                    dataKey={cat}
                    name={CATEGORY_NAME_BY_ID[cat] || cat}
                    stackId="expense"
                    fill={categoryColors[cat] || EXPENSE_FALLBACK_COLOR}
                    radius={
                      idx === expenseCategories.length - 1 ? [6, 6, 0, 0] : 0
                    }
                    maxBarSize={56}
                  />
                ))}
              </BarChart>
            ) : (
              <ComposedChart
                data={lineData}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgba(255,255,255,0.08)"
                />
                <XAxis
                  dataKey="date"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#9ca3af" }}
                />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#9ca3af" }}
                  tickFormatter={(value) => formatINR(value, { compact: true })}
                />
                <Tooltip
                  formatter={(value, name) => [formatINR(value), name]}
                  contentStyle={{
                    backgroundColor: "#161616",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "white",
                  }}
                  cursor={{ stroke: "rgba(255,255,255,0.15)" }}
                />
                <Legend wrapperStyle={{ color: "#d1d5db" }} />
                <Area
                  type="monotone"
                  dataKey="income"
                  name="Income"
                  stroke="none"
                  fill="url(#incomeGrad)"
                  legendType="none"
                  tooltipType="none"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  name="Expense"
                  stroke="none"
                  fill="url(#expenseGrad)"
                  legendType="none"
                  tooltipType="none"
                />
                <Line
                  type="monotone"
                  dataKey="income"
                  name="Income"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "#10b981", strokeWidth: 2, stroke: "#161616" }}
                  activeDot={{ r: 7 }}
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  name="Expense"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "#f59e0b", strokeWidth: 2, stroke: "#161616" }}
                  activeDot={{ r: 7 }}
                />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function ChartTypeToggle({ value, onChange }) {
  const options = [
    { id: "bar", label: "Bar", icon: BarIcon },
    { id: "line", label: "Line", icon: LineIcon },
  ];
  return (
    <div className="relative inline-flex items-center rounded-md border border-white/10 bg-ink p-0.5">
      {options.map((o) => {
        const active = value === o.id;
        const Icon = o.icon;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            aria-label={`${o.label} chart`}
            className={
              "relative inline-flex items-center gap-1 h-6 px-1.5 rounded-[5px] text-[10px] font-medium transition-colors duration-200 " +
              (active ? "text-brand" : "text-gray-400 hover:text-white")
            }
          >
            {active && (
              <motion.span
                layoutId="chart-toggle-indicator"
                className="absolute inset-0 rounded-[5px] ring-1 ring-brand"
                transition={{
                  type: "spring",
                  stiffness: 480,
                  damping: 32,
                  mass: 0.6,
                }}
              />
            )}
            <span className="relative inline-flex items-center gap-1">
              <Icon active={active} />
              <span className="hidden sm:inline">{o.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function BarIcon({ active }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 20h18" />
      <rect x="5" y="11" width="3" height="7" rx="0.5" fill={active ? "currentColor" : "none"} />
      <rect x="10.5" y="7" width="3" height="11" rx="0.5" fill={active ? "currentColor" : "none"} />
      <rect x="16" y="13" width="3" height="5" rx="0.5" fill={active ? "currentColor" : "none"} />
    </svg>
  );
}

function LineIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 17l5-6 4 4 8-9" />
      <circle cx="3" cy="17" r="1.2" fill="currentColor" />
      <circle cx="8" cy="11" r="1.2" fill="currentColor" />
      <circle cx="12" cy="15" r="1.2" fill="currentColor" />
      <circle cx="20" cy="6" r="1.2" fill="currentColor" />
    </svg>
  );
}

function ArrowUp() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M7 17L17 7" />
      <path d="M9 7h8v8" />
    </svg>
  );
}

function ArrowDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17 7L7 17" />
      <path d="M15 17H7V9" />
    </svg>
  );
}

function KpiCard({ label, value, count, sub, tone, arrow, forceSign }) {
  const palette =
    tone === "emerald"
      ? {
          ring: "border-emerald-500/20",
          halo: "bg-emerald-500/15",
          chip: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30",
          value: "text-emerald-400",
        }
      : {
          ring: "border-amber-500/25",
          halo: "bg-amber-500/15",
          chip: "bg-amber-500/15 text-amber-400 ring-amber-500/30",
          value: "text-amber-400",
        };

  const display = forceSign && value < 0 ? `-${formatINR(Math.abs(value))}` : formatINR(value);

  return (
    <div
      className={
        "relative overflow-hidden rounded-2xl bg-[#0a0a0a] border " +
        palette.ring +
        " p-4"
      }
    >
      <div
        aria-hidden
        className={
          "absolute -top-10 -right-10 h-28 w-28 rounded-full blur-3xl " +
          palette.halo
        }
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
            {label}
          </p>
          <p
            className={
              "mt-2 text-2xl md:text-[28px] font-extrabold tracking-tight leading-none " +
              palette.value
            }
          >
            {display}
          </p>
          <p className="mt-2 text-[11px] text-gray-500">
            {sub ?? `${count ?? 0} transaction${(count ?? 0) === 1 ? "" : "s"}`}
          </p>
        </div>
        <div
          className={
            "shrink-0 h-9 w-9 rounded-xl flex items-center justify-center ring-1 " +
            palette.chip
          }
        >
          {arrow === "up" ? <ArrowUp /> : <ArrowDown />}
        </div>
      </div>
    </div>
  );
}
