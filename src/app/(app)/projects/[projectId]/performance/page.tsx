import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { BarChart2, TrendingDown, TrendingUp, Minus } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("name")
    .eq("id", projectId)
    .single();
  return {
    title: data
      ? `Performance — ${data.name} — TestFlow`
      : "Performance — TestFlow",
  };
}

export default async function PerformancePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", projectId)
    .single();

  if (!project) notFound();

  // Get all test cases (frontend performance type) under this project
  const { data: features } = await supabase
    .from("features")
    .select("id")
    .eq("project_id", projectId);

  const featureIds = features?.map((f) => f.id) ?? [];

  const { data: testCases } = featureIds.length
    ? await supabase
        .from("test_cases")
        .select("id, title")
        .in("feature_id", featureIds)
        .eq("test_type", "frontend_performance")
    : { data: [] };

  const testCaseIds = testCases?.map((tc) => tc.id) ?? [];
  const testCaseMap = Object.fromEntries(
    (testCases ?? []).map((tc) => [tc.id, tc.title])
  );

  // Get 30 days of performance history
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: history } = testCaseIds.length
    ? await supabase
        .from("performance_history")
        .select("*")
        .in("test_case_id", testCaseIds)
        .gte("run_date", thirtyDaysAgo.toISOString().split("T")[0])
        .order("run_date", { ascending: true })
    : { data: [] };

  // Group by test case
  const byTestCase: Record<
    string,
    {
      id: string;
      run_date: string;
      performance_score: number | null;
      accessibility_score: number | null;
      lcp_ms: number | null;
      p95_ms: number | null;
    }[]
  > = {};

  for (const row of history ?? []) {
    if (!byTestCase[row.test_case_id]) byTestCase[row.test_case_id] = [];
    byTestCase[row.test_case_id].push(row);
  }

  const hasData = Object.keys(byTestCase).length > 0;

  return (
    <div className="mx-auto max-w-[1400px] p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-(--text-primary)">
          Performance History
        </h1>
        <p className="mt-1 text-sm text-(--text-secondary)">
          30-day Lighthouse score trends for {project.name}
        </p>
      </div>

      {!hasData && (
        <EmptyState
          icon={BarChart2}
          title="No performance data yet"
          description="Run a test case with type 'Frontend Performance' to see Lighthouse scores here."
        />
      )}

      {hasData && (
        <div className="space-y-6">
          {Object.entries(byTestCase).map(([testCaseId, rows]) => {
            const latest = rows[rows.length - 1];
            const previous = rows[rows.length - 2] ?? null;
            const scoreDelta =
              latest.performance_score !== null &&
              previous?.performance_score !== null
                ? (latest.performance_score ?? 0) - (previous?.performance_score ?? 0)
                : null;

            return (
              <Card key={testCaseId}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-4">
                    <span className="truncate text-base">
                      {testCaseMap[testCaseId] ?? "Test case"}
                    </span>
                    <div className="flex items-center gap-3 text-sm">
                      {latest.performance_score !== null && (
                        <ScorePill
                          label="Perf"
                          score={latest.performance_score}
                          delta={scoreDelta}
                        />
                      )}
                      {latest.accessibility_score !== null && (
                        <ScorePill
                          label="A11y"
                          score={latest.accessibility_score}
                        />
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PerformanceTable rows={rows} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ScorePill({
  label,
  score,
  delta,
}: {
  label: string;
  score: number;
  delta?: number | null;
}) {
  const color =
    score >= 90
      ? "text-[#15803D] bg-[#DCFCE7]"
      : score >= 50
        ? "text-[#B45309] bg-[#FEF3C7]"
        : "text-[#B91C1C] bg-[#FEE2E2]";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${color}`}
    >
      {label}: {score}
      {delta !== null && delta !== undefined && (
        <>
          {delta > 0 ? (
            <TrendingUp className="h-3 w-3" aria-label={`+${delta}`} />
          ) : delta < 0 ? (
            <TrendingDown className="h-3 w-3" aria-label={`${delta}`} />
          ) : (
            <Minus className="h-3 w-3" aria-label="no change" />
          )}
        </>
      )}
    </span>
  );
}

function PerformanceTable({
  rows,
}: {
  rows: {
    run_date: string;
    performance_score: number | null;
    accessibility_score: number | null;
    lcp_ms: number | null;
    p95_ms: number | null;
  }[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-(--border) text-left text-(--text-muted)">
            <th className="pb-2 pr-4 font-medium">Date</th>
            <th className="pb-2 pr-4 font-medium tabular-nums">
              Perf score
            </th>
            <th className="pb-2 pr-4 font-medium tabular-nums">
              A11y score
            </th>
            <th className="pb-2 pr-4 font-medium tabular-nums">
              LCP (ms)
            </th>
            <th className="pb-2 font-medium tabular-nums">p95 (ms)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-(--border)">
          {[...rows].reverse().map((row) => (
            <tr key={row.run_date} className="text-(--text-secondary)">
              <td className="py-2 pr-4 font-medium text-(--text-primary)">
                {row.run_date}
              </td>
              <td className="py-2 pr-4 tabular-nums">
                {row.performance_score ?? "—"}
              </td>
              <td className="py-2 pr-4 tabular-nums">
                {row.accessibility_score ?? "—"}
              </td>
              <td className="py-2 pr-4 tabular-nums">
                {row.lcp_ms != null ? row.lcp_ms.toFixed(0) : "—"}
              </td>
              <td className="py-2 tabular-nums">
                {row.p95_ms != null ? row.p95_ms.toFixed(0) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
