"use client";

import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  formatGroupSummary,
  groupSummaryFileName,
  downloadTextFile,
} from "@/lib/bill-formatter";

export function DownloadSummaryButton({ group }) {
  const handleClick = () => {
    try {
      const text = formatGroupSummary(group);
      const filename = groupSummaryFileName(group);
      downloadTextFile(text, filename);
      toast.success(`Summary downloaded for ${group.name}`);
    } catch (err) {
      toast.error(err.message || "Failed to generate summary");
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      className="gap-2 bg-transparent border-brand/40 text-brand hover:bg-brand/10 hover:text-brand"
    >
      <Download className="h-4 w-4" />
      <span className="hidden sm:inline">Download summary</span>
      <span className="sm:hidden">Download</span>
    </Button>
  );
}
