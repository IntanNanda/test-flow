import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MinusCircle,
  Loader2,
  Clock,
} from "lucide-react";

export type StatusValue =
  | "passed"
  | "failed"
  | "warning"
  | "blocked"
  | "skipped"
  | "running"
  | "pending"
  | "queued"
  | "error"
  | "cancelled"
  | "draft"
  | "active"
  | "deprecated";

const STATUS_CONFIG: Record<
  StatusValue,
  { label: string; icon: React.ElementType; className: string }
> = {
  passed: {
    label: "Passed",
    icon: CheckCircle2,
    className: "bg-[#DCFCE7] text-[#14532D] dark:bg-[#14532D]/20 dark:text-[#4ADE80]",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    className: "bg-[#FEE2E2] text-[#7F1D1D] dark:bg-[#7F1D1D]/20 dark:text-[#F87171]",
  },
  error: {
    label: "Error",
    icon: XCircle,
    className: "bg-[#FEE2E2] text-[#7F1D1D] dark:bg-[#7F1D1D]/20 dark:text-[#F87171]",
  },
  warning: {
    label: "Warning",
    icon: AlertTriangle,
    className: "bg-[#FEF3C7] text-[#78350F] dark:bg-[#78350F]/20 dark:text-[#FBBF24]",
  },
  blocked: {
    label: "Blocked",
    icon: MinusCircle,
    className: "bg-[#F3F4F6] text-[#1F2937] dark:bg-[#1F2937]/40 dark:text-[#9CA3AF]",
  },
  skipped: {
    label: "Skipped",
    icon: MinusCircle,
    className: "bg-[#F3F4F6] text-[#1F2937] dark:bg-[#1F2937]/40 dark:text-[#9CA3AF]",
  },
  cancelled: {
    label: "Cancelled",
    icon: MinusCircle,
    className: "bg-[#F3F4F6] text-[#1F2937] dark:bg-[#1F2937]/40 dark:text-[#9CA3AF]",
  },
  running: {
    label: "Running",
    icon: Loader2,
    className: "bg-[#DBEAFE] text-[#1E3A8A] dark:bg-[#1E3A8A]/20 dark:text-[#60A5FA]",
  },
  queued: {
    label: "Queued",
    icon: Clock,
    className: "bg-[#DBEAFE] text-[#1E3A8A] dark:bg-[#1E3A8A]/20 dark:text-[#60A5FA]",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    className: "bg-[#F3F4F6] text-[#374151] dark:bg-[#374151]/30 dark:text-[#9CA3AF]",
  },
  draft: {
    label: "Draft",
    icon: Clock,
    className: "bg-[#F3F4F6] text-[#374151] dark:bg-[#374151]/30 dark:text-[#9CA3AF]",
  },
  active: {
    label: "Active",
    icon: CheckCircle2,
    className: "bg-[#DCFCE7] text-[#14532D] dark:bg-[#14532D]/20 dark:text-[#4ADE80]",
  },
  deprecated: {
    label: "Deprecated",
    icon: MinusCircle,
    className: "bg-[#F3F4F6] text-[#6B7280] dark:bg-[#6B7280]/20 dark:text-[#9CA3AF]",
  },
};

interface StatusBadgeProps {
  status: StatusValue;
  size?: "sm" | "md";
  className?: string;
}

export function StatusBadge({ status, size = "md", className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  if (!config) return null;

  const Icon = config.icon;
  const isRunning = status === "running";

  return (
    <span
      role="status"
      aria-label={config.label}
      className={cn(
        "inline-flex items-center gap-1 rounded font-semibold uppercase tracking-wide",
        size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-1 text-xs",
        config.className,
        className
      )}
    >
      <Icon
        className={cn(
          size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5",
          isRunning && "animate-spin"
        )}
        aria-hidden="true"
      />
      {config.label}
    </span>
  );
}
