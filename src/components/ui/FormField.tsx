"use client";

import { cn } from "@/lib/utils";
import { forwardRef, useId } from "react";

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, hint, required, className, id, ...props }, ref) => {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    const errorId = `${fieldId}-error`;
    const hintId = `${fieldId}-hint`;

    const describedBy = [
      error ? errorId : null,
      hint ? hintId : null,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={fieldId}
          className="text-sm font-medium text-[var(--text-primary)]"
        >
          {label}
          {required && (
            <span
              aria-label="required"
              className="ml-1 text-[#B91C1C]"
              aria-hidden="true"
            >
              *
            </span>
          )}
          {required && <span className="sr-only"> (required)</span>}
        </label>

        {hint && (
          <p id={hintId} className="text-xs text-[var(--text-muted)]">
            {hint}
          </p>
        )}

        <input
          ref={ref}
          id={fieldId}
          required={required}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={describedBy || undefined}
          className={cn(
            "h-10 w-full rounded border px-3 text-sm",
            "border-[#E7E5E4] bg-white text-[#1C1917] placeholder:text-[#A8A29E]",
            "transition-colors focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20",
            "dark:border-[#292524] dark:bg-[#1C1917] dark:text-[#FAFAF9] dark:placeholder:text-[#57534E]",
            "dark:focus:border-[#60A5FA] dark:focus:ring-[#60A5FA]/20",
            error && "border-[#B91C1C] focus:border-[#B91C1C] focus:ring-[#B91C1C]/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />

        {error && (
          <p
            id={errorId}
            role="alert"
            className="flex items-center gap-1 text-xs font-medium text-[#B91C1C]"
          >
            <span aria-hidden="true">⚠</span>
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = "FormField";

// Textarea variant
interface TextareaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  ({ label, error, hint, required, className, id, ...props }, ref) => {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    const errorId = `${fieldId}-error`;
    const hintId = `${fieldId}-hint`;

    const describedBy = [error ? errorId : null, hint ? hintId : null]
      .filter(Boolean)
      .join(" ");

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={fieldId} className="text-sm font-medium text-[var(--text-primary)]">
          {label}
          {required && (
            <>
              <span aria-hidden="true" className="ml-1 text-[#B91C1C]">*</span>
              <span className="sr-only"> (required)</span>
            </>
          )}
        </label>

        {hint && (
          <p id={hintId} className="text-xs text-[var(--text-muted)]">
            {hint}
          </p>
        )}

        <textarea
          ref={ref}
          id={fieldId}
          required={required}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={describedBy || undefined}
          className={cn(
            "w-full rounded border px-3 py-2 text-sm",
            "border-[#E7E5E4] bg-white text-[#1C1917] placeholder:text-[#A8A29E]",
            "transition-colors focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20",
            "dark:border-[#292524] dark:bg-[#1C1917] dark:text-[#FAFAF9]",
            error && "border-[#B91C1C] focus:border-[#B91C1C] focus:ring-[#B91C1C]/20",
            "min-h-[80px] resize-y disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />

        {error && (
          <p id={errorId} role="alert" className="flex items-center gap-1 text-xs font-medium text-[#B91C1C]">
            <span aria-hidden="true">⚠</span>
            {error}
          </p>
        )}
      </div>
    );
  }
);

TextareaField.displayName = "TextareaField";
