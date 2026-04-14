import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;

  // Verify worker secret
  const secret = request.headers.get("x-worker-secret");
  if (secret !== process.env.WORKER_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!url || !serviceKey) {
    return NextResponse.json(
      { error: "Server configuration missing" },
      { status: 500 }
    );
  }

  const supabase = createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Fetch run with related case runs, test cases, steps, lighthouse configs, and project base_url
  const { data: run, error: runError } = await supabase
    .from("test_runs")
    .select(
      `
      *,
      test_case_runs(
        *,
        test_cases(
          *,
          test_steps(*),
          lighthouse_configs(*)
        )
      ),
      projects(base_url)
    `
    )
    .eq("id", runId)
    .single();

  if (runError || !run) {
    return NextResponse.json(
      { error: runError?.message ?? "Run not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ run });
}
