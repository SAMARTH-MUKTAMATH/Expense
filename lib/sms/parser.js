import { identifyBank } from "./banks.js";

const HARD_REJECT = [
  { re: /\botp\b/i, reason: "otp" },
  { re: /one[\s-]?time[\s-]?password/i, reason: "otp" },
  { re: /verification code/i, reason: "otp" },
  { re: /\bdo not share\b/i, reason: "otp" },
  { re: /\bnever shares?\b/i, reason: "otp" },

  { re: /\bwill be (?:debited|deducted|charged|credited)\b/i, reason: "future-mandate" },
  { re: /\bis due\b|\bdue on\b|\bdue date\b|\bpayment due\b/i, reason: "reminder" },

  { re: /\b(?:has\s+)?(?:failed|declined|unsuccessful|not processed|rejected)\b/i, reason: "failed-txn" },

  { re: /\brequest(?:ed|s)?\s+(?:for\s+)?(?:money|payment|rs)/i, reason: "collect-request" },
  { re: /\bcollect request\b/i, reason: "collect-request" },

  { re: /\bapply now\b/i, reason: "promo" },
  { re: /\bpre[\s-]?approved\b/i, reason: "promo" },
  { re: /\bclick (?:here|below)\b/i, reason: "promo" },
  { re: /\bt&c\b|\bterms (?:and|&) conditions\b/i, reason: "promo" },
  { re: /\b(?:limited|special|exclusive) offer\b/i, reason: "promo" },
  { re: /\bshop now\b|\bdownload (?:the )?app\b/i, reason: "promo" },
  { re: /\d+\s?% (?:off|cashback)\b/i, reason: "promo" },
];

const AMBIGUOUS_PATTERNS = [/\brevers(?:ed|al)\b/i, /\brefund(?:ed)?\b/i];

const DEBIT_VERBS = /\b(?:debited|debit|sent|paid|withdrawn|spent|purchased|deducted)\b/i;
const CREDIT_VERBS = /\b(?:credited|credit|received|deposited|refunded|reversed)\b/i;

const AMOUNT_RE =
  /(?:(?:rs\.?|inr|₹)\s*|(?:debited|credited|debit|credit)\s+(?:by|for|with)\s+)([\d,]+(?:\.\d{1,2})?)/gi;

const BALANCE_CONTEXT = /\b(?:bal|balance|avl|avbl|available|limit|outstanding|due)\b/i;

function extractAmount(text) {
  const re = new RegExp(AMOUNT_RE.source, "gi");
  let m;
  while ((m = re.exec(text)) !== null) {
    const before = text.slice(Math.max(0, m.index - 28), m.index);
    if (BALANCE_CONTEXT.test(before)) continue;
    const value = Number(m[1].replace(/,/g, ""));
    if (Number.isFinite(value) && value > 0) return value;
  }
  return null;
}

function extractDirection(text) {
  const debitAt = text.search(DEBIT_VERBS);
  const creditAt = text.search(CREDIT_VERBS);
  if (debitAt === -1 && creditAt === -1) return null;
  if (debitAt === -1) return "INCOME";
  if (creditAt === -1) return "EXPENSE";
  return debitAt < creditAt ? "EXPENSE" : "INCOME";
}

const REF_BARE_RRN = /\b(\d{12})\b/;
const REF_LABELLED =
  /(?:ref(?:erence)?\s*(?:no\.?|num(?:ber)?|#)?|rrn|utr|txn\s*id|transaction\s*id|upi(?:\s*ref)?)\s*[:.\-/]?\s*([A-Za-z0-9]{6,22})/i;

function extractReference(text) {
  const bare = text.match(REF_BARE_RRN);
  if (bare) return bare[1];
  const labelled = text.match(REF_LABELLED);
  if (labelled && /\d/.test(labelled[1])) return labelled[1];
  return null;
}

const ACCOUNT_RE =
  /\b(?:a\/c|acct|account)\s*(?:no\.?|number)?\s*[:.\-]?\s*(?:[x*]+\s*)?(\d{3,6})/i;

const CARD_RE =
  /\b(?:credit|debit|super|prepaid|forex|add[\s-]?on)?\s*card\s*(?:no\.?|number|ending(?:\s+(?:in|with))?)?\s*[:.\-]?\s*(?:[x*]+\s*)?(\d{3,6})/i;

function extractAccountLast4(text) {
  const account = text.match(ACCOUNT_RE);
  if (account) return account[1].slice(-4);
  const card = text.match(CARD_RE);
  return card ? card[1].slice(-4) : null;
}

const MERCHANT_UPI_SLASH =
  /\bUPI\/(?:[A-Z0-9]{2,4}\/)?\d{6,}\/([A-Za-z0-9][A-Za-z0-9 &._'-]{1,40})/i;

const MERCHANT_VPA = /\b([a-z0-9][a-z0-9._-]{2,})@([a-z]{2,15})\b(?!\.[a-z]{2,})/i;

const REF_LABEL_LOOKAHEAD = /(?!(?:rrn|ref|refno|reference|upi|utr|txn|vpa)\b)/
  .source;

const MERCHANT_PREPOSITION = new RegExp(
  `\\b(?:trf(?:erred)?\\s+to|transferred\\s+to|paid\\s+to|sent\\s+to|towards|to|at)\\s+${REF_LABEL_LOOKAHEAD}([A-Za-z][A-Za-z0-9 &.'-]{2,40}?)(?=\\s+(?:on|ref|refno|rrn|upi|utr|dated|a\\/c|acct|from|via|info|not|credited|debited)\\b|[.,;]|$)`,
  "i"
);

const MERCHANT_BY = new RegExp(
  `\\bby\\s+${REF_LABEL_LOOKAHEAD}([A-Za-z][A-Za-z0-9 &.'-]{2,40}?)(?=\\s+(?:on|ref|refno|rrn|upi|utr|dated)\\b|[.,;]|$)`,
  "i"
);

const MERCHANT_COUNTERPARTY_CREDITED = new RegExp(
  `[.;,]\\s*${REF_LABEL_LOOKAHEAD}([A-Za-z][A-Za-z0-9 &.'-]{2,40}?)\\s+credited\\b`,
  "i"
);

const MERCHANT_STOPWORDS =
  /^(?:your|the|a\/c|ac|acct|account|upi|vpa|bank|card|rs|inr|you|us|me|self|date|info)$/i;

function cleanMerchant(raw) {
  if (!raw) return null;
  const cleaned = raw
    .replace(/^vpa\s+/i, "")
    .replace(/[\s.,;:-]+$/, "")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length < 2) return null;
  if (MERCHANT_STOPWORDS.test(cleaned)) return null;
  if (/^\d+$/.test(cleaned)) return null;
  return cleaned;
}

function extractMerchant(text, direction) {
  const slash = text.match(MERCHANT_UPI_SLASH);
  if (slash) {
    const m = cleanMerchant(slash[1]);
    if (m) return m;
  }

  const vpa = text.match(MERCHANT_VPA);
  if (vpa) {
    const m = cleanMerchant(vpa[1]);
    if (m) return m;
  }

  if (direction === "EXPENSE") {
    const counterparty = text.match(MERCHANT_COUNTERPARTY_CREDITED);
    if (counterparty) {
      const m = cleanMerchant(counterparty[1]);
      if (m) return m;
    }
  }

  const preposition = text.match(MERCHANT_PREPOSITION);
  if (preposition) {
    const m = cleanMerchant(preposition[1]);
    if (m) return m;
  }

  const by = text.match(MERCHANT_BY);
  if (by) {
    const m = cleanMerchant(by[1]);
    if (m) return m;
  }

  return null;
}

const MONTHS = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

const DATE_ALPHA = /\b(\d{1,2})[-\s]?([A-Za-z]{3,9})[-\s,]*(\d{2,4})\b/;
const DATE_ALPHA_NO_YEAR = /\b(\d{1,2})[-\s]([A-Za-z]{3,9})\b/;
const DATE_NUMERIC = /\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/;
const TIME_RE = /\b(\d{1,2}):(\d{2})(?::(\d{2}))?\b/;

function expandYear(y) {
  const n = Number(y);
  return n < 100 ? 2000 + n : n;
}

function extractDate(text, receivedAt) {
  const fallback = receivedAt instanceof Date && !Number.isNaN(receivedAt.getTime())
    ? receivedAt
    : new Date();

  let day;
  let month;
  let year;
  let yearWasGuessed = false;

  const monthOf = (word) => MONTHS[word.slice(0, 3).toLowerCase()];

  const alpha = text.match(DATE_ALPHA);
  const numeric = text.match(DATE_NUMERIC);

  if (alpha && monthOf(alpha[2]) !== undefined) {
    day = Number(alpha[1]);
    month = monthOf(alpha[2]);
    year = expandYear(alpha[3]);
  } else if (numeric) {
    day = Number(numeric[1]);
    month = Number(numeric[2]) - 1;
    year = expandYear(numeric[3]);
  } else {
    const noYear = text.match(DATE_ALPHA_NO_YEAR);
    if (!noYear || monthOf(noYear[2]) === undefined) return fallback;
    day = Number(noYear[1]);
    month = monthOf(noYear[2]);
    year = fallback.getFullYear();
    yearWasGuessed = true;
  }

  if (day < 1 || day > 31 || month < 0 || month > 11) return fallback;

  let hours = 0;
  let minutes = 0;
  let seconds = 0;
  const time = text.match(TIME_RE);
  if (time) {
    hours = Number(time[1]);
    minutes = Number(time[2]);
    seconds = time[3] ? Number(time[3]) : 0;
    if (hours > 23 || minutes > 59 || seconds > 59) {
      hours = 0;
      minutes = 0;
      seconds = 0;
    }
  }

  let candidate = new Date(year, month, day, hours, minutes, seconds);
  if (Number.isNaN(candidate.getTime())) return fallback;
  if (candidate.getDate() !== day || candidate.getMonth() !== month) return fallback;

  const DAY_MS = 86_400_000;

  if (yearWasGuessed && candidate.getTime() > fallback.getTime() + DAY_MS) {
    candidate = new Date(year - 1, month, day, hours, minutes, seconds);
  }

  if (candidate.getTime() > fallback.getTime() + DAY_MS) return fallback;
  if (candidate.getTime() < fallback.getTime() - 400 * DAY_MS) return fallback;

  return candidate;
}

const CONFIDENCE = {
  BASE: 0.55,
  KNOWN_BANK: 0.15,
  REFERENCE: 0.15,
  MERCHANT: 0.1,
  ACCOUNT: 0.05,
  AMBIGUOUS_PENALTY: 0.25,
};

export const REVIEW_THRESHOLD = 0.7;

export function parseSMSVerbose(body, sender, receivedAt) {
  if (typeof body !== "string" || !body.trim()) {
    return { parsed: null, reason: "empty-body" };
  }

  const text = body.replace(/\s+/g, " ").trim();

  for (const { re, reason } of HARD_REJECT) {
    if (re.test(text)) return { parsed: null, reason };
  }

  const type = extractDirection(text);
  if (!type) return { parsed: null, reason: "no-transaction-verb" };

  const amount = extractAmount(text);
  if (amount === null) return { parsed: null, reason: "no-amount" };

  const bank = identifyBank(sender ?? "");
  const referenceId = extractReference(text);
  const accountLast4 = extractAccountLast4(text);
  const merchant = extractMerchant(text, type);
  const occurredAt = extractDate(text, receivedAt);

  let confidence = CONFIDENCE.BASE;
  if (bank) confidence += CONFIDENCE.KNOWN_BANK;
  if (referenceId) confidence += CONFIDENCE.REFERENCE;
  if (merchant) confidence += CONFIDENCE.MERCHANT;
  if (accountLast4) confidence += CONFIDENCE.ACCOUNT;
  if (AMBIGUOUS_PATTERNS.some((re) => re.test(text))) {
    confidence -= CONFIDENCE.AMBIGUOUS_PENALTY;
  }
  confidence = Math.round(Math.min(1, Math.max(0, confidence)) * 100) / 100;

  return {
    parsed: {
      amount,
      type,
      merchant,
      referenceId,
      accountLast4,
      occurredAt,
      confidence,
      bank,
    },
    reason: null,
  };
}

export function parseSMS(body, sender, receivedAt) {
  return parseSMSVerbose(body, sender, receivedAt).parsed;
}
