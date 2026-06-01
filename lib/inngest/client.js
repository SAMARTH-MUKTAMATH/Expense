import { Inngest } from "inngest";

// Treat the runtime as dev ONLY when:
//   1. NODE_ENV is not "production", AND
//   2. we're not running on Vercel (VERCEL=1 is auto-set there).
// This double-guard prevents the deployed app from ever falling back to the
// local 127.0.0.1:8288 Inngest Dev Server — the cause of ECONNREFUSED in prod.
const isDev =
    process.env.NODE_ENV !== "production" && !process.env.VERCEL;

if (process.env.VERCEL && !process.env.INNGEST_EVENT_KEY) {
    console.warn(
        "[inngest] INNGEST_EVENT_KEY is not set in Vercel env. inngest.send() will fail."
    );
}

export const inngest = new Inngest({
    id: "finance-platform",
    name: "Finance Platform",
    ...(isDev && { baseUrl: "http://127.0.0.1:8288", isDev: true }),
    retryFunction: async (attempt) => ({
        delay: Math.pow(2, attempt) * 1000,
        maxAttempts: 2,
    }),
});