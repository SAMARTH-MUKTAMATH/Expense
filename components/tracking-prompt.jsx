"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Zap, ShieldCheck, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useAppShell } from "@/hooks/use-app-shell";

const SNOOZE_KEY = "bf_tracking_prompt_snoozed_until";
const SNOOZE_DAYS = 3;
const FIRST_USED_KEY = "bf_first_used_at";
const DELAY_MS = 2 * 60_000;

const subscribe = () => () => {};

function isSnoozed() {
  try {
    return Number(window.localStorage.getItem(SNOOZE_KEY) || 0) > Date.now();
  } catch {
    return false;
  }
}

function msUntilPromptDue() {
  try {
    let firstUsed = Number(window.localStorage.getItem(FIRST_USED_KEY));
    if (!firstUsed) {
      firstUsed = Date.now();
      window.localStorage.setItem(FIRST_USED_KEY, String(firstUsed));
    }
    return Math.max(0, firstUsed + DELAY_MS - Date.now());
  } catch {
    return DELAY_MS;
  }
}

const POINTS = [
  { Icon: Zap, text: "Bank payments are added the moment the SMS arrives." },
  { Icon: BellRing, text: "Works in the background, even when the app is closed." },
  { Icon: ShieldCheck, text: "Only bank messages are read. Personal chats never leave your phone." },
];

export function TrackingPrompt() {
  const { inApp, trackingOn } = useAppShell();
  const snoozed = useSyncExternalStore(subscribe, isSnoozed, () => true);
  const [closed, setClosed] = useState(false);
  const [due, setDue] = useState(false);
  const eligible = inApp && !trackingOn && !snoozed;

  useEffect(() => {
    if (!eligible) return;
    const timer = setTimeout(() => setDue(true), msUntilPromptDue());
    return () => clearTimeout(timer);
  }, [eligible]);

  const open = eligible && due && !closed;

  const snooze = () => {
    setClosed(true);
    try {
      window.localStorage.setItem(
        SNOOZE_KEY,
        String(Date.now() + SNOOZE_DAYS * 86_400_000)
      );
    } catch {}
  };

  return (
    <Drawer open={open} onOpenChange={(next) => !next && snooze()}>
      <DrawerContent className="bg-ink-soft border-white/10">
        <div className="mx-auto w-full max-w-md px-4 pb-8">
          <DrawerHeader className="text-left">
            <span className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-ink shadow-md shadow-brand/40">
              <Zap size={24} />
            </span>
            <DrawerTitle className="text-2xl font-extrabold tracking-tight text-white">
              Stop typing every payment
            </DrawerTitle>
            <DrawerDescription className="text-gray-400">
              Turn on auto tracking and BudgetFLOW logs your bank payments for you.
            </DrawerDescription>
          </DrawerHeader>

          <ul className="space-y-3 px-4 pb-6">
            {POINTS.map(({ Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm text-gray-300">
                <Icon size={16} className="mt-0.5 shrink-0 text-brand" />
                {text}
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-2 px-4">
            <Button asChild className="btn-primary h-11 gap-2">
              <a href="paisa://start" onClick={() => setClosed(true)}>
                <Zap size={16} />
                Turn on auto tracking
              </a>
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={snooze}
              className="h-11 text-gray-400 hover:bg-white/5 hover:text-white"
            >
              Not now
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
