import { Inter, Space_Grotesk, Outfit } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Toaster } from "sonner";
import IntroScreen from "@/components/intro-screen";
import { SmoothScroll } from "@/components/smooth-scroll";
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
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="icon" href="/logo-sm.png" sizes="any" />
        </head>
        <body
          className={`${inter.variable} ${spaceGrotesk.variable} ${outfit.variable} ${inter.className} antialiased`}
        >
          <SmoothScroll />
          <IntroScreen />
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
