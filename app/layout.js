import { Inter, Space_Grotesk, Outfit } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Toaster } from "sonner";
import IntroScreen from "@/components/intro-screen";
import { SmoothScroll } from "@/components/smooth-scroll";
import { OnboardingTour } from "@/components/onboarding-tour";
import { InstallPwaHint } from "@/components/install-pwa-hint";
import { Suspense } from "react";

import { ClerkProvider } from "@clerk/nextjs";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-intro",
});

export const metadata = {
  title: "BudgetFLOW — AI-powered finance, made for India",
  description:
    "Track every rupee, scan receipts with AI, set monthly budgets, and get personalised financial insights — all in one beautiful dashboard.",
  applicationName: "BudgetFLOW",
  // iOS Safari treats this as a "real" web app — full-screen, no browser
  // chrome, dark translucent status bar to match the app background.
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BudgetFLOW",
  },
};

// In Next 16 the viewport / themeColor fields must be in their own export.
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
