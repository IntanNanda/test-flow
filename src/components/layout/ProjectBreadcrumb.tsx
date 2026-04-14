"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

export function ProjectBreadcrumb({ projectName }: { projectName: string }) {
  const pathname = usePathname();

  // Hide on feature detail pages — the page itself renders a fuller breadcrumb
  const isFeatureDetail = /\/projects\/[^/]+\/features\/[^/]/.test(pathname);
  if (isFeatureDetail) return null;

  return (
    <div className="flex items-center gap-1.5 py-4 text-sm">
      <Link href="/projects" className="text-[#6B7A99] transition-colors hover:text-[#2B6CFF]">
        Projects
      </Link>
      <ChevronRight className="h-3.5 w-3.5 text-[#B0BAD0]" aria-hidden="true" />
      <span className="font-semibold text-[#0A1B3D]">{projectName}</span>
    </div>
  );
}
