"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const WORD_PREFIX = "Budget";
const WORD_ACCENT = "FLOW";

export default function IntroScreen() {
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;
    // Always play on refresh (no session gate).
    setShow(true);
    const timer = setTimeout(() => setShow(false), 5000);
    return () => clearTimeout(timer);
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
          className="fixed inset-0 z-[999] flex items-center justify-center overflow-hidden bg-[#0a0a0a]"
          style={{ fontFamily: "var(--font-intro), system-ui, sans-serif" }}
        >
          <BackgroundGlow />
          <Grid />

          <div className="relative flex flex-col items-center [perspective:1200px]">
            <Coin />
            <Wordmark />
            <Tagline />
          </div>

          <BottomLoader />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Coin() {
  return (
    <motion.div
      className="relative h-32 w-32 sm:h-40 sm:w-40 [transform-style:preserve-3d]"
      initial={{ scale: 0, rotateY: 0, opacity: 0 }}
      animate={{
        scale: [0, 1.15, 1, 1, 1],
        rotateY: [0, 360, 720, 900, 990],
        opacity: [0, 1, 1, 1, 0],
      }}
      transition={{
        duration: 1.8,
        times: [0, 0.25, 0.55, 0.85, 1],
        ease: "easeInOut",
      }}
    >
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#b6f047] via-[#89E900] to-[#5fa800] shadow-[0_0_80px_0_rgba(137,233,0,0.6),0_20px_60px_-10px_rgba(0,0,0,0.6),inset_0_4px_20px_rgba(255,255,255,0.4),inset_0_-6px_20px_rgba(0,0,0,0.25)] flex items-center justify-center">
        <span
          className="text-6xl sm:text-7xl font-bold text-[#0a0a0a] [text-shadow:0_2px_0_rgba(255,255,255,0.3)] select-none"
          style={{ fontFamily: "var(--font-intro), system-ui, sans-serif" }}
        >
          ₹
        </span>
        <div
          aria-hidden
          className="absolute inset-1 rounded-full border-2 border-dashed border-[#0a0a0a]/15"
        />
        <div
          aria-hidden
          className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-white/0 to-white/30"
        />
      </div>
    </motion.div>
  );
}

function Wordmark() {
  const prefix = WORD_PREFIX.split("");
  const accent = WORD_ACCENT.split("");

  return (
    <motion.div
      className="absolute top-1/2 -translate-y-1/2 flex items-baseline gap-[0.04em]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.55, duration: 0.1 }}
      style={{ fontFamily: "var(--font-intro), system-ui, sans-serif" }}
    >
      {prefix.map((char, i) => (
        <motion.span
          key={`p-${i}`}
          className="inline-block text-8xl sm:text-9xl md:text-[10rem] tracking-tight text-white"
          style={{ fontWeight: 700 }}
          initial={{ opacity: 0, y: 40, rotateX: -90, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" }}
          transition={{
            delay: 1.6 + i * 0.06,
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {char}
        </motion.span>
      ))}
      {accent.map((char, i) => (
        <motion.span
          key={`a-${i}`}
          className="inline-block text-8xl sm:text-9xl md:text-[10rem] tracking-tight text-brand"
          style={{ fontWeight: 400 }}
          initial={{ opacity: 0, y: 40, rotateX: -90, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" }}
          transition={{
            delay: 1.6 + (prefix.length + i) * 0.06,
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {char}
        </motion.span>
      ))}
    </motion.div>
  );
}

function Tagline() {
  return (
    <motion.p
      className="absolute top-[calc(50%+5rem)] sm:top-[calc(50%+5.5rem)] text-xs sm:text-sm uppercase tracking-[0.4em] text-gray-400 whitespace-nowrap"
      style={{ fontFamily: "var(--font-intro), system-ui, sans-serif" }}
      initial={{ opacity: 0, letterSpacing: "0.15em" }}
      animate={{ opacity: 1, letterSpacing: "0.4em" }}
      transition={{ delay: 2.1, duration: 0.6, ease: "easeOut" }}
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
        className="absolute left-1/2 top-1/2 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#89E900]/15 blur-3xl"
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: [0.4, 1.2, 1], opacity: [0, 0.9, 0.5] }}
        transition={{ duration: 2.4, times: [0, 0.4, 1], ease: "easeOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute left-1/4 top-1/3 h-72 w-72 rounded-full bg-[#89E900]/20 blur-3xl"
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
        className="h-full bg-gradient-to-r from-transparent via-[#89E900] to-transparent"
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
