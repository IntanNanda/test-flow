import { cn } from "@/lib/utils";
import type { TestPriority } from "@/types/database";

const PRIORITY_CONFIG: Record<TestPriority, { label: string; className: string }> = {
  critical: {
    label: "Critical",
    className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  },
  high: {
    label: "High",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  },
  medium: {
    label: "Medium",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  },
  low: {
    label: "Low",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  },
};

interface PriorityBadgeProps {
  priority: TestPriority;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-1 text-xs font-semibold uppercase tracking-wide",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
