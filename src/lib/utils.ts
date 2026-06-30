import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) {
    return "-";
  }

  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("fr-CI", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

export function formatPercent(value: number) {
  return new Intl.NumberFormat("fr-CI", {
    style: "percent",
    maximumFractionDigits: 1
  }).format(value);
}

export function safeNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
