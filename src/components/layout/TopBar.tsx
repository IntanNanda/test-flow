"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Profile } from "@/types/database";

interface TopBarProps {
  profile?: Profile | null;
  title?: string;
}

export function TopBar({ profile, title }: TopBarProps) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#E7E5E4] bg-white px-6 dark:border-[#292524] dark:bg-[#1C1917]">
      {title && (
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h1>
      )}
      <div className="ml-auto flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded",
            "text-[var(--text-muted)] hover:bg-[#F5F5F4] hover:text-[var(--text-primary)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]",
            "dark:hover:bg-[#292524]"
          )}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Moon className="h-4 w-4" aria-hidden="true" />
          )}
        </button>

        {/* User display */}
        {profile && (
          <div className="flex items-center gap-2">
            <div
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DBEAFE] text-xs font-semibold text-[#1E40AF]"
            >
              {(profile.display_name ?? profile.email)[0].toUpperCase()}
            </div>
            <span className="hidden text-sm font-medium text-[var(--text-primary)] sm:block">
              {profile.display_name ?? profile.email}
            </span>
          </div>
        )}

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          aria-label="Sign out"
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded",
            "text-[var(--text-muted)] hover:bg-[#F5F5F4] hover:text-[var(--text-primary)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]",
            "dark:hover:bg-[#292524]"
          )}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
