import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Papa from "papaparse";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const projectId = searchParams.get("project_id");
  const featureId = searchParams.get("feature_id");
  const format = searchParams.get("format") ?? "json";

  if (!projectId && !featureId) {
    return NextResponse.json(
      { error: "project_id or feature_id required" },
      { status: 400 }
    );
  }

  // Resolve feature IDs for the project if needed
  let featureIds: string[] | null = null;
  if (projectId && !featureId) {
    const { data: features } = await supabase
      .from("features")
      .select("id")
      .eq("project_id", projectId);
    featureIds = (features ?? []).map((f) => f.id);
  }

  let query = supabase
    .from("test_cases")
    .select("*")
    .order("created_at", { ascending: true });

  if (featureId) {
    query = query.eq("feature_id", featureId);
  } else if (featureIds && featureIds.length > 0) {
    query = query.in("feature_id", featureIds);
  }

  const { data: testCases, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (format === "csv") {
    const rows = (testCases ?? []).map((tc) => ({
      id: tc.id,
      title: tc.title,
      description: tc.description ?? "",
      scenario_type: tc.scenario_type,
      test_type: tc.test_type,
      priority: tc.priority,
      status: tc.status,
      preconditions: tc.preconditions ?? "",
      tags: tc.tags.join(", "),
      step_count: 0,
    }));

    const csv = Papa.unparse(rows);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="testflow-export-${Date.now()}.csv"`,
      },
    });
  }

  return new NextResponse(
    JSON.stringify({ test_cases: testCases, exported_at: new Date().toISOString() }, null, 2),
    {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="testflow-export-${Date.now()}.json"`,
      },
    }
  );
}
