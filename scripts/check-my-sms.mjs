/**
 * Run the parser against YOUR real bank messages, without sending them anywhere.
 *
 *   node --no-warnings scripts/check-my-sms.mjs
 *   node --no-warnings scripts/check-my-sms.mjs --share
 *
 * Default mode prints full detail for your eyes only.
 *
 * --share mode prints a skeleton of each message instead: every digit becomes
 * "#" and every name becomes "NAME", keeping only the structural wording. That
 * is enough to fix a regular expression and carries none of your amounts,
 * balances, merchants or reference numbers. The output of --share is what you
 * paste into the chat.
 *
 * Input: docs/sms-samples.md, which is gitignored. Format is one block per
 * message, blocks separated by a blank line:
 *
 *   sender: VM-HDFCBK
 *   Sent Rs.499.00 From HDFC Bank A/C x1234 To SWIGGY On 02/09/26 Ref 528912345678
 *
 * Lines starting with #, >, -, or <!-- are ignored, so the headings in the
 * template file do not get treated as messages.
 */

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseSMSVerbose } from "../lib/sms/parser.js";
import { categorizeTransaction } from "../lib/sms/categorize.js";
import { identifyBank } from "../lib/sms/banks.js";

const SHARE = process.argv.includes("--share");
const here = dirname(fileURLToPath(import.meta.url));
const inputPath = join(here, "..", "docs", "sms-samples.md");

if (!existsSync(inputPath)) {
  console.error(`No file at ${inputPath}. Create it and paste your messages in.`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Skeletonising: keep the grammar, drop every value
// ---------------------------------------------------------------------------

/** Words that describe the transaction rather than identify you. */
const STRUCTURAL = new Set([
  "RS", "INR", "UPI", "AC", "ATM", "NEFT", "IMPS", "RTGS", "VPA", "REF", "REFNO",
  "RRN", "UTR", "NO", "ON", "TO", "FROM", "BY", "AND", "THE", "DR", "CR", "AT",
  "P2M", "P2A", "AVL", "BAL", "BALANCE", "OTP", "NOT", "YOU", "YOUR", "IS",
  "DEBITED", "CREDITED", "SENT", "PAID", "TRF", "INFO", "TXN", "DATE", "DEAR",
  "USER", "BANK", "ACCT", "ACCOUNT", "CARD", "VIA", "FOR", "WITH", "OF", "HAS",
  "BEEN", "IF", "CALL", "SMS", "HELP", "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
  // Bank names are not personal.
  "HDFC", "SBI", "ICICI", "AXIS", "KOTAK", "PNB", "BOB", "CANARA", "UNION",
  "IDFC", "YES", "INDUSIND", "FEDERAL", "RBL", "AU", "IDBI", "PAYTM", "BARODA",
]);

function skeleton(text) {
  let out = text;
  // VPA and email handles first, before digits are masked.
  out = out.replace(/\b[a-z0-9][a-z0-9._-]{2,}@([a-z]{2,15})\b/gi, "handle@$1");
  // Digits become #, preserving length. Length matters: a 12-digit run is the
  // UPI reference and the parser keys off exactly that.
  out = out.replace(/\d/g, "#");
  // Runs of capitals are merchant and payee names.
  out = out.replace(/\b[A-Z][A-Z&.'-]{2,}\b/g, (word) =>
    STRUCTURAL.has(word.replace(/[^A-Z]/g, "")) ? word : "NAME"
  );
  return out;
}

// ---------------------------------------------------------------------------
// Read the blocks
// ---------------------------------------------------------------------------

const rawFile = readFileSync(inputPath, "utf8");

// Strip HTML comments and fenced code blocks wholesale. The template file uses
// both to show an example, and without this the example would be scored as if
// it were one of your real messages.
const raw = rawFile
  .replace(/<!--[\s\S]*?-->/g, "")
  .replace(/```[\s\S]*?```/g, "");

const messages = [];

for (const block of raw.split(/\n\s*\n/)) {
  const lines = block
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !/^(#|>|-{3,}|<!--|\*|\d+\.)/.test(l) && !l.startsWith("-->"));

  if (lines.length === 0) continue;

  let sender = "";
  let hasSenderLine = false;
  const bodyLines = [];
  for (const line of lines) {
    const m = line.match(/^sender\s*:\s*(.*)$/i);
    if (m) {
      sender = m[1].trim();
      hasSenderLine = true;
    } else {
      bodyLines.push(line);
    }
  }

  // A block only counts as a message if it carries a "sender:" line. Without
  // this, the instructions and headings in the template file get scored as if
  // they were bank messages.
  if (!hasSenderLine) continue;

  const body = bodyLines.join(" ").trim();
  if (body) messages.push({ sender, body });
}

if (messages.length === 0) {
  console.error(
    "No messages found yet.\n\n" +
      "Paste each one under a heading in docs/sms-samples.md, like this:\n\n" +
      "  sender: VM-HDFCBK\n" +
      "  Sent Rs.499.00 From HDFC Bank A/C x1234 To SWIGGY On 02/09/26 Ref 528912345678\n\n" +
      "A block is only read as a message if it has a \"sender:\" line, so the\n" +
      "headings and instructions in that file are ignored."
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Run them
// ---------------------------------------------------------------------------

console.log(
  SHARE
    ? "REDACTED REPORT — safe to paste into the chat\n"
    : "LOCAL REPORT — full detail, do not paste this anywhere\n"
);
console.log(`${messages.length} messages from ${inputPath}\n`);

let parsedCount = 0;
let rejectedCount = 0;
const needsAttention = [];

for (const [i, { sender, body }] of messages.entries()) {
  const label = `#${String(i + 1).padStart(2, "0")}`;
  const bank = identifyBank(sender) ?? (sender ? "unrecognised" : "no sender given");
  const { parsed, reason } = parseSMSVerbose(body, sender, new Date());

  if (!parsed) {
    rejectedCount++;
    console.log(`${label}  REJECTED  reason=${reason}  bank=${bank}`);
    if (SHARE) console.log(`      ${skeleton(body)}`);
    else console.log(`      ${body}`);
    needsAttention.push({ label, kind: "rejected", reason, body, sender });
    console.log();
    continue;
  }

  parsedCount++;
  const category = await categorizeTransaction({
    merchant: parsed.merchant,
    description: body,
    type: parsed.type,
    useAI: false,
  });

  // Which fields were found, without revealing what they contain.
  const found = [
    parsed.merchant ? "merchant" : null,
    parsed.referenceId ? "ref" : null,
    parsed.accountLast4 ? "account" : null,
  ].filter(Boolean);
  const missing = ["merchant", "ref", "account"].filter((f) => !found.includes(f));

  console.log(
    `${label}  PARSED    ${parsed.type.padEnd(7)} conf=${parsed.confidence.toFixed(2)}  ` +
      `bank=${bank}  category=${category.category} (${category.tier})`
  );
  console.log(
    `      found: ${found.join(", ") || "amount only"}` +
      (missing.length ? `   MISSING: ${missing.join(", ")}` : "")
  );

  if (SHARE) console.log(`      ${skeleton(body)}`);
  else {
    console.log(
      `      amount=${parsed.amount} merchant=${parsed.merchant} ref=${parsed.referenceId} acct=${parsed.accountLast4}`
    );
  }

  const weak = parsed.confidence < 0.7 || category.tier === "fallback" || missing.length > 0;
  if (weak) needsAttention.push({ label, kind: "weak", missing, body, sender });
  console.log();
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log("=".repeat(64));
console.log(`parsed:   ${parsedCount}`);
console.log(`rejected: ${rejectedCount}`);
console.log(`needs attention: ${needsAttention.length}`);
console.log();
console.log("Check each REJECTED line yourself. If it was an OTP, a promo, a");
console.log("balance alert or a failed payment, rejecting it is CORRECT.");
console.log("Only a rejected real payment is a bug.");
console.log();
console.log("Anything under PARSED that shows MISSING, or a low confidence, means");
console.log("the regular expressions need widening for your bank's wording.");

if (!SHARE) {
  console.log();
  console.log("Re-run with --share to get a redacted version you can paste to me.");
}
