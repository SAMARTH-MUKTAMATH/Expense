// Usage: node --env-file=.env scripts/fix-sms-shifted-dates.mjs [--apply]
process.env.TZ = "UTC";

import pg from "pg";
import { parseSMSVerbose } from "../lib/sms/parser.js";

const IST_SHIFT_MS = 330 * 60 * 1000;
const apply = process.argv.includes("--apply");

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const { rows } = await client.query(
  `SELECT id, date, "createdAt", "rawMessage" FROM transactions
   WHERE source = 'SMS' AND "rawMessage" IS NOT NULL`
);

// only the exact UTC-server signature; anything else is left alone
const shifted = rows.filter((row) => {
  const parsed = parseSMSVerbose(row.rawMessage, "", row.createdAt).parsed;
  return parsed && row.date.getTime() - parsed.occurredAt.getTime() === IST_SHIFT_MS;
});

console.log(`${shifted.length} of ${rows.length} SMS rows are 5h30m ahead.`);

if (apply) {
  await client.query("BEGIN");
  let updated = 0;
  for (const row of shifted) {
    const result = await client.query(
      `UPDATE transactions SET date = date - interval '5 hours 30 minutes'
       WHERE id = $1 AND date = $2`,
      [row.id, row.date]
    );
    updated += result.rowCount;
  }
  await client.query("COMMIT");
  console.log(`Updated ${updated}. Undo: same ids, + interval '5 hours 30 minutes'.`);
} else {
  console.log("Dry run. Re-run with --apply to correct them.");
}

await client.end();
