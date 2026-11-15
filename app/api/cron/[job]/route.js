import { timingSafeEqual } from "crypto";
import { runMonthlyAdvisor, runRecurringTransactions, sendMonthlyReports } from "@/lib/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const JOBS = {
  recurring: runRecurringTransactions,
  "monthly-report": sendMonthlyReports,
  advisor: runMonthlyAdvisor,
};

// Vercel Cron sends "Bearer <CRON_SECRET>"; no secret means no access
function isVercelCron(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(request.headers.get("authorization") || "");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(request, { params }) {
  const { job } = await params;
  const run = JOBS[job];
  if (!run) return Response.json({ error: "unknown job" }, { status: 404 });

  if (!isVercelCron(request)) {
    console.warn(`[cron] rejected unauthenticated call to ${job}`);
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  try {
    const result = await run();
    console.log(`[cron] ${job} finished in ${Date.now() - startedAt}ms`, result);
    return Response.json({ job, ...result }, { status: result.failed.length ? 500 : 200 });
  } catch (error) {
    console.error(`[cron] ${job} crashed:`, error);
    return Response.json({ job, error: "failed" }, { status: 500 });
  }
}
