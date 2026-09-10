"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, Trash2, MessageSquareText, CircleCheckBig } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { defaultCategories, categoryColors } from "@/data/categories";
import {
  confirmTransaction,
  confirmTransactions,
  rejectTransaction,
} from "@/actions/review";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function reviewReason(item) {
  const missing = [];
  if (!item.merchantName) missing.push("no merchant name");
  if (!item.referenceId) missing.push("no reference number");

  const lowConfidence = item.parseConfidence !== null && item.parseConfidence < 0.7;

  if (lowConfidence) {
    const detail = missing.length ? ` It had ${missing.join(" and ")}.` : "";
    return `Fewer details than usual were found in this message.${detail} The amount and date are read directly, so those are usually right.`;
  }
  if (!item.merchantName) {
    return "No merchant name in the message, so the category is a guess.";
  }
  return "The category could not be worked out with confidence.";
}

function BulkBar({ items, selected, setSelected, onBulkDone }) {
  const [category, setCategory] = useState("");
  const [pending, startTransition] = useTransition();

  const allSelected = selected.size === items.length && items.length > 0;
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(items.map((i) => i.id)));

  const selectedItems = items.filter((i) => selected.has(i.id));
  const types = new Set(selectedItems.map((i) => i.type));
  const categoryOptions =
    types.size === 1
      ? defaultCategories.filter((c) => c.type === [...types][0])
      : [];

  const run = () =>
    startTransition(async () => {
      try {
        const ids = [...selected];
        const { count } = await confirmTransactions(ids, category || undefined);
        toast.success(`Confirmed ${count} ${count === 1 ? "transaction" : "transactions"}.`);
        onBulkDone(ids);
        setSelected(new Set());
        setCategory("");
      } catch (error) {
        toast.error(error.message || "Could not confirm those.");
      }
    });

  return (
    <div className="sticky top-20 z-10 flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-[#161616]/95 p-3 backdrop-blur">
      <label className="flex cursor-pointer items-center gap-2 text-sm text-white/80">
        <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
        {allSelected ? "Clear all" : `Select all ${items.length}`}
      </label>

      <span className="text-sm text-white/40">
        {selected.size > 0 ? `${selected.size} selected` : "none selected"}
      </span>

      <div className="ml-auto flex flex-wrap items-center gap-3">
        <Select
          value={category}
          onValueChange={setCategory}
          disabled={pending || selected.size === 0 || categoryOptions.length === 0}
        >
          <SelectTrigger className="w-52 bg-[#0a0a0a] border-white/15 text-white">
            <SelectValue
              placeholder={
                types.size > 1 ? "Mixed types, keep each" : "Keep each category"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          className="btn-primary gap-2"
          onClick={run}
          disabled={pending || selected.size === 0}
        >
          <Check size={16} />
          Confirm {selected.size > 0 ? selected.size : ""}
        </Button>
      </div>
    </div>
  );
}

function ReviewRow({ item, onDone, selected, onToggle }) {
  const [category, setCategory] = useState(item.category);
  const [pending, startTransition] = useTransition();
  const [showRaw, setShowRaw] = useState(false);

  const categoryOptions = defaultCategories.filter(
    (c) => c.type === (item.type === "INCOME" ? "INCOME" : "EXPENSE")
  );

  const onConfirm = () =>
    startTransition(async () => {
      try {
        await confirmTransaction(item.id, category);
        toast.success("Confirmed.");
        onDone(item.id);
      } catch (error) {
        toast.error(error.message || "Could not confirm.");
      }
    });

  const onReject = () =>
    startTransition(async () => {
      try {
        await rejectTransaction(item.id);
        toast.success("Deleted, and the balance has been put back.");
        onDone(item.id);
      } catch (error) {
        toast.error(error.message || "Could not delete.");
      }
    });

  return (
    <Card className="glass-dark border-white/10">
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <Checkbox
              checked={selected}
              onCheckedChange={() => onToggle(item.id)}
              className="mt-1 shrink-0"
              aria-label="Select for bulk confirm"
            />
            <div className="min-w-0">
            <p className="truncate text-base font-medium text-white">
              {item.merchantName || item.description || "Unnamed transaction"}
            </p>
            <p className="mt-1 text-sm text-white/50">
              {formatDate(item.date)} · {item.account?.name ?? "account"}
            </p>
            </div>
          </div>
          <p
            className={`shrink-0 text-lg font-semibold ${
              item.type === "INCOME" ? "text-brand" : "text-white"
            }`}
          >
            {item.type === "INCOME" ? "+" : "−"}
            {inr.format(item.amount)}
          </p>
        </div>

        <p className="rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-sm text-amber-200/90">
          {reviewReason(item)}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <span
            className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: categoryColors[category] ?? "#94a3b8" }}
          />
          <Select value={category} onValueChange={setCategory} disabled={pending}>
            <SelectTrigger className="w-56 bg-[#0a0a0a] border-white/15 text-white">
              <SelectValue placeholder="Pick a category" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button className="btn-primary gap-2" onClick={onConfirm} disabled={pending}>
            <Check size={16} />
            Confirm
          </Button>

          <Button
            variant="outline"
            className="gap-2 border-red-400/30 bg-transparent text-red-300 hover:bg-red-500/10 hover:text-red-200"
            onClick={onReject}
            disabled={pending}
          >
            <Trash2 size={16} />
            Not a transaction
          </Button>

          {item.rawMessage && (
            <Button
              variant="ghost"
              className="gap-2 text-white/60 hover:bg-white/5 hover:text-white"
              onClick={() => setShowRaw((v) => !v)}
            >
              <MessageSquareText size={16} />
              {showRaw ? "Hide message" : "Show message"}
            </Button>
          )}
        </div>

        {showRaw && item.rawMessage && (
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-black/40 p-3 font-mono text-xs text-white/70">
            {item.rawMessage}
          </pre>
        )}
      </CardContent>
    </Card>
  );
}

export function ReviewList({ initialItems }) {
  const [items, setItems] = useState(initialItems);
  const [selected, setSelected] = useState(() => new Set());

  const remove = (id) => {
    setItems((current) => current.filter((i) => i.id !== id));
    setSelected((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  };

  const removeMany = (ids) => {
    const gone = new Set(ids);
    setItems((current) => current.filter((i) => !gone.has(i.id)));
  };

  const toggle = (id) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (items.length === 0) {
    return (
      <Card className="glass-dark border-white/10">
        <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <CircleCheckBig size={36} className="text-brand" />
          <p className="text-lg font-medium text-white">Nothing to review</p>
          <p className="max-w-md text-sm text-white/50">
            Auto-imported transactions appear here when the parser is unsure about
            the amount, the merchant or the category. An empty queue means
            everything came through cleanly.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {items.length > 1 && (
        <BulkBar
          items={items}
          selected={selected}
          setSelected={setSelected}
          onBulkDone={removeMany}
        />
      )}
      {items.map((item) => (
        <ReviewRow
          key={item.id}
          item={item}
          onDone={remove}
          selected={selected.has(item.id)}
          onToggle={toggle}
        />
      ))}
    </div>
  );
}
