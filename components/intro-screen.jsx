"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, LayoutGroup } from "motion/react";
import { HandCoinsIcon } from "@/components/ui/hand-coins";

export default function IntroScreen() {
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showWordmark, setShowWordmark] = useState(false);
  const iconRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;
    setShow(true);

    // Replay the inner coin-drop animation while the icon is huge so the
    // coins visibly land in the hand at the moment of impact.
    const t1 = setTimeout(() => iconRef.current?.startAnimation?.(), 650);
    const t2 = setTimeout(() => iconRef.current?.startAnimation?.(), 1300);

    // Wait until the icon has FULLY shrunk before letting the wordmark in.
    // Icon shrink completes at ~2.1s in the new timing curve below.
    const tWord = setTimeout(() => setShowWordmark(true), 2300);

    const tExit = setTimeout(() => setShow(false), 5800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
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
          transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          className="fixed inset-0 z-[999] flex items-center justify-center overflow-hidden bg-ink"
          style={{ fontFamily: "var(--font-intro), system-ui, sans-serif" }}
        >
          <BackgroundGlow />
          <Grid />

          <LayoutGroup>
            <motion.div
              layout
              transition={{
                layout: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
              }}
              className="relative flex items-center gap-3 sm:gap-6 md:gap-8 will-change-transform"
            >
              {/* Hand-coins icon: drops in HUGE, plays its coin animation,
                  then smoothly zooms out as the wordmark slides in next to it */}
              <motion.div
                layout
                className="text-white relative"
                initial={{ scale: 0, y: -280, opacity: 0 }}
                animate={{
                  scale: [0, 3.6, 3.6, 1.4, 1.4],
                  y: [-280, 0, 0, 0, 0],
                  opacity: [0, 1, 1, 1, 1],
                }}
                transition={{
                  // Total 3.0s but the shrink happens earlier so the wordmark
                  // has clean space when it slides in. Phases:
                  //   0.0–0.6s  grow (0 → 3.6)
                  //   0.6–1.4s  hold huge (coins drop in here)
                  //   1.4–2.1s  shrink (3.6 → 1.4)
                  //   2.1–3.0s  hold final size
                  duration: 3.0,
                  times: [0, 0.2, 0.47, 0.7, 1],
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <HandCoinsIcon ref={iconRef} size={56} />
              </motion.div>

              {/* Wordmark slides in from the right of the icon */}
              <AnimatePresence>
                {showWordmark && (
                  <motion.div
                    layout
                    key="wordmark"
                    initial={{ opacity: 0, x: -40, filter: "blur(14px)" }}
                    animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{
                      duration: 0.9,
                      ease: [0.16, 1, 0.3, 1],
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
        className="text-4xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tight text-white"
        style={{ fontWeight: 700 }}
      >
        Budget
      </span>
      <span
        className="text-4xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tight text-brand"
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
      className="absolute top-[calc(50%+5.5rem)] sm:top-[calc(50%+6rem)] text-xs sm:text-sm uppercase tracking-[0.4em] text-gray-400 whitespace-nowrap"
      style={{ fontFamily: "var(--font-intro), system-ui, sans-serif" }}
      initial={{ opacity: 0, letterSpacing: "0.15em" }}
      animate={{ opacity: 1, letterSpacing: "0.4em" }}
      transition={{ delay: 3.3, duration: 0.8, ease: "easeOut" }}
    >
      Money · Made · Smart
    </motion.p>
  );
}

function BackgroundGlow() {
  return (
    <>
      <motion.div
        aria-hidden
        className="absolute left-1/2 top-1/2 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/15 blur-3xl"
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: [0.4, 1.2, 1], opacity: [0, 0.9, 0.5] }}
        transition={{ duration: 2.4, times: [0, 0.4, 1], ease: "easeOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute left-1/4 top-1/3 h-72 w-72 rounded-full bg-brand/20 blur-3xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.6, 0.3] }}
        transition={{ duration: 2.6, delay: 0.4 }}
      />
    </>
  );
}

function Grid() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 bg-[linear-gradient(to_right,rgba(137,233,0,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(137,233,0,0.06)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]"
    />
  );
}

function BottomLoader() {
  return (
    <motion.div
      className="absolute bottom-12 left-1/2 -translate-x-1/2 h-[2px] w-40 overflow-hidden rounded-full bg-white/10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.4 }}
    >
      <motion.div
        className="h-full bg-gradient-to-r from-transparent via-brand to-transparent"
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{
          duration: 1.4,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      />
    </motion.div>
  );
}
