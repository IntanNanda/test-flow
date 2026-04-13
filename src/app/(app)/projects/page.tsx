import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Plus, FolderOpen, Globe } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

export const metadata = {
  title: "Projects — TestFlow",
};

export default async function ProjectsPage() {
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select(`*, features(count), test_runs(count)`)
    .eq("status", "active")
    .order("updated_at", { ascending: false });

  return (
    <div className="mx-auto max-w-[1400px] p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Projects
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {projects?.length ?? 0} active project
            {projects?.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/projects/new">
          <Button leftIcon={<Plus className="h-4 w-4" />}>New project</Button>
        </Link>
      </div>

      {projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="group cursor-pointer transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <FolderOpen
                        className="h-4 w-4 shrink-0 text-[#1E40AF]"
                        aria-hidden="true"
                      />
                      <h2 className="truncate text-base font-semibold text-[var(--text-primary)] group-hover:text-[#1E40AF]">
                        {project.name}
                      </h2>
                    </div>
                    {project.description && (
                      <p className="line-clamp-2 text-sm text-[var(--text-secondary)]">
                        {project.description}
                      </p>
                    )}
                    {project.base_url && (
                      <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                        <Globe className="h-3 w-3" aria-hidden="true" />
                        <span className="truncate">{project.base_url}</span>
                      </div>
                    )}
                  </div>
                  <StatusBadge status="active" size="sm" />
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-[var(--text-muted)]">
                  <span>Updated {formatRelativeTime(project.updated_at)}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FolderOpen}
          title="No projects yet"
          description="Create your first project to start organizing test cases by feature."
          action={{ label: "New project" }}
        />
      )}
    </div>
  );
}
