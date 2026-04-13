import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CaseRunStatusSelect } from "../CaseRunStatusSelect";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  ChevronDown,
  AlertTriangle,
  Image as ImageIcon,
  Terminal,
} from "lucide-react";
import { formatDuration, formatRelativeTime } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ projectId: string; runId: string }>;
}) {
  const { runId } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("test_runs")
    .select("name, id")
    .eq("id", runId)
    .single();
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
    ? await supabase
        .from("test_cases")
        .select("id, title")
        .in("id", testCaseIds)
    : { data: [] };

  const testCaseMap = Object.fromEntries(
    (testCases ?? []).map((tc) => [tc.id, tc.title])
  );

  const passRate =
    run.total_cases > 0
      ? ((run.passed / run.total_cases) * 100).toFixed(1)
      : null;

  return (
    <div className="mx-auto max-w-350 p-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-(--text-muted)">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href={`/projects/${projectId}`} className="hover:text-(--text-primary)">
              Project
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={`/projects/${projectId}/runs`} className="hover:text-(--text-primary)">
              Runs
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-(--text-secondary)" aria-current="page">
            {run.name ?? `Run #${run.id.slice(0, 8)}`}
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <StatusBadge status={run.status} />
            <h1 className="text-2xl font-semibold text-(--text-primary)">
              {run.name ?? `Run #${run.id.slice(0, 8)}`}
            </h1>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-(--text-muted)">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" aria-hidden="true" />
              {formatRelativeTime(run.created_at)}
            </span>
            <span className="capitalize">{run.trigger_type} trigger</span>
            <span>{run.environment}</span>
            {run.duration_ms != null && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" aria-hidden="true" />
                {formatDuration(run.duration_ms)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total cases" value={run.total_cases} />
        <StatCard label="Passed" value={run.passed} valueColor="text-[#15803D]" />
        <StatCard label="Failed" value={run.failed} valueColor="text-[#B91C1C]" />
        <StatCard
          label="Pass rate"
          value={passRate !== null ? `${passRate}%` : "—"}
          valueColor={
            passRate !== null
              ? parseFloat(passRate) >= 80 ? "text-[#15803D]" : "text-[#B91C1C]"
              : undefined
          }
        />
      </div>

      {/* Case runs */}
      <Card>
        <CardHeader>
          <CardTitle>Test case results</CardTitle>
        </CardHeader>
        <CardContent>
          {caseRuns && caseRuns.length > 0 ? (
            <div className="divide-y divide-(--border)">
              {caseRuns.map((cr) => (
                <CaseRunRow
                  key={cr.id}
                  caseRun={cr}
                  projectId={projectId}
                  runId={runId}
                  testCaseTitle={testCaseMap[cr.test_case_id] ?? "Unknown test case"}
                />
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-(--text-muted)">
              No case results yet. The run may still be in progress.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string | number;
  valueColor?: string;
}) {
  return (
    <div className="rounded-lg border border-(--border) bg-(--surface) p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-(--text-muted)">
        {label}
      </p>
      <p className={`mt-1.5 text-2xl font-semibold tabular-nums ${valueColor ?? "text-(--text-primary)"}`}>
        {value}
      </p>
    </div>
  );
}

function CaseRunRow({
  caseRun,
  projectId,
  runId,
  testCaseTitle,
}: {
  caseRun: {
    id: string;
    status: string;
    duration_ms: number | null;
    error_message: string | null;
    error_stack: string | null;
    screenshot_urls: string[];
    console_log: string | null;
    step_results: unknown;
  };
  projectId: string;
  runId: string;
  testCaseTitle: string;
}) {
  const isPassed = caseRun.status === "passed";
  const isFailed = caseRun.status === "failed" || caseRun.status === "error";

  return (
    <details className="group py-3">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 pr-1">
        <div className="flex min-w-0 items-center gap-3">
          {isPassed ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#15803D]" aria-hidden="true" />
          ) : isFailed ? (
            <XCircle className="h-4 w-4 shrink-0 text-[#B91C1C]" aria-hidden="true" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0 text-[#B45309]" aria-hidden="true" />
          )}
          <span className="truncate text-sm font-medium text-(--text-primary)">
            {testCaseTitle}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-3 text-xs tabular-nums text-(--text-muted)">
          <CaseRunStatusSelect
            caseRunId={caseRun.id}
            runId={runId}
            projectId={projectId}
            currentStatus={caseRun.status}
          />
          {caseRun.duration_ms != null && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {formatDuration(caseRun.duration_ms)}
            </span>
          )}
          {caseRun.screenshot_urls.length > 0 && (
            <span className="flex items-center gap-1" title={`${caseRun.screenshot_urls.length} screenshot(s)`}>
              <ImageIcon className="h-3 w-3" aria-hidden="true" />
              {caseRun.screenshot_urls.length}
            </span>
          )}
          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
        </div>
      </summary>

      <div className="mt-3 space-y-3 pl-7">
        {caseRun.error_message && (
          <div className="rounded-md border border-fail-bg bg-[#FEF2F2] p-3 dark:border-fail-text/40 dark:bg-fail-text/10">
            <p className="mb-1 text-xs font-semibold text-[#B91C1C]">Error</p>
            <p className="whitespace-pre-wrap font-mono text-xs text-[#B91C1C]">
              {caseRun.error_message}
            </p>
            {caseRun.error_stack && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-[#B91C1C]/70 hover:text-[#B91C1C]">
                  Stack trace
                </summary>
                <pre className="mt-1 overflow-x-auto whitespace-pre-wrap font-mono text-xs text-[#B91C1C]/80">
                  {caseRun.error_stack}
                </pre>
              </details>
            )}
          </div>
        )}

        {caseRun.screenshot_urls.length > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-(--text-secondary)">
              <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
              Screenshots
            </p>
            <div className="flex flex-wrap gap-2">
              {caseRun.screenshot_urls.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block overflow-hidden rounded border border-(--border) hover:border-[#1E40AF]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Screenshot ${i + 1}`} className="h-24 w-32 object-cover" />
                </a>
              ))}
            </div>
          </div>
        )}

        {caseRun.console_log && (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-(--text-secondary)">
              <Terminal className="h-3.5 w-3.5" aria-hidden="true" />
              Console log
            </p>
            <pre className="max-h-48 overflow-y-auto rounded-md bg-[#0C0A09] p-3 font-mono text-xs text-[#A8A29E]">
              {caseRun.console_log}
            </pre>
          </div>
        )}

        {isPassed && !caseRun.error_message && caseRun.screenshot_urls.length === 0 && !caseRun.console_log && (
          <p className="text-xs text-(--text-muted)">
            Test passed with no captured artifacts.
          </p>
        )}
      </div>
    </details>
  );
}
