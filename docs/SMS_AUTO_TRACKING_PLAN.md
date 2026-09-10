# Auto Transaction Tracking from Bank SMS — paisa Implementation Plan

**Goal:** stop manually logging transactions. When the bank sends
*"Rs.499 debited from a/c \*\*1234 to SWIGGY"*, the transaction should appear in
paisa, already categorised, with zero user action.

**Constraint:** entire build must cost ₹0. No Play Store fee, no paid APIs, no
paid hosting.

**Status:** Phases 1 to 5 are implemented and verified. Everything that can be
built without a phone is done: generate a token at `/settings`, point a
forwarder at `/api/ingest/sms`, and a bank SMS becomes a categorised transaction
with the account balance updated.

**Phase 0 is the blocker and it is a user task.** The parser was built against
the reference formats in section 4, not against real Union Bank or Bank of
Baroda messages. Collect samples before running Phase 6.

**Verification so far**

| Check | Command | Result |
|---|---|---|
| Parser and categoriser fixtures | `node --no-warnings scripts/test-sms-parser.mjs` | 125 assertions pass |
| Ingest route end to end | throwaway user against a local dev server | 29 assertions pass |
| Review queue end to end | throwaway user, flagging and reversal | 13 assertions pass |
| Production build | `npx next build` | compiles; `/settings`, `/review` and `/api/ingest/sms` all present |

**Name independence is asserted, not assumed.** The parser keys off structure —
a debit or credit verb, a currency amount, an account or card number, a
reference — and never off a specific bank or merchant name. The suite proves
this with an invented bank (`PP-ZZZQQQ`) and a nonsense merchant, checking that
extraction is identical to a known bank and only the confidence score differs.
An unknown name degrades the score; it never discards the message.

The end-to-end run covered auth rejection, a debit, a credit, duplicate
suppression by reference id, OTP and promo rejection, phone-number senders, and
balance correctness in both directions. It created and deleted its own user, so
live data was never involved.

> **Provenance.** This plan was originally written for a different codebase
> (`../expense-tracker`, TypeScript, `src/` layout). It was audited against
> paisa on 2026-09-10 and rewritten. Section 0 records what changed and why —
> read it before trusting any estimate carried over from the original.

---

## 0. Audit — original plan vs. paisa reality

The original plan claimed **"roughly 80% of the work is already done"**. That is
true of expense-tracker. It is **false of paisa**. None of the pipeline it
depends on exists here.

### 0.1 Things the original plan assumed exist — that do not

| Original claim | Path it named | Reality in paisa |
|---|---|---|
| 4-tier categorisation | `src/lib/categorization/hybridCategorizer.ts` | **Does not exist.** No categoriser of any kind. |
| Merchant memory / self-learning | `src/lib/categorization/merchantCache.ts` | **Does not exist.** No merchant table. |
| UPI string → merchant extraction | `src/lib/parsers/upiParser.ts` | **Does not exist.** |
| Indian merchant keyword map | `constants.ts` → `DEFAULT_CATEGORIES` | **Does not exist.** `data/categories.js` holds display metadata only — name, colour, icon. Zero keywords. |
| Confidence + `needsReview` + review queue | `src/app/(app)/review` | **Does not exist.** No confidence column, no review page. |
| Ingest → categorise → persist flow | `src/app/api/upload/route.ts` | **Does not exist.** No CSV upload in paisa at all. |
| `merchantNameNormalized` inconsistency to fix | — | **Not applicable.** Neither column exists, so the original section 3d is dropped. |

The only AI in paisa is `scanReceipt()` in `actions/transaction.js`, which sends a
receipt **image** to Gemini and gets back one transaction. It is not a text
categoriser and its signature does not fit SMS.

**Consequence:** categorisation becomes its own phase (Phase 3 below), not a free
import. This is the single largest correction to the original estimate.

### 0.2 Things in paisa the original plan did not account for

| Finding | Why it matters | Where handled |
|---|---|---|
| `Transaction.accountId` is **required** (non-nullable) | An SMS has no account id. Ingest must resolve one or the insert fails. | Phase 4 |
| `Account.balance` is **denormalised** and hand-maintained | Every write path updates it inside `db.$transaction`. Skip this and balances silently drift — a data-corruption bug, not a cosmetic one. | Phase 4 |
| `TransactionType` is `INCOME` / `EXPENSE` | The original plan emits `DEBIT` / `CREDIT`. Needs mapping: DEBIT→EXPENSE, CREDIT→INCOME. | Phase 2 |
| `Transaction.category` is a plain `String` | Must hold an **id** from `data/categories.js` (`"food"`, `"groceries"`), not free text. Nothing enforces this at the DB level. | Phase 3 |
| Arcjet `detectBot({ mode: "LIVE" })` runs on **every** `/api/*` route | MacroDroid and a Kotlin `OkHttp` client are not browsers. Arcjet **will block them**. This kills Phase 6 before it starts unless bypassed. | Phase 4 |
| Migration history has **drifted** | `prisma/migrations/` has one migration creating 4 tables. The schema has 9 models. `groups`, `financial_reports` and others were applied with `db push`. Running `prisma migrate dev` will detect drift and offer to **reset the database**. | Phase 1 |
| Budget threshold alerts fire on expense create | An SMS-created expense should trigger them too, or budget alerts silently under-report. | Phase 4 |
| PWA already shipped | `app/manifest.js`, `app/icon.js`, `public/sw.js` all exist. | original Phase 8 **deleted** |
| No settings route exists | `app/(main)/` has dashboard, account, transaction, advisor, groups. No settings. Token UI needs a new route. | Phase 5 |
| No test runner installed | No vitest, no jest. Parser fixtures need a runner added, or a plain Node script. | Phase 2 |
| Codebase is **JavaScript**, not TypeScript | Every `.ts` snippet in the original plan is rewritten as `.js` with JSDoc. | throughout |

### 0.3 Revised effort

| | Original | paisa |
|---|---|---|
| Web-app phases | ~1.5 days | **~3 days** (categoriser and review UI are new) |
| Validation | 1 hour | 1 hour |
| Native phases | a weekend | a weekend |

---

## 1. Why this needs a phone-side component

A browser cannot read SMS. There is no Web SMS API and there will not be one.
paisa being an installed PWA does **not** change this — a PWA runs in the browser
sandbox and gets no native permissions.

The only SMS-adjacent web API is **WebOTP**
(`navigator.credentials.get({ otp: ... })`), which only fires for messages
explicitly formatted with your origin bound in (`@yourapp.com #123456`) and only
ever returns an OTP code. Bank debit alerts never match it. There is also no web
equivalent of Android's `NotificationListenerService`.

So auto-detection always needs something running **on the device** that reads the
SMS and pushes it to our server.

---

## 2. Architecture

```
  Bank SMS arrives on phone
            |
            v
  [ Device-side sender ]           Phase 6 (MacroDroid)  then  Phase 8 (APK)
            |
            |  HTTPS POST { sender, body, receivedAt }
            |  Authorization: Bearer <ingest token>
            v
  middleware.js  -- BYPASS Arcjet for /api/ingest/*      Phase 4
            |
            v
  POST /api/ingest/sms                                   Phase 4
            |
            +--> lib/sms/parser.js      Phase 2   regex -> amount / merchant / ref
            |
            +--> lib/sms/categorize.js  Phase 3   keyword rules -> category id
            |
            +--> dedupe on referenceId  Phase 1   @@unique([userId, referenceId])
            |
            +--> resolve target Account Phase 4   accountLast4 -> else default
            |
            v
      db.$transaction:
        create Transaction { source: SMS, needsReview? }
        update Account.balance                <-- MUST NOT BE SKIPPED
            |
            +--> inngest budget.threshold.crossed (expenses only)
            |
            v
      /review page                                       Phase 7
```

### What paisa genuinely already has

| Capability | Location | Reuse |
|---|---|---|
| Category ids, colours, icons | `data/categories.js` | Phase 3 keys its keyword map off these ids |
| Transaction create + balance update + budget alert | `actions/transaction.js` → `createTransaction` | Phase 4 mirrors this logic. It cannot call it — that is a `"use server"` action needing a Clerk session |
| Gemini client wiring | `actions/transaction.js` | Phase 3 optional AI tier reuses the key and SDK |
| Prisma singleton with pg adapter | `lib/prisma.js` | direct import |
| Inngest client | `lib/inngest/client.js` | budget alert fan-out |

---

## 3. Cost — everything free

| Component | Service | Free tier | Cost |
|---|---|---|---|
| Hosting | Vercel Hobby | non-commercial | ₹0 |
| Database | Supabase Postgres (already wired) | ample for personal use | ₹0 |
| Auth | Clerk (already wired) | 10k MAU | ₹0 |
| AI fallback | Gemini free tier (already wired) | rate-limited | ₹0 |
| Phone → server (Phase 6) | [MacroDroid](https://play.google.com/store/apps/details?id=com.arlosoft.macrodroid) free | 5 macros; we need 1 | ₹0 |
| App shell (Phase 8) | [Capacitor](https://capacitorjs.com) (MIT) | open source | ₹0 |
| Build tooling | Android Studio | free | ₹0 |
| Distribution | **sideload the APK** | no Play Store account | ₹0 (saves the $25 fee) |

**On distribution:** Google Play's rule that SMS-reading apps must be the default
SMS handler is a *Play Store policy*, not an Android OS restriction.
`RECEIVE_SMS` is an ordinary runtime permission. A sideloaded APK declares it and
the user grants it via the normal dialog. We are not publishing, so the policy
does not apply.

---

## 4. Phases

Ordered so the **cheapest step validates the riskiest assumption first**.
Phase 6 tests the parser against real bank messages with zero Android code. If
the regex is wrong we learn it in an hour, not after a weekend of Gradle.

---

### Phase 0 — Collect real SMS samples (30 min, user task, do first)

Everything downstream depends on the exact message formats **your** banks send.

1. On the phone, open Messages and filter to bank senders.
2. Copy **15–20 real messages**: debits, credits, UPI, card swipes, ATM, salary
   credit, and several **non-transactional** ones (OTP, promo, balance alert).
   The negative cases matter as much as the positive ones.
3. Save to `docs/sms-samples.md`, which is gitignored, one block per message
   with a `sender:` line. Paste them exactly as the bank wrote them.

**Privacy: the samples never have to leave the machine.**

Indian bank SMS already arrives with the account number truncated by the bank,
so there is no full account number in them. What is personal is the balances,
amounts, merchants and reference numbers. `scripts/check-my-sms.mjs` runs the
parser locally and has two modes:

```bash
node --no-warnings scripts/check-my-sms.mjs          # full detail, local only
node --no-warnings scripts/check-my-sms.mjs --share  # redacted, safe to send
```

`--share` replaces every digit with `#` and every name with `NAME`, keeping only
the structural wording, which is all that is needed to widen a regex:

```
Sent Rs.###.## From HDFC Bank A/C x#### To NAME On ##/##/## Ref ############
```

A block is only read as a message if it has a `sender:` line, so the headings and
instructions in the template file are skipped.

Note the **sender IDs**. Indian DLT sender IDs look like `VM-HDFCBK`, `AD-SBIUPI`,
`JD-ICICIB`, `VK-AXISBK`: a 2-char operator prefix, a dash, then a 6-char entity
code. We filter on the part after the dash.

---

### Phase 1 — Database schema (30 min)

⚠️ **Use `prisma db push`, NOT `prisma migrate dev`.**
`prisma/migrations/` contains one migration creating `users`, `accounts`,
`transactions`, `budgets`. The live schema also has `groups`, `group_members`,
`group_expenses`, `expense_shares`, `financial_reports`, applied with `db push`.
`migrate dev` sees that as drift and offers to reset the database. That would
destroy live data.

Preview the SQL first, read it, then apply:

```bash
# Prisma 7 removed --from-url. prisma.config.ts already points at DIRECT_URL.
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script
```

⚠️ **`prisma db push` refuses this change.** It sees two new unique constraints
and demands `--accept-data-loss`. That warning is a false alarm here: both
columns are being created in the same statement, so every existing row gets
`NULL`, and Postgres treats `NULL`s as distinct in a unique index. No duplicate
is possible.

Rather than pass a flag named for data loss at a live database, apply the
previewed DDL directly in one transaction. **This was done on 2026-09-10**
against 17 transactions and 4 users, both counts unchanged afterwards, and
`migrate diff` now reports an empty migration.

Re-run `npx prisma generate` afterwards so the client knows the new fields.

**1a. New enum:**

```prisma
enum TransactionSource {
  MANUAL
  SMS
  RECEIPT
}
```

**1b. Add to `model Transaction`:**

```prisma
  source          TransactionSource @default(MANUAL)
  referenceId     String?           // UPI RRN / bank ref — the dedupe key
  rawMessage      String?  @db.Text // original SMS, for debugging parser misses
  merchantName    String?           // extracted merchant, pre-categorisation
  parseConfidence Float?            // parser confidence, null for manual entries
  needsReview     Boolean  @default(false)

  @@unique([userId, referenceId])
  @@index([userId, needsReview])
```

The UPI reference number (RRN) is a 12-digit value present in almost every Indian
transaction SMS. It is the best dedupe key. It survives the same transaction
arriving twice, once from the bank and once from the card network.

> Postgres treats `NULL` as distinct in unique constraints, so manual rows with a
> `NULL` referenceId will not collide. That is what we want.

**1c. Add to `model User`** — a per-device ingest secret. Clerk session cookies do
not exist inside MacroDroid or a background Android service:

```prisma
  ingestTokenHash  String?   @unique
  ingestTokenSetAt DateTime?
  ingestLastSeenAt DateTime?   // powers "bridge is alive" in the UI
```

Store only the **SHA-256 hash**, never the raw token. Same discipline as a
password.

**1d. Gitignore the samples file** before Phase 0 data lands in the repo:

```
docs/sms-samples.md
```

---

### Phase 2 — The SMS parser (half a day, core work)

New files: `lib/sms/banks.js`, `lib/sms/parser.js`

**2a. Output shape** (JSDoc typedef, this is a JS codebase):

```js
/**
 * @typedef {Object} ParsedSMS
 * @property {number}  amount
 * @property {"EXPENSE"|"INCOME"} type    already mapped to paisa's enum
 * @property {string|null} merchant
 * @property {string|null} referenceId
 * @property {string|null} accountLast4
 * @property {Date}    occurredAt
 * @property {number}  confidence         0..1, parser confidence
 * @property {string|null} bank
 */
```

It emits `EXPENSE` and `INCOME` directly, not `DEBIT` and `CREDIT`. paisa's
`TransactionType` enum is the target, and mapping at the boundary avoids a second
translation layer downstream.

**2b. Reject non-transactional messages first.** The highest-value part of the
parser. A false positive creates a **fake expense that corrupts the user's
balance**, which is far worse than a miss. Bail out on: `otp`,
`one time password`, `verification code`, `will be debited` (future mandate),
`failed`, `declined`, `reversed`, `balance is`, `avl bal` with no transaction
verb, `request for`, `apply now`, offers and promos.

**2c. Reference formats** — representative, not authoritative. Verify against
your Phase 0 samples, since real formats drift:

```
HDFC   Sent Rs.499.00 From HDFC Bank A/C x1234 To SWIGGY On 02/09/26 Ref 528912345678
HDFC   Rs.1,250.00 debited from a/c **1234 on 02-09-26 to VPA merchant@ybl. Ref No 123456789012
SBI    Dear UPI user A/C X1234 debited by 250.0 on date 02Sep26 trf to SWIGGY Refno 123456789012
ICICI  ICICI Bank Acct XX123 debited for Rs 500.00 on 02-Sep-26; SWIGGY credited. UPI:123456789012
AXIS   INR 350.00 debited A/c no. XX1234 02-09-26 18:30:12 UPI/P2M/123456789012/SWIGGY
CREDIT Rs.45000.00 credited to a/c **1234 on 01-09-26 by SALARY. Ref 987654321098
```

**Formats reported from real messages on 2026-09-10.** Every one of these broke
the parser on first contact, which is the whole argument for Phase 0:

```
IDFC   Your A/C XX9095 is debited by ₹1,000 on 01/01/2026. NAME credited to RRN 1287T26. Available balance: ₹____. IDFC FIRST Bank.
IDFC   Your Bank A/C XXX9095 is credited with INR 1,000 on 01/01/2026. Your new balance amount is ₹____.
IDFC   Transaction successful: INR 100 spent using your IDFC Bank Credit Card ending 1234 on 01 September 2026 at 10:45. Available limit: ₹____.
UTKAR  Your Super Card 1001 debited for INR 250 on 1 Sep for UPI 6248ETX
```

What they broke, and what changed:

| Broke | Fix |
|---|---|
| Sender `VM-IDFCB` and `KJ-UTKSPR` unrecognised, costing the bank confidence bonus | Added codes plus a **prefix fallback**, so `IDFCB`, `IDFCFB` and `IDFCBK` all resolve to IDFC without listing every variant |
| `NAME credited to RRN 1287T26` yielded a merchant of "RRN 1287T26" | Counterparty pattern now accepts a full stop as separator, and every merchant pattern rejects reference labels |
| `Credit Card ending 1234` and `Super Card 1001` produced no account | New card pattern; card alerts carry no `a/c` at all |
| `01 September 2026` fell back to the received date | Month lookup now uses the first three letters, so spelled-out months work |
| `on 1 Sep` with no year fell back | Year is inferred as the most recent occurrence, stepping back a year if that would be in the future |

**2d. Ordered layers**, each returning a confidence:

1. **Bank-specific matchers** keyed off sender ID → confidence `0.95`.
2. **Generic field extractors** that work across banks → confidence `0.70`:
   - amount: `/(?:rs\.?|inr)\s*([\d,]+(?:\.\d{1,2})?)/i`
   - direction: `debited|sent|paid|withdrawn|spent` → EXPENSE;
     `credited|received|deposited|refund` → INCOME
   - reference: `/\b(\d{12})\b/` (UPI RRN) with `ref|refno|upi` nearby
   - account: `/(?:a\/c|acct|account)\s*(?:no\.?)?\s*[x*]+(\d{3,4})/i`
   - merchant: VPA (`/([a-z0-9._-]+)@[a-z]{3,}/i` → part before `@`),
     else `to|at|trf to|towards <NAME>`
3. **No amount found** → return `null`. **Never guess an amount.**

**2e. Tests — done, no new dependency.** `scripts/test-sms-parser.mjs` runs on
plain `node`. Node 22.7 and later detect module syntax in `.js` files, so
`lib/sms/*.js` imports directly without `"type": "module"` in `package.json`,
which would have broken the CommonJS config files at the repo root.

```bash
node --no-warnings scripts/test-sms-parser.mjs
```

`--no-warnings` only silences the module-type-detection notice. It covers the six
reference formats, a balance-quoting debit, a thin low-confidence parse, ten
non-transactional messages that must be rejected, the sender guard, the
confidence model, and category-id integrity. **80 assertions, all passing.**

Once Phase 0 is done, add cases from your real messages so this guards the
formats your banks actually send.

---

### Phase 3 — Categoriser (NEW — half a day)

New file: `lib/sms/categorize.js`

**This phase did not exist in the original plan.** It assumed
`categorizeTransaction()` was already built. In paisa nothing is.

Tiered, cheapest first:

1. **Merchant keyword map** → confidence `0.9`. A new `MERCHANT_KEYWORDS` map
   from substring to category id, using the **exact ids** in `data/categories.js`.
   Indian coverage: swiggy, zomato, blinkit, zepto → `food` or `groceries`;
   ola, uber, rapido, irctc → `transportation`; jio, airtel, bescom →
   `utilities`; netflix, spotify, hotstar → `entertainment`; amazon, flipkart,
   myntra → `shopping`; apollo, pharmeasy, 1mg → `healthcare`.
2. **Income heuristics** → `salary` when the message says salary or payroll,
   else `other-income`.
3. **Gemini fallback**, optional tier 3 → confidence `0.6`. Reuse
   `GEMINI_API_KEY` and `gemini-2.5-flash` already used by `scanReceipt`. Only
   call it when tiers 1 and 2 miss, to stay inside the free tier.
4. **Fallback** → `other-expense` or `other-income`, confidence `0.3`.

Return `{ category, confidence, tier }`. The route sets `needsReview` from the
**lower** of parser and category confidence.

**Constraint:** the returned `category` must be an id that exists in
`data/categories.js`. Validate before returning. An unknown id renders as a broken
chip everywhere in the UI, because `categoryColors` lookups return `undefined`.

---

### Phase 4 — Ingest API (3–4 hours)

New file: `app/api/ingest/sms/route.js`

**4a. ⚠️ Bypass Arcjet — do this first or nothing else can be tested.**
`middleware.js` runs `detectBot({ mode: "LIVE" })` over `/(api|trpc)(.*)`.
MacroDroid and OkHttp are on no allow list, so every ingest POST returns 403
before reaching the route. Edit `middleware.js`:

```js
const protectedMiddleware = createMiddleware(aj, clerk);

export default function middleware(req, event) {
  // Device bridge posts here with a bearer token. It is not a browser and
  // Arcjet bot detection would block it. The route does its own auth.
  if (req.nextUrl.pathname.startsWith("/api/ingest")) {
    return NextResponse.next();
  }
  return protectedMiddleware(req, event);
}
```

Bypassing bot detection means the route is **the only thing** standing between
the internet and the database. Its own auth and rate limit are not optional.

**4b. Auth — bearer token, not Clerk:**

```js
const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });
const hash = createHash("sha256").update(token).digest("hex");
const user = await db.user.findUnique({ where: { ingestTokenHash: hash } });
if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
```

**4c. Request body:**

```jsonc
{ "sender": "VM-HDFCBK", "body": "Rs.499.00 debited ...", "receivedAt": "2026-09-10T18:30:00Z" }
```

**4d. Flow:**

1. Verify token, resolve user, touch `ingestLastSeenAt`.
2. Cheap spam guard: sender must look like a DLT bank id.
3. `parseSMS(body, sender)`. `null` means return **`200 {ignored:true}`**, not an
   error. The phone must not retry a promo SMS forever.
4. Dedupe on `[userId, referenceId]` → `200 {duplicate:true}`.
5. `categorize(merchant, description, type)`.
6. **Resolve the account.** The original plan never addressed this and
   `accountId` is required:
   - match `accountLast4` against a per-user account mapping if one exists,
   - else the user's `isDefault` account,
   - else the most recently created account,
   - else `200 {ignored:true, reason:"no account"}`. Never invent one.
7. **Write inside `db.$transaction`**, creating the row **and** updating
   `Account.balance` by `-amount` for EXPENSE or `+amount` for INCOME. Mirror
   `createTransaction` in `actions/transaction.js`. Omitting the balance update
   is a silent data-corruption bug.
8. `needsReview = min(parseConfidence, categoryConfidence) < 0.7`.
9. Fire `budget.threshold.crossed` via Inngest for expenses, same as the manual
   path.
10. `revalidatePath("/dashboard")` so the new row shows without a hard refresh.

**4e. Rate limit.** A per-user cap of 60 per minute stops a stuck macro from
filling the database. The `tokenBucket` in `lib/arcjet.js` is 10 per hour, far too
tight for SMS. Use a separate limiter or a simple counter.

**4f. Privacy.** Never `console.log` full SMS bodies in production. They contain
account numbers. The `rawMessage` column is deliberate storage; stray lines in
Vercel's log drain are not.

---

### Phase 5 — Token UI (2–3 hours)

New route `app/(main)/settings/page.jsx`, which does not exist yet, plus
`actions/ingest-token.js`.

- A "Connect your phone" section.
- **Generate** → `crypto.randomBytes(32).toString("hex")`, store the SHA-256
  hash, show the raw token **exactly once** with a copy button.
- **QR code** of the token, far easier than typing 64 hex characters on a phone.
  No QR library is installed, so add one or render an SVG by hand.
- **Revoke and regenerate.**
- Show `ingestLastSeenAt` as "last message received" so the user can tell the
  bridge is alive.
- Add a nav entry. The header currently has no settings link.

---

### Phase 6 — Prove it with MacroDroid (1 hour, no Android code) ⭐

**The checkpoint that de-risks the whole feature.**

1. Deploy to Vercel, or expose localhost with `npx localtunnel --port 3000`.
2. Install MacroDroid. The free tier allows 5 macros and we need 1.
3. Macro:
   - **Trigger:** `SMS Received`, sender contains `HDFCBK` and so on.
   - **Action:** `HTTP Request` POST to `https://<app>/api/ingest/sms`
     - `Authorization: Bearer <token from Phase 5>`
     - `Content-Type: application/json`
     - Body: `{"sender":"[sms_sender]","body":"[sms_message]"}`
4. Make a ₹1 UPI payment to yourself and watch the transaction appear.

**Exit criteria before Phase 8:** 15 or more real messages ingested, at least 90%
correctly parsed, **zero** false positives from OTP and promo messages, and
account balances still correct. If the parser fails here, fix Phase 2. Do **not**
build an APK.

---

### Phase 7 — Review queue (NEW — 3 hours)

New route `app/(main)/review/page.jsx`.

**Also absent from the original plan.** Without it, `needsReview` is a column
nobody reads, and low-confidence rows quietly pollute the dashboard.

- List transactions where `needsReview` is true, newest first.
- Show `rawMessage` so the user can see what the parser saw.
- Inline category correction and confirm, clearing `needsReview`.
- Delete, with the balance reversal, for false positives.
- Badge the count in the header.

---

### Phase 8 — Capacitor bridge APK (a weekend)

Only after Phase 6 passes. Build a **headless bridge**: no UI, it listens for SMS
and POSTs. Keep using the paisa PWA in Chrome. Nothing in the web app changes.

**8a. Scaffold in a sibling folder, not inside this Next.js app:**

```bash
npm create @capacitor/app
npx cap add android
```

**8b. `android/app/src/main/AndroidManifest.xml`:**

```xml
<uses-permission android:name="android.permission.RECEIVE_SMS" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
```

**8c. Write a small custom receiver rather than using a community plugin.**

⚠️ **Most Capacitor SMS plugins are the wrong kind.** They use the
**SMS Retriever / User Consent API**, built for OTP verification. It times out
after about 5 minutes and cannot listen in the background:

- [capawesome android-sms-retriever](https://capawesome.io/docs/sdks/capacitor/android-sms-retriever/) — ❌ OTP only
- [Cap-go/capacitor-android-sms-retriever](https://github.com/Cap-go/capacitor-android-sms-retriever/) — ❌ OTP only

Ones using the raw `RECEIVE_SMS` broadcast, usable as reference:

- [@solimanware/capacitor-sms-reader](https://www.npmjs.com/package/@solimanware/capacitor-sms-reader)
- [Julias0/CapacitorSmsInboxReader](https://github.com/Julias0/CapacitorSmsInboxReader)
- [Ayush-Rajniwal/cap-read-sms](https://github.com/Ayush-Rajniwal/cap-read-sms)

A `BroadcastReceiver` on `Telephony.Sms.Intents.SMS_RECEIVED_ACTION` is about 100
lines of Kotlin and causes less trouble than bending a third-party plugin to fit.

**8d. POST via WorkManager, not from the receiver.** The receiver has seconds to
live. Enqueue a `OneTimeWorkRequest` with exponential backoff. That gives free
offline retry when the phone has no signal as the SMS lands.

**8e. Store the token** in `EncryptedSharedPreferences`, entered once by QR scan.

**8f. Build and sideload:**

```bash
cd android && ./gradlew assembleDebug
adb install app/build/outputs/apk/debug/app-debug.apk
```

A debug-signed APK installs fine for personal use.

---

### Phase 9 — Background reliability (budget real time)

**Harder than the parsing.** Android kills background receivers, and Xiaomi,
Oppo, Vivo and Realme skins are especially aggressive.

- **Foreground service** with a persistent notification.
- **Battery optimisation exemption** via `ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`.
- On MIUI, ColorOS and FuntouchOS the user must manually enable **Autostart**.
  Document it in the app.
- Re-register on `BOOT_COMPLETED`.
- **Heartbeat:** the bridge pings `/api/ingest/heartbeat` daily and the settings
  page warns when it has not reported in 3 days. Silent failure is the main risk
  of this entire feature.

---

## 5. Known gotchas

| Risk | Mitigation | Phase |
|---|---|---|
| **Arcjet blocks the bridge** (paisa-specific) | Bypass `/api/ingest/*` in `middleware.js` | 4 |
| **`migrate dev` offers to reset the DB** (paisa-specific) | Use `db push`; preview with `migrate diff` first | 1 |
| **Account balance drifts** (paisa-specific) | Update `Account.balance` in the same `db.$transaction` | 4 |
| **Unknown category id breaks UI chips** (paisa-specific) | Validate against `data/categories.js` before returning | 3 |
| False positive from an OTP or promo SMS | Aggressive rejection list, validated against real messages | 2, 6 |
| Bank changes SMS format silently | `rawMessage` column plus review queue; watch the parse-failure rate | 2, 7 |
| Duplicate transaction from two SMS for one payment | Unique `[userId, referenceId]` on the UPI RRN | 1 |
| Android kills the bridge | Foreground service plus heartbeat | 9 |
| Gemini free-tier rate limits | AI is tier 3. Never call it when keywords hit | 3 |
| Ingest token leaks | Store hashed, revoke in settings, rate limit | 1, 4, 5 |
| SMS samples committed to git | `docs/sms-samples.md` in `.gitignore` | 1 |

---

## 6. Alternatives considered

| Approach | Verdict |
|---|---|
| **PWA only** | ❌ Impossible. Browsers cannot read SMS |
| **WebOTP API** | ❌ OTP-format messages only, returns just the code |
| **NotificationListenerService** | ⚠️ Viable, but Android 13+ puts it behind "Restricted Settings" for sideloaded apps. For a sideloaded app plain SMS is *easier*, the opposite of the Play Store situation |
| **Gmail bank alerts** | ✅ Good future addition. Server-side only, no phone component, no policy risk. Worth adding as a second source once Phase 2's parser exists, since it reuses the same regex |
| **RBI Account Aggregator** ([Setu](https://setu.co/data/financial-data-apis/account-aggregator/), Finvu) | ❌ The correct way, but requires registering as a regulated **FIU**. Not viable for a personal project |

---

## 7. Reference repos

Useful mainly for their **bank SMS regex sets**, the genuinely valuable part to
borrow. Quality and maintenance not audited:

- [praslnx8/Expense-Tracker](https://github.com/praslnx8/Expense-Tracker) — auto-detect from bank SMS, Indian banks
- [atick-faisal/Expense-Tracker-Android](https://github.com/atick-faisal/Expense-Tracker-Android) — notification-based plus AI
- [nishanthdn96/expense-tracker](https://github.com/nishanthdn96/expense-tracker) — SMS parsing and insights
- [selvamselvam/expensetracker-android-application](https://github.com/selvamselvam/expensetracker-android-application) — user-configurable sender IDs
- [Dave-1/MyFinanceMate](https://github.com/Dave-1/MyFinanceMate) — privacy-first, local only
- Topics: [`sms-parser`](https://github.com/topics/sms-parser), [`sms-parsing`](https://github.com/topics/sms-parsing)

---

## 8. Checklist

**Web app — testable with zero Android work**
- [ ] Phase 0 — collect 15–20 real SMS samples into `docs/sms-samples.md` *(user task, still open)*
- [x] Phase 1 — schema applied 2026-09-10: `source`, `referenceId` plus unique, `rawMessage`, `merchantName`, `parseConfidence`, `needsReview`, `ingestTokenHash`, `ingestTokenSetAt`, `ingestLastSeenAt`
- [x] Phase 2 — `lib/sms/banks.js`, `lib/sms/parser.js`, rejection list, `scripts/test-sms-parser.mjs`
- [x] Phase 3 — `lib/sms/categorize.js`, keyword map validated against `data/categories.js`
- [x] Phase 4 — Arcjet bypass in `middleware.js`, `app/api/ingest/sms/route.js`, `lib/sms/persist.js`, bearer auth, dedupe, account resolution, **balance update**, rate limit
- [x] Phase 5 — `app/(main)/settings/`, `actions/ingest-token.js`, nav links, generate / revoke / last-seen / setup instructions. **QR deferred**: no QR library is installed and adding a dependency was not worth it while the token is pasted into MacroDroid by hand. Revisit for the Phase 8 APK, where scanning is the natural flow.

**Validation gate**
- [ ] Phase 6 — MacroDroid macro, 15 or more real messages, at least 90% parsed, 0 false positives, balances correct

**Then**
- [x] Phase 7 — review queue at `/review`, `actions/review.js`, header badge. Built earlier than planned: the reported card formats carry no merchant name, so they land in the queue by design and it would have been a dead column otherwise.
- [ ] Phase 8 — Capacitor bridge APK, custom receiver, WorkManager POST, sideload
- [ ] Phase 9 — foreground service, battery exemption, boot receiver, heartbeat

**Future**
- [ ] Gmail bank-alert ingestion as a second source, reusing the Phase 2 parser
