import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ProjectSubNav } from "@/components/layout/ProjectSubNav";
import { FolderOpen } from "lucide-react";

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
          <ProjectSubNav projectId={projectId} />
        </div>
      </div>

      {/* Page content */}
      <div className="flex-1 bg-(--bg)">{children}</div>
    </div>
  );
}
