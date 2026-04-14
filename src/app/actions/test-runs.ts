"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateTestRunName(
  runId: string,
  projectId: string,
  name: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("test_runs")
    .update({ name: name.trim() || null })
    .eq("id", runId)
    .eq("project_id", projectId);
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}/runs/${runId}`);
  return {};
}

export async function cancelTestRun(runId: string, projectId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("test_runs")
    .update({ status: "cancelled", completed_at: new Date().toISOString() })
    .eq("id", runId)
    .eq("project_id", projectId);

  if (error) return { error: error.message };

  // Mark any still-pending/running case runs as skipped
  await supabase
    .from("test_case_runs")
    .update({ status: "skipped" })
    .eq("test_run_id", runId)
    .in("status", ["pending", "running"]);

  revalidatePath(`/projects/${projectId}/runs`);
  revalidatePath(`/projects/${projectId}/runs/${runId}`);
  return { success: true };
}

export async function deleteTestRun(runId: string, projectId: string) {
  const supabase = await createClient();

  // test_case_runs cascade deletes via FK
  const { error } = await supabase
    .from("test_runs")
    .delete()
    .eq("id", runId)
    .eq("project_id", projectId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}/runs`);
  return { success: true };
}

export async function addCasesToRun(
  runId: string,
  projectId: string,
  testCaseIds: string[]
): Promise<{ error?: string }> {
  const supabase = await createClient();

  // Avoid duplicates — fetch already-included case IDs
  const { data: existing } = await supabase
    .from("test_case_runs")
    .select("test_case_id")
    .eq("test_run_id", runId);

  const existingIds = new Set((existing ?? []).map((r) => r.test_case_id));
  const newIds = testCaseIds.filter((id) => !existingIds.has(id));
  if (!newIds.length) return {};

  const { error } = await supabase.from("test_case_runs").insert(
    newIds.map((id) => ({ test_run_id: runId, test_case_id: id, status: "pending" as const }))
  );
  if (error) return { error: error.message };

  await supabase
    .from("test_runs")
    .update({ total_cases: (existing?.length ?? 0) + newIds.length })
    .eq("id", runId);

  revalidatePath(`/projects/${projectId}/runs/${runId}`);
  return {};
}

export async function removeCaseFromRun(
  runId: string,
  projectId: string,
  testCaseId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("test_case_runs")
    .delete()
    .eq("test_run_id", runId)
    .eq("test_case_id", testCaseId);

  if (error) return { error: error.message };

  // Recalculate total_cases
  const { count } = await supabase
    .from("test_case_runs")
    .select("*", { count: "exact", head: true })
    .eq("test_run_id", runId);

  await supabase
    .from("test_runs")
    .update({ total_cases: count ?? 0 })
    .eq("id", runId);

  revalidatePath(`/projects/${projectId}/runs/${runId}`);
  return {};
}

export async function rerunTestRun(
  runId: string,
  projectId: string
): Promise<{ runId?: string; error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Get original case run test_case_ids
  const { data: caseRuns, error: fetchError } = await supabase
    .from("test_case_runs")
    .select("test_case_id")
    .eq("test_run_id", runId);

  if (fetchError || !caseRuns?.length) return { error: "No test cases found for this run" };

  const { data: originalRun } = await supabase
    .from("test_runs")
    .select("name, environment, base_url_override")
    .eq("id", runId)
    .single();

  const testCaseIds = caseRuns.map((cr) => cr.test_case_id);

  const { data: newRun, error: createError } = await supabase
    .from("test_runs")
    .insert({
      project_id: projectId,
      name: originalRun?.name ? `${originalRun.name} (re-run)` : null,
      status: "pending",
      trigger_type: "manual",
      triggered_by: user.id,
      environment: originalRun?.environment ?? "production",
      base_url_override: originalRun?.base_url_override ?? null,
      total_cases: testCaseIds.length,
      passed: 0,
      failed: 0,
      skipped: 0,
      errored: 0,
      metadata: { test_case_ids: testCaseIds, rerun_of: runId },
    })
    .select()
    .single();

  if (createError || !newRun) return { error: createError?.message ?? "Failed to create run" };

  await supabase.from("test_case_runs").insert(
    testCaseIds.map((id) => ({
      test_run_id: newRun.id,
      test_case_id: id,
      status: "pending" as const,
    }))
  );

  await supabase
    .from("test_cases")
    .update({ last_run_at: new Date().toISOString(), last_run_status: "pending" })
    .in("id", testCaseIds);

  revalidatePath(`/projects/${projectId}/runs`);
  return { runId: newRun.id };
}
