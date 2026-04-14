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
      className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
        isActive
          ? "border-[#2B6CFF] text-[#2B6CFF]"
          : "border-transparent text-[#6B7A99] hover:text-[#0A1B3D]"
      }`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </Link>
  );
}
