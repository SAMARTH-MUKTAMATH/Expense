import arcjet, { createMiddleware, detectBot, shield } from "@arcjet/next";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/account(.*)",
  "/transaction(.*)",
  "/advisor(.*)",
  "/groups(.*)",
  "/settings(.*)",
  "/review(.*)",
  "/api/connect-phone(.*)",
]);

const aj = arcjet({
  key: process.env.ARCJET_KEY,
  rules: [
    shield({
      mode: "LIVE",
    }),
    detectBot({
      mode: "LIVE", // will block requests. Use "DRY_RUN" to log only
      allow: [
        "CATEGORY:SEARCH_ENGINE", // Google, Bing, etc
        "GO_HTTP", // For Inngest
      ],
    }),
  ],
});

const clerk = clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  if (!userId && isProtectedRoute(req)) {
    const { redirectToSignIn } = await auth();
    return redirectToSignIn();
  }

  return NextResponse.next();
});

const protectedMiddleware = createMiddleware(aj, clerk);

export default function middleware(req, event) {
  // bridge posts with a bearer token; Arcjet blocks non-browsers
  if (req.nextUrl.pathname.startsWith("/api/ingest")) {
    return NextResponse.next();
  }
  return protectedMiddleware(req, event);
}

export const config = {
  // Clerk + Arcjet exceed Vercel's 1MB Edge limit
  runtime: "nodejs",
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|apk|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};