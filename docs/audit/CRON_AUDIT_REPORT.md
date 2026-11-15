# Cron audit report

## Outcome (2026-11-14)

**Inngest was removed and replaced with Vercel Cron.** Inngest had never
worked in production: the project never had `INNGEST_SIGNING_KEY` or
`INNGEST_EVENT_KEY`, as confirmed via the Vercel API on 2026-11-13. On top of
that, two of its functions used trigger syntax that Inngest v4 ignores.

## Jobs now

| Job | Schedule (`vercel.json`, UTC) | IST | Endpoint | Was |
|---|---|---|---|---|
| Recurring transactions | `0 0 * * *` | daily 05:30 | `/api/cron/recurring` | Inngest cron + fan-out event, never registered |
| Monthly e-mail report | `0 0 28 * *` | 28th 05:30 | `/api/cron/monthly-report` | Inngest, 28th 00:00 IST |
| Monthly advisor (e-mail + PDF) | `0 0 1 * *` | 1st 05:30 | `/api/cron/advisor` | Inngest, 1st 01:00 IST |
| On-demand advisor report | — | — | `after()` in `requestAdvisorReport` | Inngest event |
| Budget alert e-mail | — | — | `after()` when spending crosses 75% | Inngest event with a 1-minute delay |

The job code is in `lib/jobs.js`; the endpoint is `app/api/cron/[job]/route.js`.

## Safety

- **Auth:** a request is accepted only when it carries
  `Authorization: Bearer $CRON_SECRET`, compared in constant time. If
  `CRON_SECRET` is unset, every call is refused. Refusals are logged as
  `[cron] rejected ...`.
- **Middleware:** `/api/cron` bypasses Clerk and Arcjet, as `/api/ingest`
  already does, so the bot filter can't block Vercel's requests.
- **Idempotency:**
  - Recurring: each row is claimed with a conditional update before the copy
    is inserted, in one DB transaction, so an overlapping run posts nothing.
  - Advisor: a user who already has a `cron` report for the month is skipped.
  - Budget alert: de-duplicated by `lastAlertSent`, and it re-checks the
    total before sending.
  - Monthly report: **no guard.** A duplicate run would send a second e-mail.
- **Failures:** one user's failure doesn't stop the others. It's logged with
  the user id, and the endpoint returns 500, which shows as failed in Vercel →
  Cron Jobs.
- **Timeout:** `maxDuration = 300`. Advisor reports run 3 at a time.

## Verified locally (2026-11-14, `next dev`)

| Request | Result |
|---|---|
| No header | 401, refusal logged |
| Wrong secret | 401 |
| Unknown job | 404 |
| Valid secret, `recurring` | 200 `{ processed: 0, failed: [] }`; the database has 0 recurring transactions |

`monthly-report` and `advisor` were **not** run: they send real e-mails.

## Not yet verified

- Registration in Vercel, which appears after deploy under Settings → Cron
  Jobs.
- The first real scheduled run.
- Hobby plan: crons fire once a day at most, and only within the scheduled
  hour, not at the exact minute.

## Trade-offs versus Inngest

- No automatic retries. A failed run waits for the next schedule.
- The budget alert no longer waits a minute and re-checks; it sends right
  after the crossing transaction is saved.
- The `inngest` package is still in `package.json`. Removing it means
  regenerating both lockfiles, so do it together with the npm/pnpm clean-up.
