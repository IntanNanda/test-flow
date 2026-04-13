import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "tertiary" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-[#1E40AF] text-white hover:bg-[#1D3799] focus-visible:ring-[#2563EB] disabled:bg-[#93C5FD] disabled:text-white",
  secondary:
    "border border-[#E7E5E4] bg-white text-[#1C1917] hover:bg-[#F5F5F4] focus-visible:ring-[#2563EB] dark:border-[#292524] dark:bg-[#1C1917] dark:text-[#FAFAF9] dark:hover:bg-[#292524]",
  tertiary:
    "bg-transparent text-[#1E40AF] hover:bg-[#DBEAFE] focus-visible:ring-[#2563EB] dark:text-[#60A5FA] dark:hover:bg-[#1E3A8A]/30",
  danger:
    "bg-[#B91C1C] text-white hover:bg-[#991B1B] focus-visible:ring-[#EF4444] disabled:bg-[#FCA5A5]",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-base gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        className={cn(
          "inline-flex min-w-[44px] cursor-pointer items-center justify-center rounded font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          leftIcon && <span aria-hidden="true">{leftIcon}</span>
        )}
        <span>{loading ? "Loading…" : children}</span>
        {!loading && rightIcon && <span aria-hidden="true">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
