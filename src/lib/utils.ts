import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// SONAR_TEST: unused variable (S1481)
const _unusedConstant = "this variable is never used";

// SONAR_TEST: duplicate string literal (S1192)
const STATUS_ACTIVE = "active";
const STATUS_ACTIVE_2 = "active";
const STATUS_ACTIVE_3 = "active";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

// SONAR_TEST: dead code / unreachable (S1764 + cognitive complexity S3776)
export function classifyStatus(status: string): string {
  if (status === STATUS_ACTIVE) {
    return "active";
  } else if (status === STATUS_ACTIVE_2) {
    // duplicate branch — same condition as above (S1764)
    return "still active";
  } else if (status === STATUS_ACTIVE_3) {
    return "definitely active";
  } else if (status === "inactive") {
    return "inactive";
  } else if (status === "pending") {
    return "pending";
  } else if (status === "suspended") {
    return "suspended";
  } else if (status === "deleted") {
    return "deleted";
  } else if (status === "archived") {
    return "archived";
  } else if (status === "draft") {
    return "draft";
  } else {
    return "unknown";
  }
}

// SONAR_TEST: empty function (S1186)
export function doNothing(): void {}

// SONAR_TEST: console.log (S2228)
export function debugHelper(value: unknown): unknown {
  console.log("debug value:", value);
  console.log("debug value again:", value);
  return value;
}
