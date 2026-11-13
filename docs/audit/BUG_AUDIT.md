# Bug audit — 2026-11-13

Evidence was gathered from the code, local reproductions, read-only queries
against the production database, and anonymous GET requests to
`https://budgetfloww.vercel.app`. Nobody signed in to the Vercel dashboard,
the Inngest dashboard or a phone. Findings that need any of those are marked
**needs external verification**.

## Shared root cause: dates were calculated in the server's timezone

Every month and day boundary on the server used `new Date(y, m, d)` /
`setHours(0)`, which run in the **server's** timezone. Vercel functions run in
UTC; users and bank SMS are in IST (UTC+5:30).

Evidence: in production, **50 of 149 SMS rows** are stored exactly
**+5h30m** ahead of the time printed in their own message. For example, a
payment at 21:30 on 11 Sep is stored as 03:00 on **12 Sep**. You can
reproduce this with `scripts/fix-sms-shifted-dates.mjs`, which is a dry run by
default.

> Measurement trap: `transactions.date` is `timestamp without time zone`.
> Prisma writes UTC there, but a raw `pg` client reads those values in the
> machine's local timezone. Read them with `TZ=UTC` or every value appears
> 5h30m off. A first pass of this audit fell into exactly this trap.

---

## BUG-001 — Budget alert mixes in the previous month

| | |
|---|---|
| Module | Budget card, budget alert email, alert trigger |
| Files | `actions/budget.js`, `actions/transaction.js` (`checkBudgetCrossing`), `lib/sms/persist.js` (`fireBudgetAlertIfCrossed`), `lib/inngest/function.js` (`notifyBudgetThreshold`) |
| Tables | `transactions`, `budgets` |
| Behaviour | `startOfMonth = new Date(y, m, 1)` and `endOfMonth = new Date(y, m+1, 0)`, compared with `lte` |
| Confirmed causes | 1. On a UTC server, between 00:00 and 05:30 IST on the 1st, "this month" is still the **previous** month, so the card shows last month's whole spend. 2. An SMS sent after 18:30 IST on the last day of a month is stored in the next month (+5h30m shift) and counted there. 3. `lte last-day 00:00` dropped the **whole last day** of every month from the budget. 4. "Already alerted this month" compared UTC months. |
| Fix | One IST helper (`lib/ist.js`). All four call sites use `istMonthRange()` with a half-open `[start, end)` range. Alert de-duplication uses `istMonthKey()`. |
| Risk | Low. The query shape is unchanged; only the boundaries move. |
| Note | No existing row crosses a month boundary because of the shift, so cause 1 is the most likely explanation for what was observed. All four causes are fixed. |

## BUG-002 — Message-detected transactions out of order

| | |
|---|---|
| Module | SMS ingestion → dashboard "Recent transactions", account table, review queue |
| Files | `lib/sms/parser.js` (`extractDate`), `actions/dashboard.js`, `actions/account.js`, `actions/transaction.js`, `actions/review.js` |
| Behaviour | Sorted by `date` only. |
| Confirmed causes | 1. Times in SMS bodies were interpreted as UTC, so 50 rows sit 5h30m in the future and some land on the next day, above newer rows. 2. Most of this bank's SMS carry a **date with no time**. Those were stored at 00:00 UTC, so every message from one day ties at 05:30 IST, and Postgres returns ties in no defined order. A payment made at 18:46 therefore sorts below a 10:00 manual entry. |
| Rule adopted | **Recent = latest financial activity: `date desc`, then `createdAt desc`.** `date` is when the money moved; `createdAt` is when the row was added and breaks ties. |
| Fix | The parser builds SMS times as IST wall-clock time. A date-only SMS dated *today* keeps the real receive instant; one dated an earlier day gets 00:00 IST. All four list queries add the `createdAt` tie-break, which also repairs ordering within a day for existing rows. The client sorts are stable, so they keep that order. |
| Data | The 50 shifted rows stay as they are until someone runs `scripts/fix-sms-shifted-dates.mjs --apply` (see TODO_PENDING). |

## BUG-003 — No month-wise view

| | |
|---|---|
| Finding | No month filter existed anywhere. The dashboard only offered relative ranges (7d, 30d, "this month"). |
| Fix | Added a month selector (All months / each month that has data) with older and newer arrows to the existing account transaction table. When a month is selected, it shows Spent, Income and Count, computed from **exactly the rows listed**, so the totals always match the list. It uses the same `istMonthKey` boundaries as the budget. |
| Not added | No new page and no new API. Totals per category already appear in the dashboard pie for the current month. |

## BUG-004 — Mobile layout

| | |
|---|---|
| Finding | A static scan found no unclipped fixed-width element. Wide decorative glows sit inside `overflow-hidden`, and `body` has `overflow-x: clip`. The transaction table scrolls inside its own container (`min-w-[760px]` in `overflow-x-auto`), which is intentional. The previous commit `b5eb8a4` already contained mobile layout fixes. |
| Fix | The new month summary uses 2 columns below `sm` so amounts fit at 320px. |
| Limit | **Not viewport-tested.** Every app screen sits behind Clerk sign-in and no browser session was available. Screenshots of the specific broken screens are needed to go further. |

## BUG-005 — ~2 minute startup of the installed app

| | |
|---|---|
| What "installed" means | The Android app is a **TWA** (`android/`, `public/budgetflow.apk`) that opens `/dashboard` in Chrome, not just a PWA. |
| Measured (server, anonymous) | `/`: cold 3.3 s TTFB, warm 0.43 s. `/sign-in` 0.4 s. `/dashboard` 307 to sign-in in 0.22 s. Manifest 0.14 s, `/icon` 0.19 s, `/sw.js` 0.14–0.40 s, `assetlinks.json` 0.46 s. The database is in ap-northeast-1, the same region as the `hnd1` functions. |
| Conclusion | The server accounts for seconds, not minutes. The delay is on the device or in the auth flow: TWA/Chrome start-up, the Clerk handshake (the local keys are a `pk_test` dev instance; production is unverified), or the network. |
| Service worker | `public/sw.js` is a deliberate no-op (no caching), so it neither helps nor blocks. |
| Status | **Not reproduced, not fixed.** This needs a trace from the phone (see TODO_PENDING). |

## BUG-006 — Wrong launcher icon ("green dash")

| | |
|---|---|
| Confirmed cause | `android/app/src/main/res/drawable/ic_launcher_foreground.xml` was a placeholder: a lime ring plus a lime **rectangle**, which is the "dash". The web `/icon`, `/apple-icon` and the in-app header all use the real mark: the hand-coins glyph in a lime rounded square. |
| Fix | Redrew the adaptive-icon foreground from the same paths as `app/icon.js`, inside the 66dp safe zone. Previews under round and squircle masks match the web icon. `./gradlew assembleDebug` succeeds. |
| Remaining | Phones only show the new icon after the APK is rebuilt and reinstalled. |

## BUG-007 — Scheduled jobs not running

| | |
|---|---|
| Architecture | There are **no Vercel crons** (`vercel.json` contains only `regions`). All schedules are Inngest functions served at `/api/inngest`. |
| Cause A (confirmed, code) | Inngest **v4 ignores top-level `cron:` / `event:` keys**. `trigger-recurring-transactions` and `process-recurring-transaction` used them, so both registered with **zero triggers** and never ran. Reproduced: `getConfig()` returns `triggers: []`. |
| Cause B (strong evidence, needs external verification) | `GET https://budgetfloww.vercel.app/api/inngest` returns `500 {"code":"internal_server_error"}`. The same handler returns that exact body when `INNGEST_SIGNING_KEY` is missing in cloud mode, and 200 when the key is present. Without the key, Inngest Cloud cannot sync the app, so **no** function runs: not the monthly report, not the advisor, not the recurring jobs, not the budget e-mails. |
| Fix | A: moved both functions to `triggers: [...]`. B: needs the keys set in Vercel (see TODO_PENDING). |
