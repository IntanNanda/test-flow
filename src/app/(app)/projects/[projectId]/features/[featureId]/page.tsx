import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { Plus, TestTube2, ArrowLeft, ChevronRight } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import type { TestCase } from "@/types/database";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ projectId: string; featureId: string }>;
}) {
  const { featureId } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("features")
    .select("name")
    .eq("id", featureId)
    .single();
  return { title: data ? `${data.name} — TestFlow` : "Feature — TestFlow" };
}

const SCENARIO_LABELS: Record<string, string> = {
  positive: "Positive",
  negative: "Negative",
  edge: "Edge",
};

const SCENARIO_CLASSES: Record<string, string> = {
  positive: "bg-[#DCFCE7] text-[#14532D]",
  negative: "bg-[#FEE2E2] text-[#7F1D1D]",
  edge: "bg-[#FEF3C7] text-[#78350F]",
};

export default async function FeaturePage({
  params,
}: {
  params: Promise<{ projectId: string; featureId: string }>;
}) {
  const { projectId, featureId } = await params;
  const supabase = await createClient();

  const [{ data: feature }, { data: project }] = await Promise.all([
    supabase
      .from("features")
      .select("*")
      .eq("id", featureId)
      .single(),
    supabase
      .from("projects")
      .select("name")
      .eq("id", projectId)
      .single(),
  ]);

  if (!feature) notFound();

  const { data: testCases } = await supabase
    .from("test_cases")
    .select("*")
    .eq("feature_id", featureId)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-[1400px] p-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
        <Link href="/projects" className="hover:text-[var(--text-primary)]">Projects</Link>
        <ChevronRight className="h-3 w-3" aria-hidden="true" />
        <Link href={`/projects/${projectId}`} className="hover:text-[var(--text-primary)]">{project?.name}</Link>
        <ChevronRight className="h-3 w-3" aria-hidden="true" />
        <span className="text-[var(--text-secondary)]" aria-current="page">{feature.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            {feature.name}
          </h1>
          {feature.description && (
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {feature.description}
            </p>
          )}
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {testCases?.length ?? 0} test case{(testCases?.length ?? 0) !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href={`/projects/${projectId}/features/${featureId}/test-cases/new`}>
          <Button leftIcon={<Plus className="h-4 w-4" />}>New test case</Button>
        </Link>
      </div>

      {/* Test cases table */}
      {testCases && testCases.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-[#E7E5E4] dark:border-[#292524]">
          <table className="w-full text-sm" role="grid" aria-label="Test cases">
            <thead>
              <tr className="border-b border-[#E7E5E4] bg-[#FAFAF9] dark:border-[#292524] dark:bg-[#1C1917]">
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Title
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Scenario
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Priority
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Type
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Last run
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E5E4] bg-white dark:divide-[#292524] dark:bg-[#0C0A09]">
              {testCases.map((tc: TestCase) => (
                <tr
                  key={tc.id}
                  className="group cursor-pointer hover:bg-[#F5F5F4] dark:hover:bg-[#1C1917]"
                >
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={(tc.last_run_status as "passed" | "failed" | "pending") ?? "pending"}
                      size="sm"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/projects/${projectId}/features/${featureId}/test-cases/${tc.id}`}
                      className="font-medium text-[var(--text-primary)] hover:text-[#1E40AF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
                    >
                      {tc.title}
                    </Link>
                    {tc.tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {tc.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded bg-[#F5F5F4] px-1.5 py-0.5 text-[11px] text-[var(--text-muted)] dark:bg-[#292524]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${SCENARIO_CLASSES[tc.scenario_type]}`}
                    >
                      {SCENARIO_LABELS[tc.scenario_type]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={tc.priority} />
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--text-muted)]">
                    {tc.test_type === "functional"
                      ? "Functional"
                      : tc.test_type === "api_performance"
                      ? "API Perf"
                      : "Lighthouse"}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-xs text-[var(--text-muted)]">
                    {tc.last_run_at ? formatRelativeTime(tc.last_run_at) : "Never"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={TestTube2}
          title="No test cases yet"
          description="Add test cases to document what should be tested — positive flows, negative cases, and edge scenarios."
          action={{ label: "New test case" }}
        />
      )}
    </div>
  );
}
