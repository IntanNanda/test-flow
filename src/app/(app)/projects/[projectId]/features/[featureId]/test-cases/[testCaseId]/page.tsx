import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { StepBuilder } from "./StepBuilder";
import { ChevronRight, Calendar, User } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ testCaseId: string }>;
}) {
  const { testCaseId } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("test_cases")
    .select("title")
    .eq("id", testCaseId)
    .single();
  return { title: data ? `${data.title} — TestFlow` : "Test case — TestFlow" };
}

const SCENARIO_LABELS: Record<string, { label: string; class: string }> = {
  positive: { label: "Positive", class: "bg-[#DCFCE7] text-[#14532D]" },
  negative: { label: "Negative", class: "bg-[#FEE2E2] text-[#7F1D1D]" },
  edge: { label: "Edge", class: "bg-[#FEF3C7] text-[#78350F]" },
};

export default async function TestCasePage({
  params,
}: {
  params: Promise<{ projectId: string; featureId: string; testCaseId: string }>;
}) {
  const { projectId, featureId, testCaseId } = await params;
  const supabase = await createClient();

  const [{ data: tc }, { data: feature }, { data: project }, { data: steps }] =
    await Promise.all([
      supabase.from("test_cases").select("*").eq("id", testCaseId).single(),
      supabase.from("features").select("name").eq("id", featureId).single(),
      supabase.from("projects").select("name").eq("id", projectId).single(),
      supabase
        .from("test_steps")
        .select("*")
        .eq("test_case_id", testCaseId)
        .order("step_order", { ascending: true }),
    ]);

  if (!tc) notFound();

  const scenario = SCENARIO_LABELS[tc.scenario_type];

  return (
    <div className="mx-auto max-w-[1400px] p-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-[var(--text-muted)]">
        <Link href="/projects" className="hover:text-[var(--text-primary)]">Projects</Link>
        <ChevronRight className="h-3 w-3" aria-hidden="true" />
        <Link href={`/projects/${projectId}`} className="hover:text-[var(--text-primary)]">{project?.name}</Link>
        <ChevronRight className="h-3 w-3" aria-hidden="true" />
        <Link href={`/projects/${projectId}/features/${featureId}`} className="hover:text-[var(--text-primary)]">{feature?.name}</Link>
        <ChevronRight className="h-3 w-3" aria-hidden="true" />
        <span className="text-[var(--text-secondary)]" aria-current="page">{tc.title}</span>
      </nav>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main — steps */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-[var(--text-primary)]">{tc.title}</h1>
              {tc.description && (
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{tc.description}</p>
              )}
            </div>
            <StatusBadge
              status={(tc.last_run_status as "passed" | "failed" | "pending") ?? "pending"}
            />
          </div>

          {/* Steps */}
          <StepBuilder
            testCaseId={testCaseId}
            featureId={featureId}
            projectId={projectId}
            initialSteps={steps ?? []}
          />
        </div>

        {/* Sidebar — metadata */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Scenario</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex rounded px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${scenario.class}`}>
                      {scenario.label}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Priority</dt>
                  <dd className="mt-1"><PriorityBadge priority={tc.priority} /></dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Type</dt>
                  <dd className="mt-1 text-[var(--text-primary)]">
                    {tc.test_type === "functional"
                      ? "Functional (Playwright)"
                      : tc.test_type === "api_performance"
                      ? "API Performance"
                      : "Frontend Performance (Lighthouse)"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Status</dt>
                  <dd className="mt-1">
                    <StatusBadge status={tc.status} size="sm" />
                  </dd>
                </div>
                {tc.tags.length > 0 && (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Tags</dt>
                    <dd className="mt-1 flex flex-wrap gap-1">
                      {tc.tags.map((tag) => (
                        <span key={tag} className="rounded bg-[#F5F5F4] px-1.5 py-0.5 text-xs text-[var(--text-muted)] dark:bg-[#292524]">
                          {tag}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
                {tc.preconditions && (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Preconditions</dt>
                    <dd className="mt-1 text-[var(--text-secondary)]">{tc.preconditions}</dd>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                  <Calendar className="h-3 w-3" aria-hidden="true" />
                  Created {formatRelativeTime(tc.created_at)}
                </div>
                {tc.last_run_at && (
                  <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                    <Calendar className="h-3 w-3" aria-hidden="true" />
                    Last run {formatRelativeTime(tc.last_run_at)}
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
