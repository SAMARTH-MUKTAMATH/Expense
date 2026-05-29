"use client";

import { useState, useEffect } from "react";
import { Edit2 } from "iconsax-react";
import { Target } from "lucide-react";
import { CircleCheckIcon } from "@/components/ui/circle-check";
import { XIcon } from "@/components/ui/x";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateBudget } from "@/actions/budget";
import { formatINR } from "@/lib/utils";

export function BudgetProgress({ initialBudget, currentExpenses }) {
  const [isEditing, setIsEditing] = useState(false);
  const [newBudget, setNewBudget] = useState(
    initialBudget?.amount?.toString() || ""
  );

  const {
    loading: isLoading,
    fn: updateBudgetFn,
    data: updatedBudget,
    error,
  } = useFetch(updateBudget);

  const percentUsed = initialBudget
    ? (currentExpenses / initialBudget.amount) * 100
    : 0;

  const remaining = initialBudget
    ? Math.max(initialBudget.amount - currentExpenses, 0)
    : 0;

  const handleUpdateBudget = async () => {
    const amount = parseFloat(newBudget);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    await updateBudgetFn(amount);
  };

  const handleCancel = () => {
    setNewBudget(initialBudget?.amount?.toString() || "");
    setIsEditing(false);
  };

  useEffect(() => {
    if (updatedBudget?.success) {
      setIsEditing(false);
      toast.success("Budget updated successfully");
    }
  }, [updatedBudget]);

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to update budget");
    }
  }, [error]);

  const statusColor =
    percentUsed >= 90
      ? "bg-gradient-to-r from-red-500 to-rose-500"
      : percentUsed >= 75
        ? "bg-gradient-to-r from-amber-400 to-orange-500"
        : "bg-gradient-to-r from-emerald-500 to-teal-500";

  return (
    <Card className="relative overflow-hidden bg-ink-soft border-white/10">
      <div
        aria-hidden
        className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-brand/15 blur-3xl"
      />
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-xl bg-brand text-ink flex items-center justify-center shadow-md shadow-brand/30">
              <Target className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Monthly budget
              </h3>
              <p className="text-xs text-gray-400">
                Default account · current month
              </p>
              <div className="flex items-center gap-2 mt-2">
                {isEditing ? (
                  <>
                    <span className="text-sm text-gray-400">₹</span>
                    <Input
                      type="number"
                      value={newBudget}
                      onChange={(e) => setNewBudget(e.target.value)}
                      className="w-32 h-8 bg-ink border-white/15 text-white"
                      placeholder="Amount"
                      autoFocus
                      disabled={isLoading}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-white/5"
                      onClick={handleUpdateBudget}
                      disabled={isLoading}
                    >
                      <CircleCheckIcon size={16} className="text-emerald-400" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-white/5"
                      onClick={handleCancel}
                      disabled={isLoading}
                    >
                      <XIcon size={16} className="text-red-400" />
                    </Button>
                  </>
                ) : initialBudget ? (
                  <>
                    <p className="text-sm text-gray-300">
                      <span className="font-semibold text-white">
                        {formatINR(currentExpenses)}
                      </span>{" "}
                      of {formatINR(initialBudget.amount)} spent
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsEditing(true)}
                      aria-label="Edit budget"
                      className="h-7 w-7 hover:bg-white/5"
                    >
                      <Edit2 className="h-4 w-4 text-brand" />
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setIsEditing(true)}
                    size="sm"
                    className="h-8 gap-1.5 btn-primary px-3"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Set budget
                  </Button>
                )}
              </div>
            </div>
          </div>

          {initialBudget && (
            <div className="text-right">
              <p className="text-xs text-gray-400">Remaining</p>
              <p className="text-2xl font-extrabold tracking-tight text-brand">
                {formatINR(remaining)}
              </p>
            </div>
          )}
        </div>

        {initialBudget && (
          <div className="mt-5">
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className={`h-full ${statusColor} transition-all duration-500`}
                style={{ width: `${Math.min(percentUsed, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <p className="text-xs text-gray-400">
                {percentUsed >= 100
                  ? "You've gone over budget"
                  : percentUsed >= 90
                    ? "Almost at your limit"
                    : percentUsed >= 75
                      ? "Watch your spending"
                      : "On track"}
              </p>
              <p className="text-xs font-medium text-gray-300">
                {percentUsed.toFixed(1)}% used
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
