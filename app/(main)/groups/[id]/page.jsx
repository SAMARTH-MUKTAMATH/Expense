import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import { getGroup } from "@/actions/groups";
import { formatINR } from "@/lib/utils";
import { GroupDetailClient } from "../_components/group-detail-client";
import { DownloadSummaryButton } from "../_components/download-summary-button";

export default async function GroupDetailPage({ params }) {
  const { id } = await params;
  const group = await getGroup(id);
  if (!group) notFound();

  const totalExpenses = group.expenses.reduce(
    (sum, e) => sum + Number(e.amount),
    0
  );
  const pendingShares = group.expenses
    .flatMap((e) => e.shares)
    .filter((s) => !s.settled);
  const pendingTotal = pendingShares.reduce(
    (sum, s) => sum + Number(s.amount),
    0
  );

  return (
    <div className="px-4 md:px-8 py-10 max-w-7xl mx-auto">
      <Link
        href="/groups"
        className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-brand transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Splitwise
      </Link>

      <div className="flex items-end justify-between flex-wrap gap-3 mb-8">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-brand">
            Splitwise
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white truncate">
            {group.name}
          </h1>
          {group.description && (
            <p className="text-sm text-gray-400 mt-1">{group.description}</p>
          )}
          <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
            <Users className="h-3.5 w-3.5" />
            {group.members.length} members
          </div>
        </div>
        <DownloadSummaryButton group={group} />
      </div>

      <div className="grid gap-3 md:grid-cols-3 mb-8">
        <StatCard
          label="Total logged"
          value={formatINR(totalExpenses)}
          tone="neutral"
        />
        <StatCard
          label="Pending settlements"
          value={formatINR(pendingTotal)}
          sub={`${pendingShares.length} share${pendingShares.length === 1 ? "" : "s"}`}
          tone="amber"
        />
        <StatCard
          label="Expenses logged"
          value={group.expenses.length}
          tone="brand"
        />
      </div>

      <GroupDetailClient group={group} />
    </div>
  );
}

function StatCard({ label, value, sub, tone }) {
  const palette =
    tone === "amber"
      ? "border-amber-500/25 bg-amber-500/5"
      : tone === "brand"
        ? "border-brand/25 bg-brand/5"
        : "border-white/10 bg-ink-soft";
  const valueColor =
    tone === "amber"
      ? "text-amber-400"
      : tone === "brand"
        ? "text-brand"
        : "text-white";

  return (
    <div className={`rounded-2xl border p-4 ${palette}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
        {label}
      </p>
      <p
        className={`mt-2 text-2xl md:text-[28px] font-extrabold tracking-tight leading-none ${valueColor}`}
      >
        {value}
      </p>
      {sub && <p className="mt-2 text-[11px] text-gray-500">{sub}</p>}
    </div>
  );
}
