import localFont from "next/font/local";
import "./globals.css";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Toaster } from "sonner";
import IntroScreen from "@/components/intro-screen";
import { SmoothScroll } from "@/components/smooth-scroll";
import { OnboardingTour } from "@/components/onboarding-tour";
import { InstallPwaHint } from "@/components/install-pwa-hint";
import { RegisterSW } from "@/components/register-sw";
import { Suspense } from "react";

import { ClerkProvider } from "@clerk/nextjs";

const inter = localFont({
  src: "./fonts/inter.woff2",
  weight: "100 900",
  variable: "--font-inter",
});
const spaceGrotesk = localFont({
  src: "./fonts/space-grotesk.woff2",
  weight: "300 700",
  variable: "--font-display",
});
const outfit = localFont({
  src: "./fonts/outfit.woff2",
  weight: "100 900",
  variable: "--font-intro",
});

export const metadata = {
  title: "BudgetFLOW — AI-powered finance, made for India",
  description:
    "Track every rupee, scan receipts with AI, set monthly budgets, and get personalised financial insights — all in one beautiful dashboard.",
  applicationName: "BudgetFLOW",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BudgetFLOW",
  },
};

export const viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      {/* Next 16 auto-emits <link rel="icon">, <link rel="apple-touch-icon">,
          and <link rel="manifest"> from the app/ file conventions — no manual
          tags needed here. */}
      <html lang="en">
        <body
          className={`${inter.variable} ${spaceGrotesk.variable} ${outfit.variable} ${inter.className} antialiased`}
        >
          <SmoothScroll />
          <RegisterSW />
          <IntroScreen />
          <OnboardingTour />
          <InstallPwaHint />
          <Suspense fallback={null}>
            <Header />
          </Suspense>
          <main className="min-h-screen pt-16">{children}</main>
          <Toaster richColors position="top-right" />
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  );
}
