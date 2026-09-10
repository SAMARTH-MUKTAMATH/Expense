"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ClipboardPaste, CircleCheckBig, CircleSlash, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { importPastedSms } from "@/actions/import-sms";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const REASONS = {
  otp: "That is a one-time password, not a payment.",
  "future-mandate": "That says money will be taken later, so nothing has moved yet.",
  reminder: "That is a bill reminder, not a payment.",
  "failed-txn": "That payment failed, so no money moved.",
  "collect-request": "That is someone requesting money from you, not a payment.",
  promo: "That is a marketing message.",
  "no-transaction-verb": "No payment wording found, so this looks like a balance alert.",
  "no-amount": "No amount found. Amounts are never guessed.",
  "no-account": "You have no account to file this against. Create one first.",
  "empty": "Nothing pasted.",
  "too-long": "That is longer than a text message. Paste just the message.",
};

export function PasteSmsCard() {
  const [text, setText] = useState("");
  const [sender, setSender] = useState("");
  const [result, setResult] = useState(null);
  const [pending, startTransition] = useTransition();

  const onImport = () => {
    startTransition(async () => {
      try {
        const outcome = await importPastedSms({ text, sender });
        setResult(outcome);
        if (outcome.status === "created") {
          toast.success("Transaction added.");
          setText("");
          setSender("");
        } else if (outcome.status === "duplicate") {
          toast.info("Already imported. Nothing was added twice.");
        }
      } catch (error) {
        toast.error(error.message || "Could not import that.");
      }
    });
  };

  return (
    <Card className="glass-dark border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <ClipboardPaste size={20} className="text-brand" />
          Paste a bank message
        </CardTitle>
        <CardDescription className="text-white/60">
          Copy a message from your Messages app and paste it here. It gets read
          and filed automatically. No setup, no app to install. This is the
          simplest way to try it.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="Sent Rs.499.00 From HDFC Bank A/C x1234 To SWIGGY On 02/09/26 Ref 528912345678"
          className="w-full resize-y rounded-lg border border-white/15 bg-[#0a0a0a] p-3 font-mono text-sm text-white placeholder:text-white/25 focus:border-brand focus:outline-none"
        />

        <div className="flex flex-wrap items-center gap-3">
          <input
            value={sender}
            onChange={(e) => setSender(e.target.value)}
            placeholder="Sender, optional (e.g. VM-IDFCB)"
            className="min-w-56 flex-1 rounded-lg border border-white/15 bg-[#0a0a0a] px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-brand focus:outline-none"
          />
          <Button
            className="btn-primary gap-2"
            onClick={onImport}
            disabled={pending || !text.trim()}
          >
            <Copy size={16} />
            {pending ? "Reading…" : "Import"}
          </Button>
        </div>

        <p className="text-xs text-white/40">
          The sender helps identify the bank but is not required. Without it the
          message is still read, just with slightly lower confidence.
        </p>

        {/* --- outcome ------------------------------------------------------ */}
        {result?.status === "created" && (
          <div className="space-y-2 rounded-lg border border-brand/40 bg-brand/5 p-4">
            <p className="flex items-center gap-2 text-sm font-medium text-white">
              <CircleCheckBig size={16} className="text-brand" />
              Added as {result.type === "INCOME" ? "income" : "an expense"} of{" "}
              {inr.format(result.amount)}
            </p>
            <ul className="space-y-1 text-sm text-white/60">
              <li>Merchant: {result.merchant ?? "none found in the message"}</li>
              <li>Category: {result.category}</li>
              {result.bank && <li>Bank: {result.bank}</li>}
              {result.accountLast4 && <li>Account ending: {result.accountLast4}</li>}
            </ul>
            {result.needsReview && (
              <p className="text-sm text-amber-200">
                Flagged for review, because the category was a guess. Check it on
                the Review page.
              </p>
            )}
          </div>
        )}

        {result?.status === "ignored" && (
          <div className="rounded-lg border border-white/15 bg-black/30 p-4">
            <p className="flex items-center gap-2 text-sm font-medium text-white">
              <CircleSlash size={16} className="text-white/50" />
              Not imported
            </p>
            <p className="mt-1 text-sm text-white/60">
              {REASONS[result.reason] ?? `Reason: ${result.reason}`}
            </p>
            <p className="mt-2 text-xs text-white/40">
              If that was a real payment, send me the message and I will widen the
              rules for your bank.
            </p>
          </div>
        )}

        {result?.status === "duplicate" && (
          <div className="rounded-lg border border-white/15 bg-black/30 p-4 text-sm text-white/60">
            Already imported. The same payment often arrives twice, so it was
            skipped rather than counted again.
          </div>
        )}

        {(result?.status === "empty" || result?.status === "too-long") && (
          <div className="rounded-lg border border-white/15 bg-black/30 p-4 text-sm text-white/60">
            {REASONS[result.status]}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
