"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useFetch from "@/hooks/use-fetch";
import { addExpense } from "@/actions/groups";
import { expenseSchema } from "@/app/lib/schema";

export function AddExpenseDrawer({ open, onOpenChange, group }) {
  const payerOptions = ["You", ...group.members.map((m) => m.name)];

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: "",
      amount: "",
      paidByName: "You",
      splitWith: group.members.map((m) => m.id),
    },
  });

  const splitWith = watch("splitWith") ?? [];

  const {
    loading,
    fn: submit,
    data: result,
  } = useFetch((data) =>
    addExpense({
      groupId: group.id,
      ...data,
    })
  );

  useEffect(() => {
    if (result?.success) {
      toast.success("Expense added");
      reset();
      onOpenChange(false);
    }
  }, [result, reset, onOpenChange]);

  const toggleMember = (memberId) => {
    const next = splitWith.includes(memberId)
      ? splitWith.filter((id) => id !== memberId)
      : [...splitWith, memberId];
    setValue("splitWith", next, { shouldValidate: true });
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-ink-soft border-white/10">
        <div className="mx-auto w-full max-w-xl px-4 pb-8">
          <DrawerHeader>
            <DrawerTitle className="text-white">Add expense</DrawerTitle>
            <DrawerDescription className="text-gray-400">
              Splits equally among selected members.
            </DrawerDescription>
          </DrawerHeader>

          <form
            onSubmit={handleSubmit(submit)}
            className="space-y-5 px-4 pt-2"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">
                Description
              </label>
              <Input
                placeholder="e.g. Dinner at Paradise"
                className="bg-ink border-white/15 text-white"
                {...register("description")}
              />
              {errors.description && (
                <p className="text-xs text-red-400">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    ₹
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-7 bg-ink border-white/15 text-white"
                    {...register("amount")}
                  />
                </div>
                {errors.amount && (
                  <p className="text-xs text-red-400">
                    {errors.amount.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white">
                  Paid by
                </label>
                <Controller
                  control={control}
                  name="paidByName"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="bg-ink border-white/15 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {payerOptions.map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">
                Split with
              </label>
              <div className="grid grid-cols-2 gap-2">
                {group.members.map((m) => {
                  const checked = splitWith.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleMember(m.id)}
                      className={
                        "flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors " +
                        (checked
                          ? "border-brand bg-brand/10"
                          : "border-white/10 bg-ink hover:bg-white/5")
                      }
                    >
                      <span
                        className={
                          "h-4 w-4 rounded border flex items-center justify-center text-[10px] font-bold " +
                          (checked
                            ? "border-brand bg-brand text-ink"
                            : "border-white/20 bg-transparent")
                        }
                      >
                        {checked ? "✓" : ""}
                      </span>
                      <span className="text-sm text-white truncate">
                        {m.name}
                      </span>
                    </button>
                  );
                })}
              </div>
              {splitWith.length === 0 && (
                <p className="text-xs text-amber-400">
                  Select at least one member.
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 bg-transparent border-white/15 text-white hover:bg-white/5 hover:text-white"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 btn-primary"
                disabled={loading || splitWith.length === 0}
              >
                {loading ? "Saving..." : "Add expense"}
              </Button>
            </div>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
