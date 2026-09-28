"use client";

import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppShell } from "@/hooks/use-app-shell";

export function StartTrackingCard() {
  const { inApp, trackingOn } = useAppShell();
  if (!inApp || trackingOn) return null;

  return (
    <Card className="border-brand/40 bg-brand/5">
      <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-white">Turn on auto tracking</p>
          <p className="mt-1 text-sm text-white/60">
            Payments from your bank SMS get added for you, even when the app is
            closed.
          </p>
        </div>
        <Button asChild className="btn-primary shrink-0 gap-2">
          <a href="paisa://start">
            <Zap size={16} />
            Turn on
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
