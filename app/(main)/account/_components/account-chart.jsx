"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatINR } from "@/lib/utils";
import { TrendingUpIcon } from "@/components/ui/trending-up";

const DATE_RANGES = {
  "7D": { label: "Last 7 days", days: 7 },
  "1M": { label: "Last month", days: 30 },
  "3M": { label: "Last 3 months", days: 90 },
  "6M": { label: "Last 6 months", days: 180 },
  ALL: { label: "All time", days: null },
};

export function AccountChart({ transactions }) {
  const [dateRange, setDateRange] = useState("1M");

  const filteredData = useMemo(() => {
    const range = DATE_RANGES[dateRange];
    const now = new Date();
    const startDate = range.days
      ? startOfDay(subDays(now, range.days))
      : startOfDay(new Date(0));

    const filtered = transactions.filter(
      (t) => new Date(t.date) >= startDate && new Date(t.date) <= endOfDay(now)
    );

    const grouped = filtered.reduce((acc, transaction) => {
      const date = format(new Date(transaction.date), "MMM dd");
      if (!acc[date]) {
        acc[date] = { date, income: 0, expense: 0 };
      }
      if (transaction.type === "INCOME") {
        acc[date].income += transaction.amount;
      } else {
        acc[date].expense += transaction.amount;
      }
      return acc;
    }, {});

    return Object.values(grouped).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
  }, [transactions, dateRange]);

  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, day) => ({
        income: acc.income + day.income,
        expense: acc.expense + day.expense,
      }),
      { income: 0, expense: 0 }
    );
  }, [filteredData]);

  const net = totals.income - totals.expense;

  return (
    <Card className="bg-[#161616] border-white/10">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-[#89E900] text-[#0a0a0a] flex items-center justify-center shadow-md shadow-[#89E900]/30">
            <TrendingUpIcon size={16} />
          </div>
          <CardTitle className="text-base font-semibold text-white">
            Transaction overview
          </CardTitle>
        </div>
        <Select defaultValue={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[150px] bg-[#0a0a0a] border-white/15 text-white">
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
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-center">
            <p className="text-xs text-gray-400">Total income</p>
            <p className="text-base md:text-lg font-bold text-emerald-400 mt-1">
              {formatINR(totals.income)}
            </p>
          </div>
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center">
            <p className="text-xs text-gray-400">Total expenses</p>
            <p className="text-base md:text-lg font-bold text-red-400 mt-1">
              {formatINR(totals.expense)}
            </p>
          </div>
          <div
            className={`rounded-xl border p-3 text-center ${
              net >= 0
                ? "border-emerald-500/20 bg-emerald-500/10"
                : "border-red-500/20 bg-red-500/10"
            }`}
          >
            <p className="text-xs text-gray-400">Net</p>
            <p
              className={`text-base md:text-lg font-bold mt-1 ${
                net >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {formatINR(net)}
            </p>
          </div>
        </div>

        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={filteredData}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
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
                formatter={(value) => [formatINR(value), undefined]}
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
              />
              <Bar
                dataKey="expense"
                name="Expense"
                fill="#ef4444"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
