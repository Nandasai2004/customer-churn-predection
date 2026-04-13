import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(val: number, decimals = 4): string {
  return val.toFixed(decimals);
}

export function formatPercent(val: number, decimals = 2): string {
  return val.toFixed(decimals) + "%";
}

export function formatCurrency(val: number): string {
  return "$" + val.toFixed(2);
}
