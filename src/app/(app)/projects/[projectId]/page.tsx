import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { Plus, Layers, Globe, ChevronRight } from "lucide-react";
import { SuiteActions } from "./SuiteActions";

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
    .select("id, name, slug, description, sort_order, created_at")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });

  // Fetch test case counts separately
  const { data: tcCounts } = await supabase
    .from("test_cases")
    .select("feature_id")
    .in("feature_id", (features ?? []).map((f) => f.id));

  const countMap = Object.fromEntries(
    (features ?? []).map((f) => [
      f.id,
      (tcCounts ?? []).filter((tc) => tc.feature_id === f.id).length,
    ])
  );

  return (
    <div className="min-h-screen bg-[#EEF2F7]">
      <div className="mx-auto max-w-350 px-6 py-6">

        {/* Header card */}
        <div className="mb-6 rounded-2xl border border-[#E2E8F0] bg-white px-6 py-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-semibold text-[#0A1B3D]">{project.name}</h1>
              {project.description && (
                <p className="mt-0.5 truncate text-sm text-[#6B7A99]">{project.description}</p>
              )}
              {project.base_url && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-[#6B7A99]">
                  <Globe className="h-3 w-3" aria-hidden="true" />
                  <a
                    href={project.base_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#2B6CFF] hover:underline"
                  >
                    {project.base_url}
                  </a>
                </div>
              )}
            </div>
            <Link
              href={`/projects/${projectId}/features/new`}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#2B6CFF] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1E5AE8]"
            >
              <Plus className="h-3.5 w-3.5" />
              New test suite
            </Link>
          </div>
        </div>

        {/* Test suites list */}
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-sm font-semibold text-[#0A1B3D]">Test Suites</h2>
          <span className="rounded-full bg-[#E8F0FF] px-2.5 py-0.5 text-xs font-semibold text-[#2B6CFF]">
            {features?.length ?? 0}
          </span>
        </div>

        {features && features.length > 0 ? (
          <div className="space-y-2">
            {features.map((feature) => {
              const count = countMap[feature.id] ?? 0;
              return (
                <div key={feature.id} className="group flex items-center gap-2 rounded-2xl border border-[#E2E8F0] bg-white px-5 py-4 shadow-sm transition-all hover:border-[#2B6CFF] hover:shadow-md">
                  {/* Clickable area */}
                  <Link
                    href={`/projects/${projectId}/features/${feature.id}`}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E8F0FF]">
                      <Layers className="h-4 w-4 text-[#2B6CFF]" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#0A1B3D] transition-colors group-hover:text-[#2B6CFF]">
                        {feature.name}
                      </p>
                      {feature.description && (
                        <p className="truncate text-xs text-[#6B7A99]">{feature.description}</p>
                      )}
                    </div>
                    <span className="shrink-0 tabular-nums text-xs text-[#6B7A99]">
                      {count} test case{count !== 1 ? "s" : ""}
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-[#B0BAD0] transition-colors group-hover:text-[#2B6CFF]" aria-hidden="true" />
                  </Link>

                  {/* Actions */}
                  <div className="shrink-0 border-l border-[#F0F4FA] pl-2">
                    <SuiteActions
                      featureId={feature.id}
                      projectId={projectId}
                      name={feature.name}
                      description={feature.description}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
            <EmptyState
              icon={Layers}
              title="No test suites yet"
              description="Add a test suite to group your test cases — e.g. 'Login Flow', 'Checkout', 'Dashboard'."
              action={{ label: "New test suite" }}
            />
          </div>
        )}

      </div>
    </div>
  );
}
