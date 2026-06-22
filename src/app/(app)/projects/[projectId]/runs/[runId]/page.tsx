import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Clock, Calendar, ChevronRight, ArrowLeft } from "lucide-react";
import { formatDuration, formatRelativeTime } from "@/lib/utils";
import type { LighthouseResult } from "@/types/database";
import { ManageRunCases } from "./ManageRunCases";
import { CaseRunTable } from "./CaseRunTable";
import { RunHeaderActions } from "./RunHeaderActions";
import { RunNameEdit } from "./RunNameEdit";
import { RunLiveRefresh } from "./RunLiveRefresh";
import type { RunStatus } from "@/types/database";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ projectId: string; runId: string }>;
}) {
  const { runId } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("test_runs").select("name, id").eq("id", runId).single();
  const label = data?.name ?? `Run #${runId.slice(0, 8)}`;
  return { title: `${label} — TestFlow` };
}


export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; runId: string }>;
}) {
  const { projectId, runId } = await params;
  const supabase = await createClient();

  const { data: run } = await supabase
    .from("test_runs")
    .select("*")
    .eq("id", runId)
    .eq("project_id", projectId)
    .single();

  if (!run) notFound();

  const { data: caseRuns } = await supabase
    .from("test_case_runs")
    .select("*")
    .eq("test_run_id", runId)
    .order("created_at", { ascending: true });

  const testCaseIds = caseRuns?.map((cr) => cr.test_case_id) ?? [];
  const { data: testCases } = testCaseIds.length
    ? await supabase.from("test_cases").select("id, title, test_type, feature_id").in("id", testCaseIds)
    : { data: [] };

  // Fetch feature names for test cases
  const featureIds = [...new Set((testCases ?? []).map((tc) => tc.feature_id).filter(Boolean))];
  const { data: featuresForCases } = featureIds.length
    ? await supabase.from("features").select("id, name").in("id", featureIds)
    : { data: [] };
  const featureNameMap = Object.fromEntries((featuresForCases ?? []).map((f) => [f.id, f.name]));

  const testCaseMap = Object.fromEntries(
    (testCases ?? []).map((tc) => [tc.id, {
      title: tc.title,
      test_type: tc.test_type,
      feature_name: featureNameMap[tc.feature_id] ?? undefined,
    }])
  );

  // Fetch lighthouse results
  const caseRunIds = caseRuns?.map((cr) => cr.id) ?? [];
  const { data: lhResults } = caseRunIds.length
    ? await supabase.from("lighthouse_results").select("*").in("case_run_id", caseRunIds)
    : { data: [] };

  const lhMap: Record<string, LighthouseResult[]> = {};
  for (const r of lhResults ?? []) {
    (lhMap[r.case_run_id] ??= []).push(r);
  }

  // Fetch project name for breadcrumb
  const { data: project } = await supabase
    .from("projects")
    .select("name")
    .eq("id", projectId)
    .single();

  // Fetch triggered-by user profile
  const { data: triggeredByProfile } = run.triggered_by
    ? await supabase.from("profiles").select("display_name, email").eq("id", run.triggered_by).single()
    : { data: null };

  // Last updated = most recent case run completed_at, or run's own completed_at
  const lastUpdated = (caseRuns ?? [])
    .map((cr) => cr.completed_at ?? cr.created_at)
    .sort()
    .at(-1) ?? run.completed_at ?? run.created_at;

  // Fetch all features+test cases for the manage modal
  const { data: featuresRaw } = await supabase
    .from("features")
    .select("id, name, test_cases(id, title, scenario_type, priority)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  const features = (featuresRaw ?? []).map((f) => ({
    ...f,
    test_cases: Array.isArray(f.test_cases) ? f.test_cases : [],
  }));

  const total = run.total_cases ?? 0;
  const passed = run.passed ?? 0;
  const failed = run.failed ?? 0;
  const errored = run.errored ?? 0;

  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : null;
  const passRateNum = passRate !== null ? parseFloat(passRate) : null;
  const bugRate = total > 0 ? (((failed + errored) / total) * 100).toFixed(1) : null;
  const bugRateNum = bugRate !== null ? parseFloat(bugRate) : null;

  return (
    <div className="min-h-screen bg-[#EEF2F7]">
      <RunLiveRefresh runId={runId} status={run.status as RunStatus} />
      <div className="mx-auto max-w-350 px-6 py-6">

        {/* Breadcrumb */}
        <nav className="mb-3 flex items-center gap-1.5 text-sm">
          <Link href="/projects" className="text-[#6B7A99] transition-colors hover:text-[#2B6CFF]">Projects</Link>
          <ChevronRight className="h-3.5 w-3.5 text-[#B0BAD0]" aria-hidden="true" />
          <Link href={`/projects/${projectId}`} className="text-[#6B7A99] transition-colors hover:text-[#2B6CFF]">{project?.name ?? "Project"}</Link>
          <ChevronRight className="h-3.5 w-3.5 text-[#B0BAD0]" aria-hidden="true" />
          <Link href={`/projects/${projectId}/runs`} className="text-[#6B7A99] transition-colors hover:text-[#2B6CFF]">Runs</Link>
          <ChevronRight className="h-3.5 w-3.5 text-[#B0BAD0]" aria-hidden="true" />
          <span className="font-semibold text-[#0A1B3D]">{run.name ?? `Run #${run.id.slice(0, 8)}`}</span>
        </nav>

        {/* Header card */}
        <div className="mb-6 rounded-2xl border border-[#E2E8F0] bg-white px-6 py-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            {/* Left: back + name + meta */}
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <Link
                href={`/projects/${projectId}/runs`}
                className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#6B7A99] transition-colors hover:border-[#2B6CFF] hover:text-[#2B6CFF]"
                aria-label="Back to runs"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <RunNameEdit
                  runId={runId}
                  projectId={projectId}
                  name={run.name ?? ""}
                  fallback={`Run #${run.id.slice(0, 8)}`}
                />
                <StatusBadge status={run.status} size="sm" />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-[#6B7A99]">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" aria-hidden="true" />
                  {formatRelativeTime(run.created_at)}
                </span>
                <span className="capitalize">{run.trigger_type} trigger</span>
                <span className="rounded-full bg-[#F5F8FF] px-2 py-0.5 font-medium">{run.environment}</span>
              </div>
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-2">
              <RunHeaderActions
                runId={runId}
                projectId={projectId}
                status={run.status as RunStatus}
              />
              <ManageRunCases
                runId={runId}
                projectId={projectId}
                caseRuns={(caseRuns ?? []).map((cr) => ({ id: cr.id, test_case_id: cr.test_case_id, status: cr.status }))}
                testCaseMap={testCaseMap}
                features={features}
              />
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="mb-6 rounded-2xl border border-[#E2E8F0] bg-white px-6 py-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-8">
            <div>
              <p className="text-xs text-[#6B7A99]">Total cases</p>
              <p className="text-2xl font-bold text-[#0A1B3D] tabular-nums">{total}</p>
            </div>
            <div className="h-8 w-px bg-[#F0F4FA]" />
            <div>
              <p className="text-xs text-[#6B7A99]">Pass rate</p>
              <p className={`text-2xl font-bold tabular-nums ${passRateNum !== null ? passRateNum >= 80 ? "text-[#0D9488]" : "text-[#FF8A7A]" : "text-[#0A1B3D]"}`}>
                {passRate !== null ? `${passRate}%` : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#6B7A99]">Bug rate</p>
              <p className={`text-2xl font-bold tabular-nums ${bugRateNum !== null ? bugRateNum === 0 ? "text-[#0D9488]" : bugRateNum <= 20 ? "text-[#854D0E]" : "text-[#FF8A7A]" : "text-[#0A1B3D]"}`}>
                {bugRate !== null ? `${bugRate}%` : "—"}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-4 text-xs text-[#6B7A99]">
              {run.duration_ms != null && (
                <>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span className="font-medium text-[#0A1B3D]">{formatDuration(run.duration_ms)}</span>
                  </span>
                  <span className="h-3 w-px bg-[#E2E8F0]" />
                </>
              )}
              {triggeredByProfile && (
                <>
                  <span>by <span className="font-medium text-[#0A1B3D]">{triggeredByProfile.display_name ?? triggeredByProfile.email}</span></span>
                  <span className="h-3 w-px bg-[#E2E8F0]" />
                </>
              )}
              {lastUpdated && (
                <span>updated <span className="font-medium text-[#0A1B3D]">{formatRelativeTime(lastUpdated)}</span></span>
              )}
            </div>
          </div>
        </div>

        {/* Case results table with filter */}
        <CaseRunTable
          caseRuns={(caseRuns ?? []).map((cr) => ({
            id: cr.id,
            status: cr.status,
            duration_ms: cr.duration_ms,
            test_case_id: cr.test_case_id,
            error_message: cr.error_message,
            error_stack: cr.error_stack,
            screenshot_urls: cr.screenshot_urls,
            console_log: cr.console_log,
            step_results: cr.step_results,
          }))}
          testCaseMap={testCaseMap}
          lhMap={lhMap}
        />

      </div>
    </div>
  );
}
