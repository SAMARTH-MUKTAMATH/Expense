"use client";

import {
  Star as Star1,
  ArrowUpRight as ArrowUpRightIcon,
  ArrowDownRight as ArrowDownRightIcon,
  Wallet as WalletIcon,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useEffect } from "react";
import useFetch from "@/hooks/use-fetch";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { updateDefaultAccount } from "@/actions/account";
import { toast } from "sonner";
import { formatINR } from "@/lib/utils";

export function AccountCard({ account }) {
  const { name, type, balance, id, isDefault } = account;

  const {
    loading: updateDefaultLoading,
    fn: updateDefaultFn,
    data: updatedAccount,
    error,
  } = useFetch(updateDefaultAccount);

  const handleDefaultChange = async (event) => {
    event.preventDefault();
    if (isDefault) {
      toast.warning("You need at least 1 default account");
      return;
    }
    await updateDefaultFn(id);
  };

  useEffect(() => {
    if (updatedAccount?.success) {
      toast.success("Default account updated successfully");
    }
  }, [updatedAccount]);

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to update default account");
    }
  }, [error]);

  return (
    <Card className="group relative overflow-hidden surface-card hover:border-[#89E900]/50 hover:-translate-y-1 transition-all duration-300">
      <div
        aria-hidden
        className="absolute -top-16 -right-16 h-40 w-40 rounded-full blur-3xl opacity-40 group-hover:opacity-80 group-hover:scale-110 transition-all duration-500 bg-[#89E900]/50"
      />
      <Link href={`/account/${id}`}>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 relative">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center shadow-lg bg-gradient-to-br from-[#b6f047] via-[#89E900] to-[#7AD100] text-[#0a0a0a] shadow-[#89E900]/40">
              <WalletIcon size={16} className="icon-hover" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold capitalize leading-tight text-white">
                {name}
              </CardTitle>
              <p className="text-xs text-gray-400">
                {type.charAt(0) + type.slice(1).toLowerCase()} Account
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isDefault && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#89E900] px-2 py-0.5 text-[10px] font-semibold text-[#0a0a0a]">
                <Star1 className="h-3 w-3 fill-[#0a0a0a] text-[#0a0a0a]" />
                Default
              </span>
            )}
            <Switch
              checked={isDefault}
              onClick={handleDefaultChange}
              disabled={updateDefaultLoading}
            />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-400">Current balance</p>
          <div className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1 text-white">
            {formatINR(balance)}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between text-xs text-gray-400 border-t border-white/10 pt-3">
          <div className="flex items-center gap-1">
            <ArrowUpRightIcon size={14} className="text-emerald-400" />
            Income
          </div>
          <div className="flex items-center gap-1">
            <ArrowDownRightIcon size={14} className="text-red-400" />
            Expense
          </div>
        </CardFooter>
      </Link>
    </Card>
  );
}
