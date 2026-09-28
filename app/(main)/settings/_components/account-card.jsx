"use client";

import { useClerk } from "@clerk/nextjs";
import { format } from "date-fns";
import { UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AccountCard({ name, email, memberSince }) {
  const { openUserProfile } = useClerk();
  const initial = (name || email || "?").charAt(0).toUpperCase();

  return (
    <div className="rounded-2xl border border-white/10 bg-[#161616] p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand text-lg font-bold text-ink">
            {initial}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-white">
              {name || "No name set"}
            </p>
            <p className="truncate text-sm text-gray-400">{email}</p>
            {memberSince && (
              <p className="mt-0.5 text-xs text-gray-500">
                Member since {format(new Date(memberSince), "MMMM yyyy")}
              </p>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => openUserProfile()}
          className="shrink-0 gap-2 bg-transparent border-white/15 text-white hover:bg-white/5 hover:text-white"
        >
          <UserCog size={16} />
          Manage account
        </Button>
      </div>
    </div>
  );
}
