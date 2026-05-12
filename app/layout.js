import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Toaster } from "sonner";

import { ClerkProvider } from "@clerk/nextjs";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Paisa — AI-powered finance, made for India",
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
        <body className={`${inter.className} antialiased`}>
          <Header />
          <main className="min-h-screen pt-16">{children}</main>
          <Toaster richColors position="top-right" />
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  );
}
