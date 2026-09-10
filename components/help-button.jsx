"use client";

import { HelpCircle } from "lucide-react";
import { Button } from "./ui/button";

export function HelpButton() {
  const open = () => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new Event("bf:open-onboarding"));
  };

  return (
    <Button
      type="button"
      onClick={open}
      variant="outline"
      size="icon"
      aria-label="Help / Tour"
      title="App tour"
      className="bg-transparent border-white/15 text-white hover:bg-white/5 hover:text-white"
    >
      <HelpCircle size={18} />
    </Button>
  );
}
