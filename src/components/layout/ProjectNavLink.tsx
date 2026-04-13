"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ProjectNavLink({
  href,
  label,
  icon: Icon,
  exact,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
        isActive
          ? "border-[#1E40AF] text-[#1E40AF]"
          : "border-transparent text-(--text-secondary) hover:border-(--border) hover:text-(--text-primary)"
      }`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </Link>
  );
}
