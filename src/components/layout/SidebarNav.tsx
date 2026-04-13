"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  History,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Activity,
} from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/templates", label: "Templates", icon: FileText },
] as const;

const BOTTOM_NAV_ITEMS = [
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function SidebarNav() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <nav
      aria-label="Main navigation"
      className={cn(
        "flex h-full flex-col border-r border-[#E7E5E4] bg-white transition-all duration-200",
        "dark:border-[#292524] dark:bg-[#1C1917]",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex h-16 items-center border-b border-[#E7E5E4] px-4 dark:border-[#292524]",
          collapsed ? "justify-center" : "gap-2"
        )}
      >
        <Activity
          className="h-6 w-6 shrink-0 text-[#1E40AF]"
          aria-hidden="true"
        />
        {!collapsed && (
          <span className="text-base font-semibold text-[var(--text-primary)]">
            TestFlow
          </span>
        )}
      </div>

      {/* Primary nav */}
      <ul role="list" className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === href
              : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                title={collapsed ? label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded px-3 py-2 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]",
                  collapsed ? "justify-center px-2" : "",
                  isActive
                    ? "bg-[#DBEAFE] text-[#1E3A8A] dark:bg-[#1E3A8A]/30 dark:text-[#60A5FA]"
                    : "text-[var(--text-secondary)] hover:bg-[#F5F5F4] hover:text-[var(--text-primary)] dark:hover:bg-[#292524]"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {!collapsed && <span>{label}</span>}
                {collapsed && <span className="sr-only">{label}</span>}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Bottom nav */}
      <div className="space-y-1 border-t border-[#E7E5E4] p-3 dark:border-[#292524]">
        {BOTTOM_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 rounded px-3 py-2 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]",
                collapsed ? "justify-center px-2" : "",
                isActive
                  ? "bg-[#DBEAFE] text-[#1E3A8A] dark:bg-[#1E3A8A]/30 dark:text-[#60A5FA]"
                  : "text-[var(--text-secondary)] hover:bg-[#F5F5F4] hover:text-[var(--text-primary)] dark:hover:bg-[#292524]"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {!collapsed && <span>{label}</span>}
              {collapsed && <span className="sr-only">{label}</span>}
            </Link>
          );
        })}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "flex w-full items-center gap-3 rounded px-3 py-2 text-sm font-medium transition-colors",
            "text-[var(--text-muted)] hover:bg-[#F5F5F4] hover:text-[var(--text-primary)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] dark:hover:bg-[#292524]",
            collapsed ? "justify-center px-2" : ""
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </nav>
  );
}
