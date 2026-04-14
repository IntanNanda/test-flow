import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { Zap, Globe, ChevronRight, TrendingUp, TrendingDown, Minus, Info } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("projects").select("name").eq("id", projectId).single();
  return { title: data ? `Performance — ${data.name} — TestFlow` : "Performance — TestFlow" };
}

// API grading thresholds (ms)
function apiGrade(p95: number): { label: string; color: string; bg: string } {
  if (p95 <= 200)  return { label: "Excellent", color: "text-[#0D9488]", bg: "bg-[#CCFBF1]" };
  if (p95 <= 500)  return { label: "Good",      color: "text-[#2B6CFF]", bg: "bg-[#E8F0FF]" };
  if (p95 <= 1000) return { label: "Fair",       color: "text-[#854D0E]", bg: "bg-[#FEF3C7]" };
  return               { label: "Slow",       color: "text-[#B91C1C]", bg: "bg-[#FEE2E2]" };
}

// Lighthouse score grading
function lhGrade(score: number): { color: string; bg: string } {
  if (score >= 90) return { color: "text-[#0D9488]", bg: "bg-[#CCFBF1]" };
  if (score >= 50) return { color: "text-[#854D0E]", bg: "bg-[#FEF3C7]" };
  return               { color: "text-[#B91C1C]", bg: "bg-[#FEE2E2]" };
}

type HistoryRow = {
  id: string;
  test_case_id: string;
  run_date: string;
  performance_score: number | null;
  accessibility_score: number | null;
  lcp_ms: number | null;
  cls: number | null;
  fcp_ms: number | null;
  p95_ms: number | null;
  error_rate: number | null;
};

export default async function PerformancePage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { projectId } = await params;
  const { tab } = await searchParams;
  const activeTab = tab === "frontend" ? "frontend" : "api";
  const supabase = await createClient();

  const { data: project } = await supabase.from("projects").select("id, name").eq("id", projectId).single();
  if (!project) notFound();

  // Features for this project
  const { data: features } = await supabase
    .from("features")
    .select("id, name")
    .eq("project_id", projectId);

  const featureIds = features?.map((f) => f.id) ?? [];
  const featureNameMap = Object.fromEntries((features ?? []).map((f) => [f.id, f.name]));

  // All performance test cases
  const { data: allPerfCasesRaw } = featureIds.length
    ? await supabase
        .from("test_cases")
        .select("id, title, feature_id, test_type, last_run_at")
        .in("feature_id", featureIds)
        .in("test_type", ["api_performance", "frontend_performance"])
    : { data: [] };

  const allPerfCases = allPerfCasesRaw ?? [];
  const apiCases = allPerfCases.filter((tc) => tc.test_type === "api_performance");
  const feCases  = allPerfCases.filter((tc) => tc.test_type === "frontend_performance");
  const allPerfCaseIds = allPerfCases.map((tc) => tc.id);

  // performance_history — single source of truth for both types (30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const history: HistoryRow[] = allPerfCaseIds.length
    ? ((await supabase
        .from("performance_history")
        .select("id, test_case_id, run_date, performance_score, accessibility_score, lcp_ms, cls, fcp_ms, p95_ms, error_rate")
        .in("test_case_id", allPerfCaseIds)
        .gte("run_date", thirtyDaysAgo.toISOString().split("T")[0])
        .order("run_date", { ascending: true })
      ).data ?? []) as HistoryRow[]
    : [];

  // Group history rows by test_case_id (oldest → newest)
  const historyByCase: Record<string, HistoryRow[]> = {};
  for (const row of history) {
    if (!historyByCase[row.test_case_id]) historyByCase[row.test_case_id] = [];
    historyByCase[row.test_case_id].push(row);
  }

  // Lighthouse configs for FE cases (for device/throttling display)
  const feCaseIds = feCases.map((tc) => tc.id);
  const lhConfigs = feCaseIds.length
    ? ((await supabase
        .from("lighthouse_configs")
        .select("test_case_id, url, device, throttling")
        .in("test_case_id", feCaseIds)
      ).data ?? [])
    : [];
  const lhConfigByCase = Object.fromEntries(lhConfigs.map((c) => [c.test_case_id, c]));

  return (
    <div className="min-h-screen bg-[#EEF2F7]">
      <div className="mx-auto max-w-350 px-6 py-6">

        {/* Breadcrumb */}
        <nav className="mb-3 flex items-center gap-1.5 text-sm">
          <Link href="/projects" className="text-[#6B7A99] transition-colors hover:text-[#2B6CFF]">Projects</Link>
          <ChevronRight className="h-3.5 w-3.5 text-[#B0BAD0]" aria-hidden="true" />
          <Link href={`/projects/${projectId}`} className="text-[#6B7A99] transition-colors hover:text-[#2B6CFF]">{project.name}</Link>
          <ChevronRight className="h-3.5 w-3.5 text-[#B0BAD0]" aria-hidden="true" />
          <span className="font-semibold text-[#0A1B3D]">Performance</span>
        </nav>

        {/* Single card: header + tabs + content */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">

          {/* Card header */}
          <div className="px-6 py-5">
            <h1 className="text-lg font-semibold text-[#0A1B3D]">Performance</h1>
            <p className="mt-0.5 text-sm text-[#6B7A99]">
              Response times and Lighthouse scores for {project.name}
            </p>
          </div>

          {/* Tabs */}
          <div className="-mb-px flex border-t border-[#F0F4FA] px-2">
            <Link
              href={`/projects/${projectId}/performance?tab=api`}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "api"
                  ? "border-[#2B6CFF] text-[#2B6CFF]"
                  : "border-transparent text-[#6B7A99] hover:text-[#0A1B3D]"
              }`}
            >
              <Zap className="h-4 w-4" aria-hidden="true" />
              API Performance
            </Link>
            <Link
              href={`/projects/${projectId}/performance?tab=frontend`}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "frontend"
                  ? "border-[#2B6CFF] text-[#2B6CFF]"
                  : "border-transparent text-[#6B7A99] hover:text-[#0A1B3D]"
              }`}
            >
              <Globe className="h-4 w-4" aria-hidden="true" />
              Frontend Performance
            </Link>
          </div>

          {/* Tab content */}
          <div className="border-t border-[#F0F4FA] p-6">

            {/* ── API tab ── */}
            {activeTab === "api" && (
              <>
                {apiCases.length === 0 ? (
                  <EmptyState
                    icon={Zap}
                    title="No API performance test cases"
                    description="Create a test case with type 'API Performance' to track endpoint response times here."
                  />
                ) : (
                  <div className="space-y-3">
                    {/* Grading legend */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-[#6B7A99]">Response time (p95):</span>
                      {[
                        { label: "Excellent", sub: "≤200ms", color: "text-[#0D9488]", bg: "bg-[#CCFBF1]" },
                        { label: "Good",      sub: "≤500ms", color: "text-[#2B6CFF]", bg: "bg-[#E8F0FF]" },
                        { label: "Fair",      sub: "≤1s",    color: "text-[#854D0E]", bg: "bg-[#FEF3C7]" },
                        { label: "Slow",      sub: ">1s",    color: "text-[#B91C1C]", bg: "bg-[#FEE2E2]" },
                      ].map((g) => (
                        <span key={g.label} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-semibold ${g.color} ${g.bg}`}>
                          {g.label} <span className="opacity-70">{g.sub}</span>
                        </span>
                      ))}
                    </div>

                    {apiCases.map((tc) => {
                      const rows = historyByCase[tc.id] ?? [];
                      const latest = rows[rows.length - 1] ?? null;
                      const prev   = rows[rows.length - 2] ?? null;
                      const p95s   = rows.map((r) => r.p95_ms).filter((v): v is number => v !== null);
                      const avgP95 = p95s.length ? p95s.reduce((a, b) => a + b, 0) / p95s.length : null;
                      const delta  = latest?.p95_ms != null && prev?.p95_ms != null
                        ? latest.p95_ms - prev.p95_ms : null;
                      const grade  = latest?.p95_ms != null ? apiGrade(latest.p95_ms) : null;

                      return (
                        <div key={tc.id} className="rounded-xl border border-[#E2E8F0]">
                          {/* Header row */}
                          <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E8F0FF]">
                                <Zap className="h-4 w-4 text-[#2B6CFF]" aria-hidden="true" />
                              </div>
                              <div className="min-w-0">
                                <Link
                                  href={`/projects/${projectId}/features/${tc.feature_id}/test-cases/${tc.id}`}
                                  className="truncate text-sm font-semibold text-[#0A1B3D] hover:text-[#2B6CFF]"
                                >
                                  {tc.title}
                                </Link>
                                <p className="text-xs text-[#6B7A99]">{featureNameMap[tc.feature_id] ?? ""}</p>
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-5">
                              {grade && latest?.p95_ms != null && (
                                <div className="text-right">
                                  <p className="text-xs text-[#6B7A99]">p95</p>
                                  <div className="flex items-center justify-end gap-1.5">
                                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${grade.color} ${grade.bg}`}>
                                      {latest.p95_ms < 1000
                                        ? `${Math.round(latest.p95_ms)}ms`
                                        : `${(latest.p95_ms / 1000).toFixed(2)}s`}
                                    </span>
                                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${grade.color} ${grade.bg}`}>
                                      {grade.label}
                                    </span>
                                    {delta !== null && (
                                      delta > 0 ? <TrendingUp   className="h-3.5 w-3.5 text-[#FF8A7A]" /> :
                                      delta < 0 ? <TrendingDown className="h-3.5 w-3.5 text-[#0D9488]" /> :
                                                  <Minus        className="h-3.5 w-3.5 text-[#B0BAD0]" />
                                    )}
                                  </div>
                                </div>
                              )}
                              {avgP95 !== null && (
                                <div className="text-right">
                                  <p className="text-xs text-[#6B7A99]">Avg p95</p>
                                  <p className="text-sm font-semibold tabular-nums text-[#0A1B3D]">
                                    {avgP95 < 1000 ? `${Math.round(avgP95)}ms` : `${(avgP95 / 1000).toFixed(2)}s`}
                                  </p>
                                </div>
                              )}
                              {latest?.error_rate != null && (
                                <div className="text-right">
                                  <p className="text-xs text-[#6B7A99]">Error rate</p>
                                  <p className={`text-sm font-semibold tabular-nums ${latest.error_rate > 0.05 ? "text-[#B91C1C]" : "text-[#0D9488]"}`}>
                                    {(latest.error_rate * 100).toFixed(1)}%
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 30-day history table */}
                          {rows.length > 0 ? (
                            <div className="border-t border-[#F0F4FA] px-5 pb-4 pt-3">
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6B7A99]">30-day history</p>
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="border-b border-[#F0F4FA] text-left">
                                      <th className="pb-2 pr-4 font-semibold text-[#6B7A99]">Date</th>
                                      <th className="pb-2 pr-4 font-semibold text-[#6B7A99]">p95</th>
                                      <th className="pb-2 pr-4 font-semibold text-[#6B7A99]">Grade</th>
                                      <th className="pb-2 font-semibold text-[#6B7A99]">Error rate</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[#F0F4FA]">
                                    {[...rows].reverse().map((row) => {
                                      const g = row.p95_ms != null ? apiGrade(row.p95_ms) : null;
                                      return (
                                        <tr key={row.id} className="hover:bg-[#F5F8FF]">
                                          <td className="py-2 pr-4 font-medium text-[#0A1B3D]">{row.run_date}</td>
                                          <td className="py-2 pr-4 tabular-nums text-[#0A1B3D]">
                                            {row.p95_ms != null
                                              ? row.p95_ms < 1000
                                                ? `${Math.round(row.p95_ms)}ms`
                                                : `${(row.p95_ms / 1000).toFixed(2)}s`
                                              : "—"}
                                          </td>
                                          <td className="py-2 pr-4">
                                            {g ? (
                                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${g.color} ${g.bg}`}>
                                                {g.label}
                                              </span>
                                            ) : "—"}
                                          </td>
                                          <td className="py-2 tabular-nums">
                                            {row.error_rate != null ? (
                                              <span className={row.error_rate > 0.05 ? "text-[#B91C1C]" : "text-[#0D9488]"}>
                                                {(row.error_rate * 100).toFixed(1)}%
                                              </span>
                                            ) : "—"}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ) : (
                            <div className="border-t border-[#F0F4FA] px-5 py-4 text-xs text-[#6B7A99]">
                              No data yet. Run this test case to see API response time history.
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* ── Frontend tab ── */}
            {activeTab === "frontend" && (
              <>
                {feCases.length === 0 ? (
                  <EmptyState
                    icon={Globe}
                    title="No frontend performance test cases"
                    description="Create a test case with type 'Frontend Performance (Lighthouse)' to track page scores here."
                  />
                ) : (
                  <>
                    <div className="mb-4 flex items-start gap-2 rounded-xl border border-[#E2E8F0] bg-[#F5F8FF] px-4 py-3 text-xs text-[#6B7A99]">
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#B0BAD0]" aria-hidden="true" />
                      <span>
                        Results are consistent across machines — Lighthouse applies{" "}
                        <strong className="text-[#0A1B3D]">simulated throttling</strong> (fixed CPU &amp; network multiplier in software), independent of your actual hardware or internet speed.
                      </span>
                    </div>

                    <div className="space-y-3">
                      {feCases.map((tc) => {
                        const rows   = historyByCase[tc.id] ?? [];
                        const latest = rows[rows.length - 1] ?? null;
                        const prev   = rows[rows.length - 2] ?? null;
                        const config = lhConfigByCase[tc.id];

                        const perfDelta =
                          latest?.performance_score != null && prev?.performance_score != null
                            ? latest.performance_score - prev.performance_score : null;

                        return (
                          <div key={tc.id} className="rounded-xl border border-[#E2E8F0]">
                            {/* Header row */}
                            <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E8F0FF]">
                                  <Globe className="h-4 w-4 text-[#2B6CFF]" aria-hidden="true" />
                                </div>
                                <div className="min-w-0">
                                  <Link
                                    href={`/projects/${projectId}/features/${tc.feature_id}/test-cases/${tc.id}`}
                                    className="truncate text-sm font-semibold text-[#0A1B3D] hover:text-[#2B6CFF]"
                                  >
                                    {tc.title}
                                  </Link>
                                  <div className="flex items-center gap-2 text-xs text-[#6B7A99]">
                                    <span>{featureNameMap[tc.feature_id] ?? ""}</span>
                                    {config && (
                                      <>
                                        <span>·</span>
                                        <span className="capitalize">{config.device}</span>
                                        <span>·</span>
                                        <span>{config.throttling === "simulated" ? "Simulated throttle" : config.throttling}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {latest ? (
                                <div className="flex items-center gap-3">
                                  <LhScorePill label="Perf"           score={latest.performance_score}   delta={perfDelta} />
                                  <LhScorePill label="A11y"           score={latest.accessibility_score} />
                                </div>
                              ) : (
                                <span className="text-xs text-[#6B7A99]">No data yet</span>
                              )}
                            </div>

                            {/* Web vitals row */}
                            {latest && (
                              <div className="flex flex-wrap gap-6 border-t border-[#F0F4FA] px-5 py-3">
                                <WebVital label="LCP"
                                  value={latest.lcp_ms != null ? formatMs(latest.lcp_ms) : null}
                                  good={latest.lcp_ms != null ? latest.lcp_ms <= 2500 : null}
                                  warn={latest.lcp_ms != null ? latest.lcp_ms <= 4000 : null} />
                                <WebVital label="FCP"
                                  value={latest.fcp_ms != null ? formatMs(latest.fcp_ms) : null}
                                  good={latest.fcp_ms != null ? latest.fcp_ms <= 1800 : null}
                                  warn={latest.fcp_ms != null ? latest.fcp_ms <= 3000 : null} />
                                <WebVital label="CLS"
                                  value={latest.cls != null ? latest.cls.toFixed(3) : null}
                                  good={latest.cls != null ? latest.cls <= 0.1 : null}
                                  warn={latest.cls != null ? latest.cls <= 0.25 : null} />
                                {tc.last_run_at && (
                                  <div className="ml-auto self-center text-xs text-[#6B7A99]">
                                    Last run {new Date(tc.last_run_at).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* 30-day history table */}
                            {rows.length > 0 ? (
                              <div className="border-t border-[#F0F4FA] px-5 pb-4 pt-3">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6B7A99]">30-day history</p>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="border-b border-[#F0F4FA] text-left">
                                        <th className="pb-2 pr-4 font-semibold text-[#6B7A99]">Date</th>
                                        <th className="pb-2 pr-4 font-semibold text-[#6B7A99]">Perf</th>
                                        <th className="pb-2 pr-4 font-semibold text-[#6B7A99]">A11y</th>
                                        <th className="pb-2 pr-4 font-semibold text-[#6B7A99]">LCP</th>
                                        <th className="pb-2 font-semibold text-[#6B7A99]">CLS</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#F0F4FA]">
                                      {[...rows].reverse().map((row) => {
                                        const pg = row.performance_score != null ? lhGrade(row.performance_score) : null;
                                        const ag = row.accessibility_score != null ? lhGrade(row.accessibility_score) : null;
                                        return (
                                          <tr key={row.id} className="hover:bg-[#F5F8FF]">
                                            <td className="py-2 pr-4 font-medium text-[#0A1B3D]">{row.run_date}</td>
                                            <td className="py-2 pr-4">
                                              {pg && row.performance_score != null ? (
                                                <span className={`font-bold tabular-nums ${pg.color}`}>{row.performance_score}</span>
                                              ) : "—"}
                                            </td>
                                            <td className="py-2 pr-4">
                                              {ag && row.accessibility_score != null ? (
                                                <span className={`font-bold tabular-nums ${ag.color}`}>{row.accessibility_score}</span>
                                              ) : "—"}
                                            </td>
                                            <td className="py-2 pr-4 tabular-nums text-[#6B7A99]">
                                              {row.lcp_ms != null ? formatMs(row.lcp_ms) : "—"}
                                            </td>
                                            <td className="py-2 tabular-nums text-[#6B7A99]">
                                              {row.cls != null ? row.cls.toFixed(3) : "—"}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            ) : (
                              <div className="border-t border-[#F0F4FA] px-5 py-4 text-xs text-[#6B7A99]">
                                No data yet. Run this test case to see Lighthouse scores.
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}

function formatMs(ms: number): string {
  return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(2)}s`;
}

function LhScorePill({
  label,
  score,
  delta,
}: {
  label: string;
  score: number | null | undefined;
  delta?: number | null;
}) {
  if (score == null) return null;
  const { color, bg } = lhGrade(score);
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[10px] text-[#6B7A99]">{label}</span>
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${color} ${bg}`}>
        {score}
        {delta != null && (
          delta > 0 ? <TrendingUp   className="h-3 w-3" /> :
          delta < 0 ? <TrendingDown className="h-3 w-3" /> :
                      <Minus        className="h-3 w-3" />
        )}
      </span>
    </div>
  );
}

function WebVital({
  label,
  value,
  good,
  warn,
}: {
  label: string;
  value: string | null;
  good: boolean | null;
  warn: boolean | null;
}) {
  const color =
    value == null || good == null ? "text-[#0A1B3D]"
    : good  ? "text-[#0D9488]"
    : warn  ? "text-[#854D0E]"
    :         "text-[#B91C1C]";
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7A99]">{label}</p>
      <p className={`text-sm font-semibold tabular-nums ${color}`}>{value ?? "—"}</p>
    </div>
  );
}
