import { formatINR } from "@/lib/utils";

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export function formatBillText({ group, expense, member, share }) {
  const lines = [
    "══════════════════════════════════════",
    "       BudgetFLOW · Settlement Bill",
    "══════════════════════════════════════",
    "",
    `Group        : ${group.name}`,
    `Expense      : ${expense.description}`,
    `Date         : ${formatDate(expense.createdAt)}`,
    `Paid by      : ${expense.paidByName}`,
    "",
    "──────────────────────────────────────",
    `For          : ${member.name}`,
    `Email        : ${member.email}`,
    "",
    `Total expense: ${formatINR(expense.amount)}`,
    `Your share   : ${formatINR(share.amount)}`,
    "──────────────────────────────────────",
    "",
    `Please settle ${formatINR(share.amount)} with ${expense.paidByName}`,
    `via UPI, cash, or any preferred method.`,
    "",
    "Thanks!",
    "— BudgetFLOW",
  ];
  return lines.join("\n");
}

export function billFileName({ group, member, expense }) {
  const safe = (s) => s.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  return `bill-${safe(group.name)}-${safe(member.name)}-${safe(expense.description)}.txt`;
}

const pad = (s, n) => String(s ?? "").padEnd(n).slice(0, n);
const padLeft = (s, n) => String(s ?? "").padStart(n).slice(0, n);

/**
 * Build a full group statement covering every expense + every share.
 * Used by the "Download summary" button on the group detail page.
 */
export function formatGroupSummary(group) {
  const lines = [];
  lines.push("══════════════════════════════════════════════════════════════");
  lines.push(`       BudgetFLOW · Splitwise Summary — ${group.name}`);
  lines.push("══════════════════════════════════════════════════════════════");
  lines.push("");
  lines.push(
    `Generated   : ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`
  );
  if (group.description) lines.push(`Description : ${group.description}`);
  lines.push(`Members     : ${group.members.length}`);
  lines.push(`Expenses    : ${group.expenses.length}`);
  lines.push("");

  // --- Members ---
  lines.push("──────────────────────────────────────────────────────────────");
  lines.push("MEMBERS");
  lines.push("──────────────────────────────────────────────────────────────");
  group.members.forEach((m, i) => {
    lines.push(`  ${i + 1}. ${m.name}  <${m.email}>`);
  });
  lines.push("");

  // --- Expenses ---
  lines.push("──────────────────────────────────────────────────────────────");
  lines.push("EXPENSES");
  lines.push("──────────────────────────────────────────────────────────────");
  if (group.expenses.length === 0) {
    lines.push("  (no expenses logged)");
  } else {
    group.expenses.forEach((e, i) => {
      const date = new Date(e.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      lines.push("");
      lines.push(
        `  ${i + 1}. ${e.description}  —  ₹${Number(e.amount).toFixed(2)}`
      );
      lines.push(`     Paid by ${e.paidByName} · ${date}`);
      e.shares.forEach((s) => {
        const status = s.settled ? "[paid]" : "[pending]";
        lines.push(
          `       • ${pad(s.member.name, 18)} ₹${padLeft(Number(s.amount).toFixed(2), 9)}  ${status}`
        );
      });
    });
  }
  lines.push("");

  // --- Per-member running totals ---
  lines.push("──────────────────────────────────────────────────────────────");
  lines.push("BALANCE PER MEMBER");
  lines.push("──────────────────────────────────────────────────────────────");
  const totals = new Map();
  group.members.forEach((m) =>
    totals.set(m.id, { name: m.name, pending: 0, settled: 0 })
  );
  group.expenses.forEach((e) =>
    e.shares.forEach((s) => {
      const t = totals.get(s.member.id);
      if (!t) return;
      if (s.settled) t.settled += Number(s.amount);
      else t.pending += Number(s.amount);
    })
  );
  for (const t of totals.values()) {
    lines.push(
      `  ${pad(t.name, 22)} pending ₹${padLeft(t.pending.toFixed(2), 9)}   settled ₹${padLeft(t.settled.toFixed(2), 9)}`
    );
  }
  lines.push("");

  // --- Group total ---
  const totalSpent = group.expenses.reduce(
    (s, e) => s + Number(e.amount),
    0
  );
  const totalPending = group.expenses.reduce(
    (s, e) =>
      s +
      e.shares
        .filter((sh) => !sh.settled)
        .reduce((acc, sh) => acc + Number(sh.amount), 0),
    0
  );
  lines.push("══════════════════════════════════════════════════════════════");
  lines.push(`  Total logged          ₹${totalSpent.toFixed(2)}`);
  lines.push(`  Pending settlements   ₹${totalPending.toFixed(2)}`);
  lines.push("══════════════════════════════════════════════════════════════");
  lines.push("");
  lines.push("— BudgetFLOW");
  return lines.join("\n");
}

export function groupSummaryFileName(group) {
  const safe = (s) => s.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const date = new Date().toISOString().slice(0, 10);
  return `splitwise-summary-${safe(group.name)}-${date}.txt`;
}

/**
 * Trigger a browser download of `text` as a file. Client-only.
 */
export function downloadTextFile(text, filename) {
  if (typeof window === "undefined") return;
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
