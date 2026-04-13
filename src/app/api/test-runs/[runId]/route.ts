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

  const { error } = await supabase
    .from("test_runs")
    .update(body)
    .eq("id", runId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
