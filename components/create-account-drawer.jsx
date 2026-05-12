"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RefreshCWIcon } from "@/components/ui/refresh-cw";
import { WalletIcon } from "@/components/ui/wallet";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { createAccount } from "@/actions/dashboard";
import { accountSchema } from "@/app/lib/schema";

export function CreateAccountDrawer({ children }) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: "",
      type: "CURRENT",
      balance: "",
      isDefault: false,
    },
  });

  const {
    loading: createAccountLoading,
    fn: createAccountFn,
    error,
    data: newAccount,
  } = useFetch(createAccount);

  const onSubmit = async (data) => {
    await createAccountFn(data);
  };

  useEffect(() => {
    if (newAccount) {
      toast.success("Account created successfully");
      reset();
      setOpen(false);
    }
  }, [newAccount, reset]);

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to create account");
    }
  }, [error]);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#89E900] text-[#0a0a0a] flex items-center justify-center shadow-md shadow-[#89E900]/30">
              <WalletIcon size={20} />
            </div>
            <div>
              <DrawerTitle className="text-2xl font-extrabold tracking-tight text-white">
                Create new account
              </DrawerTitle>
              <p className="text-xs text-gray-400">
                Add a bank, wallet, or cash account to track.
              </p>
            </div>
          </div>
        </DrawerHeader>
        <div className="px-6 pb-6 max-w-lg mx-auto w-full">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-white">
                Account name
              </label>
              <Input
                id="name"
                placeholder="e.g. HDFC Savings"
                className="bg-[#0a0a0a] border-white/15 text-white"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-red-400">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="type" className="text-sm font-medium text-white">
                Account type
              </label>
              <Select
                onValueChange={(value) => setValue("type", value)}
                defaultValue={watch("type")}
              >
                <SelectTrigger
                  id="type"
                  className="bg-[#0a0a0a] border-white/15 text-white"
                >
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CURRENT">Current</SelectItem>
                  <SelectItem value="SAVINGS">Savings</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-red-400">{errors.type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="balance"
                className="text-sm font-medium text-white"
              >
                Initial balance
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  ₹
                </span>
                <Input
                  id="balance"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-7 bg-[#0a0a0a] border-white/15 text-white"
                  {...register("balance")}
                />
              </div>
              {errors.balance && (
                <p className="text-sm text-red-400">{errors.balance.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0a0a0a] p-4">
              <div className="space-y-0.5">
                <label
                  htmlFor="isDefault"
                  className="text-base font-medium cursor-pointer text-white"
                >
                  Set as default
                </label>
                <p className="text-xs text-gray-400">
                  This account will be selected by default for new transactions.
                </p>
              </div>
              <Switch
                id="isDefault"
                checked={watch("isDefault")}
                onCheckedChange={(checked) => setValue("isDefault", checked)}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <DrawerClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 bg-transparent border-white/15 text-white hover:bg-white/5 hover:text-white"
                >
                  Cancel
                </Button>
              </DrawerClose>
              <Button
                type="submit"
                className="flex-1 btn-primary"
                disabled={createAccountLoading}
              >
                {createAccountLoading ? (
                  <>
                    <RefreshCWIcon size={16} className="mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
            </div>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
