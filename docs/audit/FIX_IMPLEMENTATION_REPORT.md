# Fix implementation report — 2026-11-13

Nothing is committed or deployed. All changes are in the working tree on
`master`, alongside four files that were already modified before this work
started (settings, `use-app-shell.js`, `iphone-setup.jsx`, `persist.js`). Those
edits were left as they were, except that `persist.js` also received the
budget-boundary change.

## Changes

| Area | Files | What changed |
|---|---|---|
| IST date helper (new) | `lib/ist.js` | `istWallClock`, `istParts`, `istStartOfDay`, `istMonthRange` (half-open `[start, end)`), `istRangeBounds`, `istMonthKey`. A fixed +05:30 offset; IST has no DST. |
| Budget / alerts | `actions/budget.js`, `actions/transaction.js`, `lib/sms/persist.js`, `lib/inngest/function.js` | Month-to-date sums use `istMonthRange()` with `lt end`. "Already alerted this month" uses `istMonthKey`. Removed `isNewMonth`. |
| Reports / advisor | `lib/inngest/function.js`, `lib/advisor/buildPayload.js` | The month stats for monthly e-mails, advisor history and the advisor `monthKey` use IST months. |
| SMS dates | `lib/sms/parser.js` | Dates and times in the SMS body are treated as IST wall-clock time. A date-only SMS dated today keeps the receive instant. |
| Ordering | `actions/dashboard.js`, `actions/account.js`, `actions/transaction.js`, `actions/review.js` | `orderBy: [{ date: "desc" }, { createdAt: "desc" }]` |
| Dashboard ranges | `transaction-overview.jsx`, `api/dashboard/transactions-pdf/route.js` | Two duplicated `getRangeBounds` copies (one in browser time, one in server time) replaced by the shared `istRangeBounds`, so the PDF always matches the screen. |
| Month view | `account/_components/transaction-table.jsx` | Month selector, older and newer arrows, and a Spent / Income / Count summary of the visible rows. |
| Inngest triggers | `lib/inngest/function.js` | Two functions moved to v4 `triggers: [...]`. |
| Launcher icon | `android/.../drawable/ic_launcher_foreground.xml` | Placeholder replaced with the brand mark. |
| Data repair (not run) | `scripts/fix-sms-shifted-dates.mjs` | Dry run by default. With `--apply`, it moves the 50 shifted rows back by 5h30m in one DB transaction, and only updates rows still holding the expected old value. |
| Tests | `scripts/test-sms-parser.mjs` | +16 assertions: SMS dates at month edges, midnight, leap day, invalid date, date-only SMS, month and day ranges. |

## Results

| Check | Result |
|---|---|
| `node scripts/test-sms-parser.mjs` under TZ=UTC, Asia/Kolkata, America/Los_Angeles | **151/151 pass** in all three |
| Same tests against the old parser (TZ=UTC) | 5 date assertions fail, confirming they catch the bug |
| ESLint on touched files | Clean. A full `eslint .` reports 13 problems, all in untouched files. |
| `next build`, HEAD + every working-tree change, in a clean worktree | **Pass** |
| `next build` in this checkout | **Fails** on `/groups/new`, an untouched static page, with the "workUnitAsyncStorage" invariant. The identical files build in the clean worktree. The likely cause is this `node_modules`, which mixes npm and pnpm installs and holds two Next.js copies (16.1.4 and 16.2.3). That cause is not proven: HEAD was not built in this checkout. |
| `./gradlew assembleDebug` | Pass |
| Icon preview (round and squircle masks) | Matches the web `/icon` |
| Prod read-only data check | 50/149 SMS rows have the +5h30m signature; 0 cross a month boundary |
| Prod `GET /api/inngest` | 500, consistent with a missing signing key |

## Not tested

- Budget card, month view and ordering in a signed-in browser (no session available).
- Viewport testing at 320–768px.
- The installed TWA on a phone, for both start-up time and the icon.
- Cron execution, which is blocked on Vercel and Inngest access.
