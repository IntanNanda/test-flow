import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ProjectSubNav } from "@/components/layout/ProjectSubNav";
import { ProjectBreadcrumb } from "@/components/layout/ProjectBreadcrumb";

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
      <div className="border-b border-[#E2E8F0] bg-white">
        <div className="mx-auto max-w-350 px-6">
          {/* Breadcrumb */}
          <ProjectBreadcrumb projectName={project.name} />

          {/* Sub-navigation */}
          <ProjectSubNav projectId={projectId} />
        </div>
      </div>

      {/* Page content */}
      <div className="flex-1 bg-[#EEF2F7]">{children}</div>
    </div>
  );
}
