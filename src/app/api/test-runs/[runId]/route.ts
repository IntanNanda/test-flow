import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;
  const supabase = await createClient();

  const { data: run, error } = await supabase
    .from("test_runs")
    .select(`*, test_case_runs(*, test_cases(title, priority, scenario_type))`)
    .eq("id", runId)
    .single();

  if (error || !run) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }

  return NextResponse.json({ run });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;
  const supabase = await createClient();

  // Verify worker secret
  const secret = request.headers.get("x-worker-secret");
  if (secret !== process.env.WORKER_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { case_runs, ...runUpdates } = body;

  // Update the top-level run
  const { error: runError } = await supabase
    .from("test_runs")
    .update(runUpdates)
    .eq("id", runId);

  if (runError) {
    return NextResponse.json({ error: runError.message }, { status: 500 });
  }

  // If worker sent per-case results, apply them and sync test_cases status
  if (Array.isArray(case_runs) && case_runs.length > 0) {
    for (const cr of case_runs) {
      const { id: caseRunId, test_case_id, status, ...caseUpdates } = cr;

      if (caseRunId) {
        const { error: caseRunErr } = await supabase
          .from("test_case_runs")
          .update({ status, ...caseUpdates })
          .eq("id", caseRunId)
          .eq("test_run_id", runId);

        if (caseRunErr) {
          return NextResponse.json(
            { error: "Failed to update case run", details: caseRunErr.message },
            { status: 500 }
          );
        }
      }

      if (test_case_id && status) {
        const { error: caseStatusErr } = await supabase
          .from("test_cases")
          .update({
            last_run_at: new Date().toISOString(),
            last_run_status: status,
          })
          .eq("id", test_case_id);

        if (caseStatusErr) {
          return NextResponse.json(
            { error: "Failed to update test case status", details: caseStatusErr.message },
            { status: 500 }
          );
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}
