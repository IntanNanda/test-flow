import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  project_id: z.string().uuid(),
  name: z.string().nullable().optional(),
  environment: z.string().default("production"),
  base_url_override: z.string().url().nullable().optional(),
  test_case_ids: z.array(z.string().uuid()).optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const { project_id, name, environment, base_url_override, test_case_ids } =
    result.data;

  // Resolve test cases to run
  let testCases: { id: string }[] = [];
  if (test_case_ids && test_case_ids.length > 0) {
    const { data } = await supabase
      .from("test_cases")
      .select("id")
      .in("id", test_case_ids);
    testCases = data ?? [];
  } else {
    const { data: features } = await supabase
      .from("features")
      .select("id")
      .eq("project_id", project_id);
    const featureIds = (features ?? []).map((f) => f.id);
    if (featureIds.length > 0) {
      const { data } = await supabase
        .from("test_cases")
        .select("id")
        .in("feature_id", featureIds);
      testCases = data ?? [];
    }
  }

  const { data: run, error } = await supabase
    .from("test_runs")
    .insert({
      project_id,
      name: name ?? null,
      status: "pending",
      trigger_type: "manual",
      triggered_by: user.id,
      environment,
      base_url_override: base_url_override ?? null,
      total_cases: testCases.length,
      passed: 0,
      failed: 0,
      skipped: 0,
      errored: 0,
      metadata: test_case_ids ? { test_case_ids } : {},
    })
    .select()
    .single();

  if (error || !run) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to create run" },
      { status: 500 }
    );
  }

  // Create test_case_runs rows so the detail page can display them
  if (testCases.length > 0) {
    const { error: caseRunsError } = await supabase
      .from("test_case_runs")
      .insert(
        testCases.map((tc) => ({
          test_run_id: run.id,
          test_case_id: tc.id,
          status: "pending" as const,
        }))
      );

    if (caseRunsError) {
      return NextResponse.json(
        { error: "Failed to create case runs", details: caseRunsError.message },
        { status: 500 }
      );
    }

    // Mark test cases as pending for this run so the feature page reflects status
    const { error: caseUpdateError } = await supabase
      .from("test_cases")
      .update({
        last_run_at: new Date().toISOString(),
        last_run_status: "pending",
      })
      .in(
        "id",
        testCases.map((tc) => tc.id)
      );

    if (caseUpdateError) {
      return NextResponse.json(
        { error: "Failed to update test case statuses", details: caseUpdateError.message },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ run }, { status: 201 });
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("project_id");

  if (!projectId) {
    return NextResponse.json({ error: "project_id required" }, { status: 400 });
  }

  const { data: runs, error } = await supabase
    .from("test_runs")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ runs });
}
