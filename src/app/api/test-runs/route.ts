import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  project_id: z.string().uuid(),
  name: z.string().optional(),
  environment: z.string().default("production"),
  base_url_override: z.string().url().optional(),
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

  // Count cases to run
  let totalCases = 0;
  if (test_case_ids && test_case_ids.length > 0) {
    totalCases = test_case_ids.length;
  } else {
    // Resolve feature IDs first, then count test cases
    const { data: features } = await supabase
      .from("features")
      .select("id")
      .eq("project_id", project_id);
    const featureIds = (features ?? []).map((f) => f.id);
    if (featureIds.length > 0) {
      const { count } = await supabase
        .from("test_cases")
        .select("id", { count: "exact" })
        .eq("status", "active")
        .in("feature_id", featureIds);
      totalCases = count ?? 0;
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
      total_cases: totalCases,
      passed: 0,
      failed: 0,
      skipped: 0,
      errored: 0,
      metadata: test_case_ids ? { test_case_ids } : {},
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
