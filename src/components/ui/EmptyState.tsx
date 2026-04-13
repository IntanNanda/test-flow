import { cn } from "@/lib/utils";
import { Button } from "./Button";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-16 text-center",
        className
      )}
    >
      {Icon && (
        <div
          className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#F5F5F4] dark:bg-[#292524]"
          aria-hidden="true"
        >
          <Icon className="h-6 w-6 text-[var(--text-muted)]" />
        </div>
      )}
      <h3 className="mb-1 text-base font-semibold text-[var(--text-primary)]">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-[var(--text-secondary)]">{description}</p>
      {action && (
        <Button
          onClick={action.onClick}
          size="sm"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
