import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const inrCompactFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatINR(value, { compact = false } = {}) {
  const num = typeof value === "number" ? value : parseFloat(value);
  if (!Number.isFinite(num)) return "₹0";
  return compact ? inrCompactFormatter.format(num) : inrFormatter.format(num);
}
