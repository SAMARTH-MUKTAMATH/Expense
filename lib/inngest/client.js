import { Inngest } from "inngest";

const isVercel = !!process.env.VERCEL;
const isDevLocal = process.env.NODE_ENV !== "production" && !isVercel;

if (isVercel) {
    console.log(
        `[inngest] runtime check — VERCEL=${process.env.VERCEL}, NODE_ENV=${process.env.NODE_ENV}, ` +
        `INNGEST_EVENT_KEY=${process.env.INNGEST_EVENT_KEY ? "set" : "MISSING"}, ` +
        `INNGEST_SIGNING_KEY=${process.env.INNGEST_SIGNING_KEY ? "set" : "MISSING"}`
    );
}

export const inngest = new Inngest({
    id: "finance-platform",
    name: "Finance Platform",
    isDev: isDevLocal,
    ...(isDevLocal && { baseUrl: "http://127.0.0.1:8288" }),
    retryFunction: async (attempt) => ({
        delay: Math.pow(2, attempt) * 1000,
        maxAttempts: 2,
    }),
});