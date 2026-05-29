"use client";

import { useState } from "react";
import { Plus, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddExpenseDrawer } from "./add-expense-drawer";
import { ExpenseList } from "./expense-list";
import { MembersList } from "./members-list";

export function GroupDetailClient({ group }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="min-w-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Expenses</h2>
          <Button
            onClick={() => setDrawerOpen(true)}
            className="btn-primary gap-2 h-9"
          >
            <Plus className="h-4 w-4" />
            Add expense
          </Button>
        </div>

        <ExpenseList group={group} />
      </div>

      <aside className="space-y-6">
        <MembersList group={group} />

        <div className="rounded-2xl border border-white/10 bg-ink-soft p-5">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="h-4 w-4 text-brand" />
            <p className="text-sm font-semibold text-white">About reminders</p>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Click <strong className="text-white">Notify</strong> on any pending
            share to download a formatted bill (.txt) you can share via
            WhatsApp, Telegram, or SMS. Email delivery will be enabled once a
            verified domain is set up.
          </p>
        </div>
      </aside>

      <AddExpenseDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        group={group}
      />
    </div>
  );
}
