import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { RunStatus } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Play, Clock, CheckCircle2, XCircle, Calendar } from "lucide-react";
import { NewRunButton } from "./NewRunButton";
import { RunActions } from "./RunActions";
import { formatDuration, formatRelativeTime } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("projects").select("name").eq("id", projectId).single();
  return { title: data ? `Runs — ${data.name} — TestFlow` : "Runs — TestFlow" };
}



export default async function RunsPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { projectId } = await params;
  const { status: statusFilter, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const pageSize = 20;

  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", projectId)
    .single();

  if (!project) notFound();

  let query = supabase
    .from("test_runs")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  // Map display filter values to actual DB status values (some group multiple statuses)
  const STATUS_MAP: Record<string, RunStatus[]> = {
    passed:    ["passed"],
    failed:    ["failed", "error"],
    running:   ["running", "queued"],
    pending:   ["pending"],
    cancelled: ["cancelled"],
  };

  if (statusFilter && statusFilter !== "all" && STATUS_MAP[statusFilter]) {
    const dbStatuses = STATUS_MAP[statusFilter];
    if (dbStatuses.length === 1) {
      query = query.eq("status", dbStatuses[0]);
    } else {
      query = query.in("status", dbStatuses);
    }
  }

  const [{ data: runs }, { data: featuresRaw }, { data: allRuns }] = await Promise.all([
    query,
    supabase
      .from("features")
      .select("id, name, test_cases(id, title, scenario_type, priority)")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true }),
    supabase
      .from("test_runs")
      .select("status")
      .eq("project_id", projectId),
  ]);

  const counts = {
    total:     allRuns?.length ?? 0,
    passed:    allRuns?.filter((r) => r.status === "passed").length ?? 0,
    failed:    allRuns?.filter((r) => r.status === "failed" || r.status === "error").length ?? 0,
    running:   allRuns?.filter((r) => r.status === "running" || r.status === "queued").length ?? 0,
    pending:   allRuns?.filter((r) => r.status === "pending").length ?? 0,
    cancelled: allRuns?.filter((r) => r.status === "cancelled").length ?? 0,
  };

  const features = (featuresRaw ?? []).map((f) => ({
    ...f,
    test_cases: Array.isArray(f.test_cases) ? f.test_cases : [],
  }));

  return (
    <div className="min-h-screen bg-[#EEF2F7]">
      <div className="mx-auto max-w-350 px-6 py-6">

        {/* Page header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[#0A1B3D]">Run History</h1>
            <p className="mt-0.5 text-sm text-[#6B7A99]">All test runs for {project.name}</p>
          </div>
          <NewRunButton projectId={projectId} features={features} />
        </div>

        {/* Status overview cards — also act as filters */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "Total",     value: counts.total,     filter: "",           colorClass: "text-[#0A1B3D]" },
            { label: "Passed",    value: counts.passed,    filter: "passed",     colorClass: "text-[#0D9488]" },
            { label: "Failed",    value: counts.failed,    filter: "failed",     colorClass: "text-[#FF8A7A]" },
            { label: "Running",   value: counts.running,   filter: "running",    colorClass: "text-[#2B6CFF]" },
            { label: "Pending",   value: counts.pending,   filter: "pending",    colorClass: "text-[#854D0E]" },
            { label: "Cancelled", value: counts.cancelled, filter: "cancelled",  colorClass: "text-[#6B7A99]" },
          ].map(({ label, value, filter, colorClass }) => {
            const isActive = (statusFilter ?? "") === filter;
            const href = filter === "" ? `/projects/${projectId}/runs` : `/projects/${projectId}/runs?status=${filter}`;
            return (
              <Link
                key={label}
                href={href}
                className={`flex flex-col gap-1 rounded-xl border px-5 py-4 shadow-sm transition-all ${
                  isActive
                    ? "border-[#2B6CFF] bg-[#E8F0FF] ring-1 ring-[#2B6CFF]"
                    : "border-[#E2E8F0] bg-white hover:border-[#2B6CFF] hover:bg-[#F5F8FF]"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <span className={`text-2xl font-bold ${colorClass}`}>{value}</span>
                <span className="text-xs font-medium text-[#6B7A99]">{label}</span>
              </Link>
            );
          })}
        </div>

        {/* Run list */}
        {runs && runs.length > 0 ? (
          <div className="space-y-2">
            {runs.map((run) => (
              <div key={run.id} className="group flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E2E8F0] bg-white px-5 py-4 shadow-sm transition-all hover:border-[#2B6CFF] hover:shadow-md">
                {/* Left: status + name + meta — clickable */}
                <Link href={`/projects/${projectId}/runs/${run.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <StatusBadge status={run.status} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#0A1B3D] transition-colors group-hover:text-[#2B6CFF]">
                      {run.name ?? `Run #${run.id.slice(0, 8)}`}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-[#6B7A99]">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" aria-hidden="true" />
                        {formatRelativeTime(run.created_at)}
                      </span>
                      <span className="capitalize">{run.trigger_type}</span>
                      <span>{run.environment}</span>
                    </div>
                  </div>
                </Link>

                {/* Right: counts + duration + actions */}
                <div className="flex items-center gap-4 text-xs tabular-nums">
                  <span className="flex items-center gap-1 text-[#0D9488]">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    {run.passed ?? 0} passed
                  </span>
                  <span className="flex items-center gap-1 text-[#FF8A7A]">
                    <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    {run.failed ?? 0} failed
                  </span>
                  {run.duration_ms != null && (
                    <span className="flex items-center gap-1 text-[#6B7A99]">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      {formatDuration(run.duration_ms)}
                    </span>
                  )}
                  <span className="text-[#6B7A99]">
                    {run.total_cases} case{run.total_cases !== 1 ? "s" : ""}
                  </span>
                  <div className="ml-2 border-l border-[#E2E8F0] pl-2">
                    <RunActions runId={run.id} projectId={projectId} status={run.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
            <EmptyState
              icon={Play}
              title="No runs yet"
              description="Create a test run to start executing your test cases. You can pick specific features and cases to include."
              action={{ label: "New test run" }}
            />
          </div>
        )}

        {/* Load more */}
        {runs && runs.length === pageSize && (
          <div className="mt-6 flex justify-center">
            <Link href={`/projects/${projectId}/runs?page=${page + 1}${statusFilter ? `&status=${statusFilter}` : ""}`}>
              <Button variant="secondary">Load more</Button>
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
