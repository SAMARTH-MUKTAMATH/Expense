"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useUser } from "@clerk/nextjs";
import { SparklesIcon } from "@/components/ui/sparkles";
import { WalletIcon } from "@/components/ui/wallet";
import { SquarePenIcon } from "@/components/ui/square-pen";
import { ChartPieIcon } from "@/components/ui/chart-pie";
import { ScanTextIcon } from "@/components/ui/scan-text";
import { ArrowLeftIcon } from "@/components/ui/arrow-left";
import { ArrowRightIcon } from "@/components/ui/arrow-right";
import {
  Users,
  X,
  Lightbulb,
  MapPin,
  Camera,
  Target,
  FileText,
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const FLAG = "bf_onboarding_done_v1";
const AUTO_ADVANCE_MS = 6500;

const SLIDES = [
  {
    accent: "Welcome",
    title: "Hi, welcome to BudgetFLOW",
    body: "Your AI-powered finance app, made for India. We'll walk you through everything in 45 seconds — no tutorials to read, no jargon.",
    tip: "You'll learn how to add accounts, log expenses, set budgets, split bills with friends, and get an AI-generated monthly report.",
    TipIcon: Lightbulb,
    Icon: SparklesIcon,
  },
  {
    accent: "Step 1 of 5",
    title: "Add your accounts",
    body: "Each bank account, wallet, or UPI you use gets its own card. Set one as your default for one-tap transaction logging.",
    tip: "Example: HDFC Savings, Paytm Wallet, Axis Current — each tracked separately so you always know where your money is.",
    TipIcon: MapPin,
    Icon: WalletIcon,
    cta: { href: "/dashboard", label: "Add an account" },
  },
  {
    accent: "Step 2 of 5",
    title: "Log transactions in seconds",
    body: "Tap \"Add Transaction\" for income or expense — or snap a photo of any receipt. Our AI reads the amount, date, and category for you.",
    tip: "The receipt scanner works on physical bills, restaurant slips, even screenshots of UPI payments.",
    TipIcon: Camera,
    Icon: ScanTextIcon,
    cta: { href: "/transaction/create", label: "Try adding one" },
  },
  {
    accent: "Step 3 of 5",
    title: "Set a monthly budget",
    body: "Tell us your spending cap for the month. We'll quietly track every expense and email you when you cross 75% — no nagging, just useful nudges.",
    tip: "Pro tip: Use the 50/30/20 rule — 50% needs, 30% wants, 20% savings. We'll help you stick to it.",
    TipIcon: Target,
    Icon: ChartPieIcon,
    cta: { href: "/dashboard", label: "Set my budget" },
  },
  {
    accent: "Step 4 of 5",
    title: "Split bills with your group",
    body: "Going on a trip? Sharing rent? Create a group, add expenses, and we track who owes whom. One tap sends a polite settle-up reminder.",
    tip: "No login needed for group members — they just receive the email and pay via UPI/cash directly.",
    TipIcon: Users,
    Icon: Users,
    cta: { href: "/groups", label: "Open Splitwise" },
  },
  {
    accent: "Step 5 of 5",
    title: "Get AI financial advice",
    body: "Click \"Generate now\" once a month and our AI writes you a complete intelligence report — health score, forecasts, savings ideas, a 12-month plan.",
    tip: "The report arrives as a PDF in your inbox. You can also read it on the web with charts and tables.",
    TipIcon: FileText,
    Icon: SparklesIcon,
    cta: { href: "/advisor", label: "See it in action" },
  },
  {
    accent: "You're set",
    title: "Ready to take control?",
    body: "That's the whole tour. Anytime you need a refresher, click the (?) icon in the navbar.",
    tip: "Start by adding your first account. It takes 10 seconds.",
    TipIcon: Rocket,
    Icon: SquarePenIcon,
    cta: { href: "/dashboard", label: "Start using BudgetFLOW" },
  },
];

export function OnboardingTour() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);
  const { isSignedIn, isLoaded } = useUser();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onOpenEvent = () => {
      setIndex(0);
      setOpen(true);
    };
    window.addEventListener("bf:open-onboarding", onOpenEvent);
    return () => window.removeEventListener("bf:open-onboarding", onOpenEvent);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isLoaded || !isSignedIn) return;
    try {
      if (!window.localStorage.getItem(FLAG)) setOpen(true);
    } catch {
      /* private mode etc — just don't show */
    }
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    if (!open || paused) return;
    if (index >= SLIDES.length - 1) return;
    timerRef.current = setTimeout(
      () => setIndex((i) => Math.min(SLIDES.length - 1, i + 1)),
      AUTO_ADVANCE_MS
    );
    return () => clearTimeout(timerRef.current);
  }, [open, index, paused]);

  const close = () => {
    setOpen(false);
    try {
      window.localStorage.setItem(FLAG, "1");
    } catch {
      /* ignore */
    }
  };

  const next = () => setIndex((i) => Math.min(SLIDES.length - 1, i + 1));
  const prev = () => setIndex((i) => Math.max(0, i - 1));

  const slide = SLIDES[index];
  const Icon = slide.Icon;
  const isLast = index === SLIDES.length - 1;
  const isFirst = index === 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
          onClick={close}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-3xl border border-white/10 bg-gradient-to-b from-[#141414] to-[#0a0a0a] shadow-2xl shadow-black/60 overflow-hidden"
          >
            {/* lime halos for depth */}
            <div
              aria-hidden
              className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-[#89E900]/20 blur-3xl"
            />
            <div
              aria-hidden
              className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-[#89E900]/10 blur-3xl"
            />

            {/* Close (×) — replaces text "Skip" for cleaner visual */}
            <button
              type="button"
              onClick={close}
              aria-label="Close tour"
              className="absolute top-3 right-3 h-8 w-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-colors z-20"
            >
              <X size={16} />
            </button>

            {/* Slide content */}
            <div className="relative px-6 pt-10 pb-4 sm:px-8 sm:pt-12 min-h-[420px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 28 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -28 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="text-center"
                >
                  {/* Icon with concentric halo for depth */}
                  <div className="relative mx-auto mb-6 h-24 w-24 flex items-center justify-center">
                    <div
                      aria-hidden
                      className="absolute inset-0 rounded-full bg-[#89E900]/15 blur-2xl"
                    />
                    <div
                      aria-hidden
                      className="absolute inset-2 rounded-full bg-[#89E900]/10"
                    />
                    <div className="relative h-20 w-20 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#b6f047] via-[#89E900] to-[#7AD100] text-[#0a0a0a] shadow-xl shadow-[#89E900]/40">
                      <Icon size={36} />
                    </div>
                  </div>

                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#89E900] mb-3">
                    {slide.accent}
                  </p>
                  <h2 className="text-2xl font-extrabold tracking-tight text-white mb-3 leading-tight">
                    {slide.title}
                  </h2>
                  <p className="text-sm text-gray-300 leading-relaxed mb-4">
                    {slide.body}
                  </p>
                  {slide.tip && (
                    <div className="mx-auto max-w-sm rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 flex items-start gap-3 text-left">
                      {slide.TipIcon && (
                        <div className="h-7 w-7 rounded-md flex items-center justify-center bg-[#89E900]/15 text-[#89E900] shrink-0">
                          <slide.TipIcon size={14} />
                        </div>
                      )}
                      <p className="text-xs text-gray-400 leading-relaxed">
                        {slide.tip}
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Dots */}
            <div className="relative flex items-center justify-center gap-1.5 pb-4">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index
                      ? "w-7 bg-[#89E900]"
                      : "w-1.5 bg-white/15 hover:bg-white/30"
                  }`}
                />
              ))}
            </div>

            {/* Actions — arrow nav + primary CTA */}
            <div className="relative flex items-center justify-between gap-3 px-6 sm:px-8 pb-6">
              <button
                type="button"
                onClick={prev}
                disabled={isFirst}
                aria-label="Previous"
                className="h-10 w-10 rounded-full flex items-center justify-center border border-white/15 bg-transparent text-white hover:bg-white/5 transition-colors disabled:opacity-20 disabled:cursor-not-allowed shrink-0"
              >
                <ArrowLeftIcon size={18} />
              </button>

              <div className="flex-1 flex justify-center">
                {slide.cta && (
                  <Link
                    href={slide.cta.href}
                    onClick={close}
                    className="text-xs font-bold uppercase tracking-wider text-[#89E900] hover:underline whitespace-nowrap"
                  >
                    {isLast ? slide.cta.label : `${slide.cta.label} →`}
                  </Link>
                )}
              </div>

              {isLast ? (
                <button
                  type="button"
                  onClick={close}
                  aria-label="Finish tour"
                  className="h-10 w-10 rounded-full flex items-center justify-center bg-[#89E900] text-[#0a0a0a] shadow-md shadow-[#89E900]/40 hover:scale-105 transition-transform shrink-0"
                >
                  <SparklesIcon size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={next}
                  aria-label="Next"
                  className="h-10 w-10 rounded-full flex items-center justify-center bg-[#89E900] text-[#0a0a0a] shadow-md shadow-[#89E900]/40 hover:scale-105 transition-transform shrink-0"
                >
                  <ArrowRightIcon size={18} />
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
