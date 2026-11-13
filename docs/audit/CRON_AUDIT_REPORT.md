# Cron audit report

Nobody had access to Vercel or Inngest. Nothing below comes from execution
history or logs. The evidence is the code, a local reproduction, and one
anonymous `GET /api/inngest` against production. That request is the SDK's
introspection endpoint and does not trigger anything.

## Where schedules live

`vercel.json` has **no `crons`**. Every schedule is an Inngest function, served by
`app/api/inngest/route.js` and defined in `lib/inngest/function.js`. The schedules
only fire if Inngest Cloud has synced the app.

| Function id | Purpose | Trigger | Before | After |
|---|---|---|---|---|
| `trigger-recurring-transactions` | Fan out due recurring transactions | cron `0 0 * * *` (UTC, so 05:30 IST) | **Never registered** (top-level `cron:` ignored by v4) | `triggers: [{ cron }]` |
| `process-recurring-transaction` | Create one recurring copy, move the balance | event `transaction.recurring.process` | **Never registered** (top-level `event:`) | `triggers: [{ event }]` |
| `generate-monthly-reports` | Monthly e-mail report | cron `TZ=Asia/Kolkata 0 0 28 * *` | Correct syntax | Month bounds now IST |
| `trigger-financial-advisor` | Fan out advisor runs | cron `TZ=Asia/Kolkata 0 1 1 * *` | Correct syntax | unchanged |
| `run-financial-advisor` | Generate an advisor report | event `advisor.generate.request` | Correct syntax | Month key now IST |
| `notify-budget-threshold` | Budget e-mail at ≥75% | event `budget.threshold.crossed` | Correct syntax | Month bounds now IST |

## Stage-by-stage

| Stage | Finding |
|---|---|
| 1. Schedule registration | Two functions had empty triggers (fixed). The whole app likely **cannot sync**; see stage 4. |
| 2. Scheduled trigger | Unknown. This needs the Inngest dashboard. |
| 3. Endpoint invocation | `/api/inngest` responds, with **HTTP 500** to GET. |
| 4. Authentication | **Confirmed via the Vercel API (2026-11-13).** Project `budgetfloww` (`prj_Bv47n9U3zhnCf3v8ZPJigjeFzINH`) has **no `INNGEST_SIGNING_KEY` and no `INNGEST_EVENT_KEY`** in any environment. It has no Inngest integration installed, and it does have a leftover `INNGEST_DEV` set in production and preview. The production 500 is the SDK's "no signing key" response. |
| 5–7. Execution / DB / persistence | Not observable without logs. The code is idempotent where it matters: the recurring job advances `nextRecurringDate` in the same DB transaction as the insert, and budget e-mails are de-duplicated by `lastAlertSent`. |
| 8. Frontend | Monthly reports appear in Advisor history (`financial_reports`). |

## Other observations (not changed)

- `generate-monthly-reports` runs on the **28th** but reports the **previous**
  month, so the e-mail arrives about four weeks late. Decide whether it should
  run on the 1st.
- `/api/inngest` is covered by Arcjet `detectBot` (LIVE) in `middleware.js`,
  which allows `GO_HTTP` for Inngest. If syncing still fails after the keys are
  set, check the Arcjet dashboard for blocked `/api/inngest` requests.

## Final status

Code fix done. **Execution is not verified**: it is blocked on the Vercel
environment variables. Do not trigger jobs manually until the keys are set:
`generate-monthly-reports` and the advisor send real e-mails.
