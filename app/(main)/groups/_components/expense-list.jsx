"use client";

import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import {
  Receipt,
  Download,
  Check,
  RotateCcw,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/utils";
import {
  getNotifyPayload,
  settleShare,
  unsettleShare,
} from "@/actions/groups";
import {
  formatBillText,
  billFileName,
  downloadTextFile,
} from "@/lib/bill-formatter";

const PAGE_SIZE = 3;

export function ExpenseList({ group }) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(
    1,
    Math.ceil((group.expenses?.length ?? 0) / PAGE_SIZE)
  );
  // Clamp page if expenses count changed (e.g. after delete)
  const currentPage = Math.min(page, totalPages);

  const pageExpenses = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return group.expenses.slice(start, start + PAGE_SIZE);
  }, [group.expenses, currentPage]);

  if (!group.expenses?.length) {
    return (
      <Card className="bg-ink-soft border-white/10">
        <CardContent className="py-14 text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-brand/15 text-brand flex items-center justify-center mb-3">
            <Receipt className="h-6 w-6" />
          </div>
          <p className="text-sm text-gray-300">No expenses yet</p>
          <p className="text-xs text-gray-500 mt-1">
            Tap "Add expense" to log your first shared bill.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.07, delayChildren: 0.05 },
            },
            exit: {
              opacity: 0,
              transition: { duration: 0.25, ease: [0.32, 0.72, 0, 1] },
            },
          }}
          className="space-y-4"
        >
          {pageExpenses.map((expense) => (
            <motion.div
              key={expense.id}
              variants={{
                hidden: { opacity: 0, y: 14, filter: "blur(4px)" },
                visible: {
                  opacity: 1,
                  y: 0,
                  filter: "blur(0px)",
                  transition: {
                    duration: 0.5,
                    ease: [0.32, 0.72, 0, 1],
                  },
                },
                exit: {
                  opacity: 0,
                  y: -10,
                  filter: "blur(3px)",
                  transition: { duration: 0.25, ease: [0.32, 0.72, 0, 1] },
                },
              }}
            >
              <ExpenseItem expense={expense} groupName={group.name} />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
      {totalPages > 1 && (
        <Pagination
          page={currentPage}
          totalPages={totalPages}
          totalItems={group.expenses.length}
          onChange={setPage}
        />
      )}
    </div>
  );
}

function Pagination({ page, totalPages, totalItems, onChange }) {
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, totalItems);

  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      <p className="text-xs text-gray-500">
        Showing {from}–{to} of {totalItems}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {Array.from({ length: totalPages }).map((_, i) => {
          const n = i + 1;
          const active = n === page;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={
                "relative h-8 min-w-8 px-2 rounded-md text-xs font-semibold transition-colors duration-200 " +
                (active ? "text-ink" : "text-gray-400 hover:text-white")
              }
              aria-label={`Page ${n}`}
              aria-current={active ? "page" : undefined}
            >
              {active && (
                <motion.span
                  layoutId="expense-page-indicator"
                  className="absolute inset-0 rounded-md bg-brand shadow-[0_4px_14px_-2px_rgba(137,233,0,0.45)]"
                  transition={{
                    type: "spring",
                    stiffness: 240,
                    damping: 28,
                    mass: 0.9,
                  }}
                />
              )}
              <span className="relative">{n}</span>
            </button>
          );
        })}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function ExpenseItem({ expense, groupName }) {
  return (
    <Card className="bg-ink-soft border-white/10 overflow-hidden">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-white truncate">
              {expense.description}
            </h3>
            <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400">
              <span className="inline-flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />
                {new Date(expense.createdAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <span>Paid by {expense.paidByName}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
              Total
            </p>
            <p className="text-lg font-extrabold text-white">
              {formatINR(expense.amount)}
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          {expense.shares.map((share) => (
            <ShareRow
              key={share.id}
              share={share}
              expense={expense}
              groupName={groupName}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ShareRow({ share, expense, groupName }) {
  const [busy, setBusy] = useState(null);

  const handleNotify = async () => {
    try {
      setBusy("notify");
      const res = await getNotifyPayload(share.id);
      if (!res?.success) throw new Error("Could not prepare bill");
      const text = formatBillText(res.data);
      const filename = billFileName(res.data);
      downloadTextFile(text, filename);
      toast.success(`Bill downloaded for ${res.data.member.name}`);
    } catch (err) {
      toast.error(err.message || "Failed to prepare bill");
    } finally {
      setBusy(null);
    }
  };

  const handleSettle = async () => {
    try {
      setBusy("settle");
      const res = await settleShare(share.id);
      if (!res?.success) throw new Error("Could not settle");
      toast.success("Marked as paid");
    } catch (err) {
      toast.error(err.message || "Failed");
    } finally {
      setBusy(null);
    }
  };

  const handleUnsettle = async () => {
    try {
      setBusy("unsettle");
      const res = await unsettleShare(share.id);
      if (!res?.success) throw new Error("Could not undo");
      toast.success("Reopened");
    } catch (err) {
      toast.error(err.message || "Failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div
      className={
        "flex items-center justify-between gap-3 rounded-lg border px-3 py-2 " +
        (share.settled
          ? "border-emerald-500/20 bg-emerald-500/5"
          : "border-white/8 bg-ink")
      }
    >
      <div className="min-w-0 flex items-center gap-2">
        <span
          className={
            "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 " +
            (share.settled
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-amber-500/15 text-amber-400")
          }
        >
          {share.member.name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate leading-tight">
            {share.member.name}
          </p>
          <p className="text-[10px] text-gray-500 truncate">
            {share.member.email}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span
          className={
            "text-sm font-semibold " +
            (share.settled ? "text-emerald-400" : "text-amber-400")
          }
        >
          {formatINR(share.amount)}
        </span>

        {share.settled ? (
          <>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium uppercase tracking-wider">
              <Check className="h-3 w-3" />
              Settled
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-gray-400 hover:text-white hover:bg-white/5"
              onClick={handleUnsettle}
              disabled={busy === "unsettle"}
              aria-label="Reopen"
              title="Reopen"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-brand hover:bg-brand/10 hover:text-brand gap-1"
              onClick={handleNotify}
              disabled={busy === "notify"}
            >
              <Download className="h-3.5 w-3.5" />
              {busy === "notify" ? "..." : "Notify"}
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs btn-primary gap-1"
              onClick={handleSettle}
              disabled={busy === "settle"}
            >
              <Check className="h-3.5 w-3.5" />
              {busy === "settle" ? "..." : "Paid"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
