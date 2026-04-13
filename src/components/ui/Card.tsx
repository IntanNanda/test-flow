import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[#E7E5E4] bg-white p-6",
        "dark:border-[#292524] dark:bg-[#1C1917]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, ...props }: CardProps) {
  return (
    <div className={cn("mb-4 flex items-center justify-between", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className, ...props }: CardProps) {
  return (
    <h2
      className={cn("text-base font-semibold text-[var(--text-primary)]", className)}
      {...props}
    >
      {children}
    </h2>
  );
}

export function CardContent({ children, className, ...props }: CardProps) {
  return (
    <div className={cn(className)} {...props}>
      {children}
    </div>
  );
}
