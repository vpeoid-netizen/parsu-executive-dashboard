import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isNonEmpty(value: unknown): value is string | number {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  return true;
}

export function compactText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).replace(/\s+/g, " ").trim();
  return text.length ? text : null;
}

/** Official brand spelling. Do not apply to emails or hostnames. */
export function normalizeParSuSpelling(text: string) {
  return text.replace(/\bPARSU\b(?!\.)/gi, "ParSU");
}
