# Bug fix tracker

| ID | Description | Priority | Root cause | Status | Files changed | Test result | Remaining work |
|---|---|---|---|---|---|---|---|
| BUG-001 | Budget includes the previous month | P1 | Month boundaries computed in the server's timezone (UTC); the last day of each month was excluded | Fixed | `lib/ist.js`, `actions/budget.js`, `actions/transaction.js`, `lib/sms/persist.js`, `lib/inngest/function.js`, `lib/advisor/buildPayload.js` | Boundary assertions pass under TZ=UTC, IST and LA | Check the budget card after deploying |
| BUG-002 | SMS transactions out of order | P1 | SMS times read as UTC (+5h30m); date-only SMS tie at one timestamp; no tie-break | Fixed (new rows and ordering); 50 old rows still shifted | `lib/sms/parser.js`, `actions/{dashboard,account,transaction,review}.js` | 6 new date assertions; the old parser fails 5 of them | Run `scripts/fix-sms-shifted-dates.mjs --apply` once approved |
| BUG-003 | No month-wise view | P2 | Feature absent | Done | `app/(main)/account/_components/transaction-table.jsx` | Lint and build pass | Check on a phone |
| BUG-004 | Mobile layout issues | P2 | None found by static scan | Partially done | Same table (2-column summary on mobile) | Not viewport-tested (screens need sign-in) | Need screenshots of the specific screens |
| BUG-005 | ~2 min startup of the installed app | P2 | Not the server (TTFB under 3.5 s cold) | Not reproduced | — | Server timings recorded | Trace from the phone |
| BUG-006 | Green dash instead of the logo | P2 | Placeholder Android foreground vector | Fixed in source | `android/.../drawable/ic_launcher_foreground.xml` | `assembleDebug` OK; mask previews match `/icon` | Rebuild the release APK and reinstall |
| BUG-007 | Cron jobs not running | P1 | (A) v4 trigger keys ignored; (B) production `/api/inngest` returns 500, which looks like a missing signing key | (A) fixed; (B) blocked | `lib/inngest/function.js` | Reproduced A and B locally | Set the Inngest keys in Vercel, then resync |
