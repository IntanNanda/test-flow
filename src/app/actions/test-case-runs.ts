"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { RunStatus } from "@/types/database";

const statusSchema = z.enum([
  "pending",
  "running",
  "passed",
  "failed",
  "error",
  "skipped",
]);

export async function updateCaseRunStatus(
  caseRunId: string,
  runId: string,
  projectId: string,
  newStatus: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const statusResult = statusSchema.safeParse(newStatus);
  if (!statusResult.success) {
    return { error: "Invalid status" };
  }

  const status = statusResult.data;

  // 1. Update the case run
  const { error: updateError } = await supabase
    .from("test_case_runs")
    .update({ status })
    .eq("id", caseRunId)
    .eq("test_run_id", runId);

  if (updateError) {
    return { error: updateError.message };
  }

  // 2. Fetch all case runs for this run
  const { data: caseRuns, error: fetchError } = await supabase
    .from("test_case_runs")
    .select("id, status, test_case_id")
    .eq("test_run_id", runId);

  if (fetchError || !caseRuns) {
    return { error: fetchError?.message ?? "Failed to fetch case runs" };
  }

  // 3. Calculate counters
  const passed = caseRuns.filter((cr) => cr.status === "passed").length;
  const failed = caseRuns.filter(
    (cr) => cr.status === "failed" || cr.status === "error"
  ).length;
  const skipped = caseRuns.filter((cr) => cr.status === "skipped").length;
  const errored = caseRuns.filter((cr) => cr.status === "error").length;
  const finished = caseRuns.filter(
    (cr) => cr.status === "passed" || cr.status === "failed" || cr.status === "error" || cr.status === "skipped"
  ).length;

  // 4. Determine run status
  let runStatus: string;
  if (finished === caseRuns.length) {
    if (failed > 0 || errored > 0) {
      runStatus = "failed";
    } else if (passed > 0) {
      runStatus = "passed";
    } else if (skipped > 0) {
      runStatus = "cancelled";
    } else {
      runStatus = "pending";
    }
  } else {
    runStatus = "running";
  }

  // 5. Update test_runs counters and status
  const { error: runUpdateError } = await supabase
    .from("test_runs")
    .update({
      status: runStatus as RunStatus,
      passed,
      failed,
      skipped,
      errored,
    })
    .eq("id", runId)
    .eq("project_id", projectId);

  if (runUpdateError) {
    return { error: runUpdateError.message };
  }

  // 6. Sync test_cases.last_run_status for the updated case
  const updatedCaseRun = caseRuns.find((cr) => cr.id === caseRunId);

  if (updatedCaseRun?.test_case_id) {
    await supabase
      .from("test_cases")
      .update({
        last_run_at: new Date().toISOString(),
        last_run_status: status,
      })
      .eq("id", updatedCaseRun.test_case_id);
  }

  revalidatePath(`/projects/${projectId}/runs/${runId}`);
  revalidatePath(`/projects/${projectId}/runs`);
  revalidatePath(`/projects/${projectId}/features`);

  return { success: true };
}
