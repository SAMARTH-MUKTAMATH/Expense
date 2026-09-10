"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, LayoutGroup } from "motion/react";
import { HandCoins } from "lucide-react";

const SEEN_FLAG = "bf_intro_seen_v1";

export default function IntroScreen() {
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showWordmark, setShowWordmark] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;

    try {
      if (window.localStorage.getItem(SEEN_FLAG)) return;
      window.localStorage.setItem(SEEN_FLAG, "1");
    } catch {}

    setShow(true);

    const tWord = setTimeout(() => setShowWordmark(true), 1500);
    const tExit = setTimeout(() => setShow(false), 4200);
    return () => {
      clearTimeout(tWord);
      clearTimeout(tExit);
    };
  }, []);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="intro"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: "-100%" }}
          transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
          className="fixed inset-0 z-[999] flex items-center justify-center overflow-hidden bg-ink"
          style={{ fontFamily: "var(--font-intro), system-ui, sans-serif" }}
        >
          <BackgroundGlow />

          <LayoutGroup>
            <motion.div
              layout
              transition={{
                layout: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
              }}
              className="relative flex items-center gap-3 sm:gap-5 md:gap-7 will-change-transform"
            >
              {/* Hand-coins icon. We start small + above the viewport, then
                  drop into place at scale 1.6, then ease back to 1.0 as the
                  wordmark comes in. Max scale 1.6 (was 3.6) keeps the SVG
                  visually crisp at all phases without any blur stutter. */}
              <motion.div
                layout
                className="text-white relative will-change-transform"
                initial={{ scale: 0.4, y: -200, opacity: 0 }}
                animate={{
                  scale: [0.4, 1.6, 1.6, 1.0],
                  y: [-200, 0, 0, 0],
                  opacity: [0, 1, 1, 1],
                }}
                transition={{
                  duration: 1.6,
                  times: [0, 0.35, 0.7, 1],
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <HandCoins size={96} strokeWidth={1.7} />
              </motion.div>

              {/* Wordmark — pure transform + opacity, no blur filter. */}
              <AnimatePresence>
                {showWordmark && (
                  <motion.div
                    layout
                    key="wordmark"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{
                      duration: 0.55,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <Wordmark />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </LayoutGroup>

          <Tagline />
          <BottomLoader />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Wordmark() {
  return (
    <div className="flex items-baseline gap-[0.04em] whitespace-nowrap">
      <span
        className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight text-white"
        style={{ fontWeight: 700 }}
      >
        Budget
      </span>
      <span
        className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight text-brand"
        style={{ fontWeight: 400 }}
      >
        FLOW
      </span>
    </div>
  );
}

function Tagline() {
  return (
    <motion.p
      className="absolute top-[calc(50%+4.5rem)] sm:top-[calc(50%+5rem)] text-xs sm:text-sm uppercase tracking-[0.4em] text-gray-400 whitespace-nowrap"
      style={{ fontFamily: "var(--font-intro), system-ui, sans-serif" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 2.2, duration: 0.5, ease: "easeOut" }}
    >
      Money · Made · Smart
    </motion.p>
  );
}

function BackgroundGlow() {
  return (
    <motion.div
      aria-hidden
      className="absolute left-1/2 top-1/2 h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/15 blur-2xl"
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 0.5 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
    />
  );
}

function BottomLoader() {
  return (
    <motion.div
      className="absolute bottom-12 left-1/2 -translate-x-1/2 h-[2px] w-32 overflow-hidden rounded-full bg-white/10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.3 }}
    >
      <motion.div
        className="h-full bg-gradient-to-r from-transparent via-brand to-transparent"
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{
          duration: 1.2,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      />
    </motion.div>
  );
}
