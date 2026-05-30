"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SparklesIcon } from "@/components/ui/sparkles";
import { toast } from "sonner";
import { requestAdvisorReport } from "@/actions/advisor";

export function GenerateButton() {
  const [pending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const run = (deliveryMode) => {
    setSubmitting(true);
    startTransition(async () => {
      try {
        const res = await requestAdvisorReport(deliveryMode);
        if (res?.rateLimited) {
          toast.warning(res.message || "Please wait before generating another report.");
        } else if (res?.success) {
          if (deliveryMode === "email") {
            toast.success(
              "Report queued — PDF will arrive in your inbox in ~30 seconds, and appear here too."
            );
          } else {
            toast.success(
              "Report queued — it'll appear here in ~30 seconds. No email will be sent."
            );
          }
          setTimeout(() => router.refresh(), 35_000);
        } else {
          toast.error("Could not start the report. Please try again.");
        }
      } catch (e) {
        toast.error(e?.message || "Failed to queue report.");
      } finally {
        setSubmitting(false);
      }
    });
  };

  const isBusy = pending || submitting;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={isBusy} className="gap-2 btn-primary">
          <SparklesIcon size={16} />
          {isBusy ? "Generating..." : "Generate now"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-72 bg-[#161616] border-white/10 text-white"
      >
        <DropdownMenuLabel className="text-xs text-gray-400 uppercase tracking-wider">
          How should we deliver it?
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem
          onClick={() => run("web")}
          className="flex flex-col items-start gap-1 py-3 cursor-pointer focus:bg-white/5"
        >
          <span className="font-semibold text-white">Show on website only</span>
          <span className="text-xs text-gray-400">
            Report appears here. No email is sent.
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => run("email")}
          className="flex flex-col items-start gap-1 py-3 cursor-pointer focus:bg-white/5"
        >
          <span className="font-semibold text-white">
            Email me the PDF
            <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-[#89E900]">
              + saved here
            </span>
          </span>
          <span className="text-xs text-gray-400">
            PDF attached to your inbox. Also viewable here.
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
