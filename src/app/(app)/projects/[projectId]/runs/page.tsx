import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { RunStatus } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Play,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  User,
} from "lucide-react";
import { formatDuration, formatRelativeTime } from "@/lib/utils";

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

  const validStatuses: RunStatus[] = ["pending", "queued", "running", "passed", "failed", "error", "cancelled"];
  if (statusFilter && statusFilter !== "all" && validStatuses.includes(statusFilter as RunStatus)) {
    query = query.eq("status", statusFilter as RunStatus);
  }

  const { data: runs } = await query;

  const statusOptions = [
    { value: "all", label: "All" },
    { value: "passed", label: "Passed" },
    { value: "failed", label: "Failed" },
    { value: "running", label: "Running" },
    { value: "pending", label: "Pending" },
    { value: "error", label: "Error" },
    { value: "cancelled", label: "Cancelled" },
  ];

  return (
    <div className="mx-auto max-w-[1400px] p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Run History
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            All test runs for {project.name}
          </p>
        </div>
        <TriggerRunButton projectId={projectId} />
      </div>

      {/* Status filter pills */}
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter by status">
        {statusOptions.map((opt) => {
          const isActive =
            (!statusFilter && opt.value === "all") ||
            statusFilter === opt.value;
          return (
            <Link
              key={opt.value}
              href={
                opt.value === "all"
                  ? `/projects/${projectId}/runs`
                  : `/projects/${projectId}/runs?status=${opt.value}`
              }
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-[#1E40AF] text-white"
                  : "bg-[#F5F5F4] text-[var(--text-secondary)] hover:bg-[#E7E5E4] dark:bg-[#292524] dark:hover:bg-[#3C3836]"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              {opt.label}
            </Link>
          );
        })}
      </div>

      {runs && runs.length > 0 ? (
        <div className="space-y-3">
          {runs.map((run) => (
            <Link
              key={run.id}
              href={`/projects/${projectId}/runs/${run.id}`}
            >
              <Card className="group cursor-pointer transition-shadow hover:shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {/* Left: status + name */}
                  <div className="flex min-w-0 items-center gap-3">
                    <StatusBadge status={run.status} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--text-primary)] group-hover:text-[#1E40AF]">
                        {run.name ?? `Run #${run.id.slice(0, 8)}`}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" aria-hidden="true" />
                          {formatRelativeTime(run.created_at)}
                        </span>
                        <span className="capitalize">{run.trigger_type}</span>
                        <span>{run.environment}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: pass/fail counts + duration */}
                  <div className="flex items-center gap-4 text-xs tabular-nums">
                    <span className="flex items-center gap-1 text-[#15803D]">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      {run.passed ?? 0} passed
                    </span>
                    <span className="flex items-center gap-1 text-[#B91C1C]">
                      <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                      {run.failed ?? 0} failed
                    </span>
                    {run.duration_ms != null && (
                      <span className="flex items-center gap-1 text-[var(--text-muted)]">
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        {formatDuration(run.duration_ms)}
                      </span>
                    )}
                    <span className="text-[var(--text-muted)]">
                      {run.total_cases} case{run.total_cases !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Play}
          title="No runs yet"
          description="Trigger a test run to see results here. Runs can be started manually, via schedule, or through the API."
        />
      )}

      {/* Pagination */}
      {runs && runs.length === pageSize && (
        <div className="mt-6 flex justify-center">
          <Link
            href={`/projects/${projectId}/runs?page=${page + 1}${statusFilter ? `&status=${statusFilter}` : ""}`}
          >
            <Button variant="secondary">Load more</Button>
          </Link>
        </div>
      )}
    </div>
  );
}

function TriggerRunButton({ projectId }: { projectId: string }) {
  return (
    <form action={`/api/test-runs`} method="POST">
      <input type="hidden" name="projectId" value={projectId} />
      <Link href={`/projects/${projectId}/runs/trigger`}>
        <Button leftIcon={<Play className="h-4 w-4" />}>Trigger run</Button>
      </Link>
    </form>
  );
}
