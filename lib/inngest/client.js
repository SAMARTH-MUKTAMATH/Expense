import { Inngest } from "inngest";

// In dev, point at the local Inngest Dev Server. We use 127.0.0.1 (not
// `localhost`) because on Windows Node resolves `localhost` to ::1 first, but
// the dev server only listens on the IPv4 loopback — so the env-default URL
// would ECONNREFUSED. In prod the SDK ignores baseUrl when an event key is set.
const isDev = process.env.NODE_ENV !== "production";

export const inngest = new Inngest({
    id: "finance-platform",
    name: "Finance Platform",
    ...(isDev && { baseUrl: "http://127.0.0.1:8288", isDev: true }),
    retryFunction: async (attempt) => ({
        delay: Math.pow(2, attempt) * 1000,
        maxAttempts: 2,
    }),
});