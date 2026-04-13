import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Plus, Layers, Globe, ArrowRight } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("projects").select("name").eq("id", projectId).single();
  return { title: data ? `${data.name} — TestFlow` : "Project — TestFlow" };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (!project) notFound();

  const { data: features } = await supabase
    .from("features")
    .select(`*, test_cases(count)`)
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });

  return (
    <div className="mx-auto max-w-[1400px] p-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            {project.name}
          </h1>
          {project.description && (
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {project.description}
            </p>
          )}
          {project.base_url && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <Globe className="h-3 w-3" aria-hidden="true" />
              <a
                href={project.base_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {project.base_url}
              </a>
            </div>
          )}
        </div>
        <Link href={`/projects/${projectId}/features/new`}>
          <Button leftIcon={<Plus className="h-4 w-4" />}>Add feature</Button>
        </Link>
      </div>

      {/* Features list */}
      {features && features.length > 0 ? (
        <div className="space-y-3">
          {features.map((feature) => {
            const count = (feature.test_cases as unknown as { count: number }[])?.[0]?.count ?? 0;
            return (
              <Link
                key={feature.id}
                href={`/projects/${projectId}/features/${feature.id}`}
              >
                <Card className="group cursor-pointer transition-shadow hover:shadow-md">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[#DBEAFE] dark:bg-[#1E3A8A]/30"
                        aria-hidden="true"
                      >
                        <Layers className="h-4 w-4 text-[#1E40AF]" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-semibold text-[var(--text-primary)] group-hover:text-[#1E40AF]">
                          {feature.name}
                        </h2>
                        {feature.description && (
                          <p className="truncate text-xs text-[var(--text-secondary)]">
                            {feature.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-sm tabular-nums text-[var(--text-muted)]">
                        {count} test case{count !== 1 ? "s" : ""}
                      </span>
                      <ArrowRight
                        className="h-4 w-4 text-[var(--text-muted)] group-hover:text-[#1E40AF]"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Layers}
          title="No features yet"
          description="Add features to organize your test cases — e.g. 'Login Flow', 'Checkout', 'Dashboard'."
          action={{ label: "Add feature" }}
        />
      )}
    </div>
  );
}
