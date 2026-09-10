/**
 * Fixture tests for the SMS parser and categoriser.
 *
 * Run: node scripts/test-sms-parser.mjs
 *
 * No test runner is installed and none is needed: Node 22.7+ detects module
 * syntax in .js, so lib/sms/*.js imports directly.
 *
 * These fixtures are the reference formats from the plan, NOT your real
 * messages. Once Phase 0 is done, add cases from docs/sms-samples.md (masked)
 * so this script guards the formats your banks actually send.
 */

import { parseSMSVerbose } from "../lib/sms/parser.js";
import { isLikelyBankSender, identifyBank } from "../lib/sms/banks.js";
import {
  categorizeTransaction,
  invalidKeywordEntries,
  isValidCategory,
} from "../lib/sms/categorize.js";

const RECEIVED_AT = new Date(2026, 8, 10, 20, 0, 0); // 10 Sep 2026, local

let passed = 0;
let failed = 0;
const failures = [];

function check(name, actual, expected) {
  const ok = Object.is(actual, expected);
  if (ok) passed++;
  else {
    failed++;
    failures.push(`${name}\n      expected: ${JSON.stringify(expected)}\n      actual:   ${JSON.stringify(actual)}`);
  }
}

// ---------------------------------------------------------------------------
// Positive cases: these must parse
// ---------------------------------------------------------------------------

const TRANSACTIONS = [
  {
    name: "HDFC sent/UPI",
    sender: "VM-HDFCBK",
    body: "Sent Rs.499.00 From HDFC Bank A/C x1234 To SWIGGY On 02/09/26 Ref 528912345678",
    expect: { amount: 499, type: "EXPENSE", merchant: "SWIGGY", referenceId: "528912345678", accountLast4: "1234", bank: "HDFC", category: "food" },
  },
  {
    name: "HDFC debited to VPA",
    sender: "AD-HDFCBK",
    body: "Rs.1,250.00 debited from a/c **1234 on 02-09-26 to VPA zomato@ybl. Ref No 123456789012",
    expect: { amount: 1250, type: "EXPENSE", merchant: "zomato", referenceId: "123456789012", accountLast4: "1234", bank: "HDFC", category: "food" },
  },
  {
    name: "SBI debited by (no Rs prefix)",
    sender: "AD-SBIUPI",
    body: "Dear UPI user A/C X1234 debited by 250.0 on date 02Sep26 trf to BLINKIT Refno 123456789012",
    expect: { amount: 250, type: "EXPENSE", merchant: "BLINKIT", referenceId: "123456789012", accountLast4: "1234", bank: "SBI", category: "groceries" },
  },
  {
    name: "ICICI counterparty credited",
    sender: "JD-ICICIB",
    body: "ICICI Bank Acct XX123 debited for Rs 500.00 on 02-Sep-26; UBER credited. UPI:123456789012",
    expect: { amount: 500, type: "EXPENSE", merchant: "UBER", referenceId: "123456789012", accountLast4: "123", bank: "ICICI", category: "transportation" },
  },
  {
    name: "AXIS UPI slash format",
    sender: "VK-AXISBK",
    body: "INR 350.00 debited A/c no. XX1234 02-09-26 18:30:12 UPI/P2M/123456789012/NETFLIX",
    expect: { amount: 350, type: "EXPENSE", merchant: "NETFLIX", referenceId: "123456789012", accountLast4: "1234", bank: "AXIS", category: "entertainment" },
  },
  {
    name: "salary credit",
    sender: "VM-HDFCBK",
    body: "Rs.45000.00 credited to a/c **1234 on 01-09-26 by SALARY. Ref 987654321098",
    expect: { amount: 45000, type: "INCOME", merchant: "SALARY", referenceId: "987654321098", accountLast4: "1234", bank: "HDFC", category: "salary" },
  },
  {
    name: "debit quoting closing balance (balance must not win)",
    sender: "VM-HDFCBK",
    body: "Rs.150.00 debited from a/c **5678 to AMAZON on 09-09-26. Ref 111122223333. Avl Bal Rs.25,000.00",
    expect: { amount: 150, type: "EXPENSE", merchant: "AMAZON", referenceId: "111122223333", accountLast4: "5678", bank: "HDFC", category: "shopping" },
  },
  {
    name: "unknown bank, thin parse (low confidence)",
    sender: "XX-NEWBNK",
    body: "Rs.75 debited for purchase",
    expect: { amount: 75, type: "EXPENSE", merchant: null, referenceId: null, accountLast4: null, bank: null, category: "other-expense" },
  },

  // --- formats reported from real messages, 2026-09-10 ---------------------
  // Each of these broke the parser when first tried. Keep them.
  {
    name: "IDFC debit: rupee symbol, counterparty after a full stop, alphanumeric RRN",
    sender: "VM-IDFCB",
    body: "Your A/C XX9095 is debited by ₹1,000 on 01/01/2026. SWIGGY credited to RRN 1287T26. Available balance: ₹24,500. IDFC FIRST Bank.",
    expect: { amount: 1000, type: "EXPENSE", merchant: "SWIGGY", referenceId: "1287T26", accountLast4: "9095", bank: "IDFC", category: "food" },
  },
  {
    name: "IDFC credit: 'credited with', no merchant, no reference",
    sender: "VM-IDFCB",
    body: "Your Bank A/C XXX9095 is credited with INR 1,000 on 01/01/2026. Your new balance amount is ₹25,500.",
    expect: { amount: 1000, type: "INCOME", merchant: null, referenceId: null, accountLast4: "9095", bank: "IDFC", category: "other-income" },
  },
  {
    name: "credit card: 'Card ending', full month name, available limit must not win",
    sender: "VM-IDFCB",
    body: "Transaction successful: INR 100 spent using your IDFC Bank Credit Card ending 1234 on 01 September 2026 at 10:45. Available limit: ₹49,900.",
    expect: { amount: 100, type: "EXPENSE", merchant: null, referenceId: null, accountLast4: "1234", bank: "IDFC", category: "other-expense" },
  },
  {
    name: "Utkarsh super card: card number with no 'a/c', date with no year",
    sender: "KJ-UTKSPR",
    body: "Your Super Card 1001 debited for INR 250 on 1 Sep for UPI 6248ETX",
    expect: { amount: 250, type: "EXPENSE", merchant: null, referenceId: "6248ETX", accountLast4: "1001", bank: "UTKARSH", category: "other-expense" },
  },
];

console.log("--- transactions that must parse ---");
for (const t of TRANSACTIONS) {
  const { parsed, reason } = parseSMSVerbose(t.body, t.sender, RECEIVED_AT);
  if (!parsed) {
    failed++;
    failures.push(`${t.name}\n      expected a parse, got rejection: ${reason}`);
    console.log(`  FAIL  ${t.name} (rejected: ${reason})`);
    continue;
  }
  check(`${t.name} > amount`, parsed.amount, t.expect.amount);
  check(`${t.name} > type`, parsed.type, t.expect.type);
  check(`${t.name} > merchant`, parsed.merchant, t.expect.merchant);
  check(`${t.name} > referenceId`, parsed.referenceId, t.expect.referenceId);
  check(`${t.name} > accountLast4`, parsed.accountLast4, t.expect.accountLast4);
  check(`${t.name} > bank`, parsed.bank, t.expect.bank);

  const cat = await categorizeTransaction({
    merchant: parsed.merchant,
    description: t.body,
    type: parsed.type,
    useAI: false,
  });
  check(`${t.name} > category`, cat.category, t.expect.category);

  console.log(
    `  ${parsed.amount.toString().padStart(7)}  ${parsed.type.padEnd(7)}  ` +
      `${String(parsed.merchant).padEnd(10)}  conf=${parsed.confidence.toFixed(2)}  ` +
      `${cat.category} (${cat.tier})  ${t.name}`
  );
}

// ---------------------------------------------------------------------------
// Negative cases: these must be rejected. A false positive here writes a fake
// transaction and corrupts the account balance.
// ---------------------------------------------------------------------------

const NON_TRANSACTIONS = [
  ["OTP", "VM-HDFCBK", "123456 is your OTP for txn of Rs.499 at SWIGGY. Do not share it with anyone."],
  ["one-time password", "VM-HDFCBK", "Your one-time password is 445566 for Rs.1000 transfer."],
  ["balance alert only", "VM-HDFCBK", "Avl Bal in a/c **1234 is Rs.25,000.00 as on 09-09-26."],
  ["future mandate", "AD-SBIUPI", "Rs.499 will be debited from a/c **1234 on 15-09-26 towards NETFLIX autopay."],
  ["failed txn", "JD-ICICIB", "Your transaction of Rs.500 at AMAZON has failed. Ref 123456789012"],
  ["declined", "VK-AXISBK", "Transaction of INR 2000 declined due to insufficient balance."],
  ["collect request", "AD-SBIUPI", "SWIGGY has requested money Rs.499 on your UPI. Approve only if you know the payee."],
  ["promo", "VM-HDFCBK", "Get 10% cashback up to Rs.500 on your next purchase. Apply now!"],
  ["bill reminder", "VM-HDFCBK", "Your credit card bill of Rs.12,500 is due on 20-09-26."],
  ["no amount", "VM-HDFCBK", "Your account has been debited. Check the app for details."],
];

console.log("\n--- non-transactions that must be rejected ---");
for (const [name, sender, body] of NON_TRANSACTIONS) {
  const { parsed, reason } = parseSMSVerbose(body, sender, RECEIVED_AT);
  if (parsed) {
    failed++;
    failures.push(
      `${name}\n      expected rejection, got: amount=${parsed.amount} type=${parsed.type} merchant=${parsed.merchant}`
    );
    console.log(`  FALSE POSITIVE  ${name} -> ${parsed.amount} ${parsed.type}`);
  } else {
    passed++;
    console.log(`  rejected (${reason.padEnd(20)}) ${name}`);
  }
}

// ---------------------------------------------------------------------------
// Sender guard, confidence model, category-id integrity
// ---------------------------------------------------------------------------

console.log("\n--- sender guard ---");
check("DLT sender accepted", isLikelyBankSender("VM-HDFCBK"), true);
check("bare entity code accepted", isLikelyBankSender("HDFCBK"), true);
check("route suffix accepted", isLikelyBankSender("VM-HDFCBK-S"), true);
check("phone number rejected", isLikelyBankSender("+919876543210"), false);
check("plain number rejected", isLikelyBankSender("9876543210"), false);
check("empty rejected", isLikelyBankSender(""), false);
check("prefix stripped for bank id", identifyBank("JM-HDFCBK"), "HDFC");
// DLT codes vary by circle, so an unlisted variant must still resolve.
check("IDFCB resolves", identifyBank("VM-IDFCB"), "IDFC");
check("IDFCFB resolves", identifyBank("VM-IDFCFB"), "IDFC");
check("UTKSPR resolves", identifyBank("KJ-UTKSPR"), "UTKARSH");
check("lowercase sender resolves", identifyBank("vm-idfcb"), "IDFC");
check("unknown code stays null", identifyBank("VM-ZZZZZZ"), null);
console.log(`  ${passed} assertions so far`);

console.log("\n--- confidence model ---");
const rich = parseSMSVerbose(TRANSACTIONS[0].body, TRANSACTIONS[0].sender, RECEIVED_AT).parsed;
const thin = parseSMSVerbose(TRANSACTIONS[7].body, TRANSACTIONS[7].sender, RECEIVED_AT).parsed;
check("full parse scores 1.00", rich.confidence, 1);
check("thin parse stays below review threshold", thin.confidence < 0.7, true);
console.log(`  rich=${rich.confidence}  thin=${thin.confidence}`);

// A reversal is real money moving back, so it must parse, but it is ambiguous
// enough that it should always land in the review queue.
const reversal = parseSMSVerbose(
  "Rs.499.00 credited to a/c **1234 on 09-09-26. Your earlier transaction has been reversed. Ref 444455556666",
  "VM-HDFCBK",
  RECEIVED_AT
).parsed;
check("reversal parses as income", reversal?.type, "INCOME");
check("reversal flagged for review", reversal && reversal.confidence < 0.7, true);
console.log(`  reversal conf=${reversal?.confidence}`);

// ---------------------------------------------------------------------------
// Name independence.
//
// The parser must key off STRUCTURE (a debit or credit verb, a currency amount,
// an account or card number, a reference) and never off any particular bank or
// merchant name. Names are unbounded and change constantly. These assertions
// use deliberately absurd names to prove nothing is hardcoded.
// ---------------------------------------------------------------------------

console.log("\n--- name independence ---");

const nonsense = parseSMSVerbose(
  "Your A/C XX7788 is debited by INR 3,210.50 on 05/09/2026. QWERTY ZXCV PVT LTD credited to RRN 9F8E7D6C. Available balance: INR 100.",
  "PP-ZZZQQQ", // a bank that does not exist
  RECEIVED_AT
).parsed;

check("parses with an unknown bank", nonsense !== null, true);
check("amount from structure", nonsense?.amount, 3210.5);
check("direction from the verb", nonsense?.type, "EXPENSE");
check("account from the pattern", nonsense?.accountLast4, "7788");
check("reference from the label", nonsense?.referenceId, "9F8E7D6C");
check("merchant is whatever name was there", nonsense?.merchant, "QWERTY ZXCV PVT LTD");
check("unknown bank stays null", nonsense?.bank, null);
// Below the 0.7 threshold only because the bank is unknown, so it goes to review
// rather than being dropped. Degrade, never discard.
check("still confident enough to keep", nonsense?.confidence >= 0.7, true);

// The same message from a known bank differs ONLY in confidence.
const known = parseSMSVerbose(
  "Your A/C XX7788 is debited by INR 3,210.50 on 05/09/2026. QWERTY ZXCV PVT LTD credited to RRN 9F8E7D6C. Available balance: INR 100.",
  "VM-IDFCB",
  RECEIVED_AT
).parsed;
check("known bank extracts identically", known?.merchant, nonsense?.merchant);
check("known bank only scores higher", known.confidence > nonsense.confidence, true);
console.log(`  unknown bank conf=${nonsense.confidence}  known bank conf=${known.confidence}`);

// A merchant nobody has ever heard of still produces a usable transaction; it
// simply falls back to the generic category instead of a specific one.
const unknownMerchant = await categorizeTransaction({
  merchant: "QWERTY ZXCV PVT LTD",
  description: "",
  type: "EXPENSE",
  useAI: false,
});
check("unknown merchant falls back, never fails", unknownMerchant.category, "other-expense");
check("fallback is flagged as such", unknownMerchant.tier, "fallback");

console.log("\n--- category id integrity ---");
const bad = invalidKeywordEntries();
check("every keyword maps to a real category id", bad.length, 0);
if (bad.length) console.log("  invalid:", bad.map(([k, v]) => `${k}->${v}`).join(", "));
check("fallback expense id is real", isValidCategory("other-expense"), true);
check("fallback income id is real", isValidCategory("other-income"), true);

// ---------------------------------------------------------------------------

console.log("\n" + "=".repeat(60));
if (failed === 0) {
  console.log(`ALL PASS  ${passed} assertions`);
} else {
  console.log(`FAILED  ${failed} of ${passed + failed} assertions\n`);
  for (const f of failures) console.log("  - " + f);
  process.exitCode = 1;
}
