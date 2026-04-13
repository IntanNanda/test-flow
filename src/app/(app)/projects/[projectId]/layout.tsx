import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ProjectNavLink } from "@/components/layout/ProjectNavLink";
import { FolderOpen, Play, BarChart2, Settings, Layers } from "lucide-react";

const navItems = [
  { href: "", label: "Features", icon: Layers, exact: true },
  { href: "/runs", label: "Runs", icon: Play },
  { href: "/performance", label: "Performance", icon: BarChart2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, slug")
    .eq("id", projectId)
    .single();

  if (!project) notFound();

  return (
    <div className="flex min-h-full flex-col">
      {/* Project sub-header */}
      <div className="border-b border-(--border) bg-(--surface)">
        <div className="mx-auto max-w-350 px-6">
          {/* Project name breadcrumb */}
          <div className="flex items-center gap-2 py-3 text-sm">
            <FolderOpen className="h-4 w-4 text-[#1E40AF]" aria-hidden="true" />
            <Link
              href="/projects"
              className="text-(--text-muted) hover:text-(--text-primary)"
            >
              Projects
            </Link>
            <span className="text-(--text-muted)" aria-hidden="true">/</span>
            <span className="font-semibold text-(--text-primary)">
              {project.name}
            </span>
          </div>

          {/* Sub-navigation */}
          <nav aria-label="Project navigation" className="-mb-px flex">
            {navItems.map(({ href, label, icon: Icon, exact }) => {
              const fullHref = `/projects/${projectId}${href}`;
              return (
                <ProjectNavLink
                  key={label}
                  href={fullHref}
                  label={label}
                  icon={Icon}
                  exact={exact}
                />
              );
            })}
          </nav>
        </div>
      </div>

      {/* Page content */}
      <div className="flex-1 bg-(--bg)">{children}</div>
    </div>
  );
}
