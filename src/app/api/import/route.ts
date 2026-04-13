import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Papa from "papaparse";
import { z } from "zod";

const csvRowSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  scenario_type: z.enum(["positive", "negative", "edge"]).default("positive"),
  test_type: z.enum(["functional", "api_performance", "frontend_performance"]).default("functional"),
  priority: z.enum(["critical", "high", "medium", "low"]).default("medium"),
  preconditions: z.string().optional(),
  tags: z.string().optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const featureId = formData.get("feature_id") as string | null;
  const format = formData.get("format") as "csv" | "json" | null;

  if (!file || !featureId || !format) {
    return NextResponse.json(
      { error: "file, feature_id, and format are required" },
      { status: 400 }
    );
  }

  const text = await file.text();
  let rows: z.infer<typeof csvRowSchema>[] = [];

  if (format === "csv") {
    const result = Papa.parse(text, { header: true, skipEmptyLines: true });
    const validated = (result.data as Record<string, string>[]).map((row) =>
      csvRowSchema.safeParse(row)
    );
    const invalid = validated.filter((r) => !r.success);
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: `${invalid.length} rows failed validation` },
        { status: 400 }
      );
    }
    rows = validated.map((r) => (r as { success: true; data: z.infer<typeof csvRowSchema> }).data);
  } else if (format === "json") {
    try {
      const parsed = JSON.parse(text);
      const arr = Array.isArray(parsed) ? parsed : parsed.test_cases ?? [];
      rows = arr.map((r: unknown) => csvRowSchema.parse(r));
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
  }

  const inserts = rows.map((row) => ({
    feature_id: featureId,
    title: row.title,
    description: row.description ?? null,
    scenario_type: row.scenario_type,
    test_type: row.test_type,
    priority: row.priority,
    status: "draft" as const,
    preconditions: row.preconditions ?? null,
    tags: row.tags ? row.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    created_by: user.id,
  }));

  const { data, error } = await supabase
    .from("test_cases")
    .insert(inserts)
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    imported: data?.length ?? 0,
    ids: data?.map((r) => r.id) ?? [],
  });
}
