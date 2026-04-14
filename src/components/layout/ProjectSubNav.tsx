"use client";

import { usePathname } from "next/navigation";
import { ProjectNavLink } from "@/components/layout/ProjectNavLink";
import { Layers, Play, BarChart2, Settings } from "lucide-react";

const navItems = [
  { href: "", label: "Features", icon: Layers, exact: true },
  { href: "/runs", label: "Runs", icon: Play },
  { href: "/performance", label: "Performance", icon: BarChart2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function ProjectSubNav({ projectId }: { projectId: string }) {
  const pathname = usePathname();

  // Hide tabs on feature detail pages and deeper (test case pages)
  const isFeatureDetail = /\/projects\/[^/]+\/features\/[^/]/.test(pathname);
  if (isFeatureDetail) return null;

  return (
    <nav aria-label="Project navigation" className="-mb-px flex">
      {navItems.map(({ href, label, icon, exact }) => {
        const fullHref = `/projects/${projectId}${href}`;
        return (
          <ProjectNavLink
            key={label}
            href={fullHref}
            label={label}
            icon={icon}
            exact={exact}
          />
        );
      })}
    </nav>
  );
}
