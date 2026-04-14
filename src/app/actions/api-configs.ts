"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const apiConfigSchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]),
  endpoint_path: z.string().min(1, "Endpoint path is required"),
  headers: z.string().optional(),
  request_body: z.string().optional(),
  auth_type: z.enum(["none", "bearer", "basic", "api_key"]).default("none"),
  auth_config: z.string().optional(),
  concurrency: z.coerce.number().min(1).max(50).default(1),
  request_count: z.coerce.number().min(1).max(10000).default(10),
  threshold_p50_ms: z.coerce.number().min(0).default(200),
  threshold_p95_ms: z.coerce.number().min(0).default(500),
  threshold_p99_ms: z.coerce.number().min(0).default(1000),
  threshold_error_rate: z.coerce.number().min(0).max(1).default(0.05),
});

export type ApiConfigState = {
  errors?: Record<string, string[]>;
  message?: string;
};

export async function upsertApiConfig(
  testCaseId: string,
  featureId: string,
  projectId: string,
  prevState: ApiConfigState,
  formData: FormData
): Promise<ApiConfigState> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { message: "Not authenticated" };

  const raw = {
    method: formData.get("method") as string,
    endpoint_path: formData.get("endpoint_path") as string,
    headers: formData.get("headers") as string,
    request_body: formData.get("request_body") as string,
    auth_type: formData.get("auth_type") as string,
    auth_config: formData.get("auth_config") as string,
    concurrency: formData.get("concurrency") as string,
    request_count: formData.get("request_count") as string,
    threshold_p50_ms: formData.get("threshold_p50_ms") as string,
    threshold_p95_ms: formData.get("threshold_p95_ms") as string,
    threshold_p99_ms: formData.get("threshold_p99_ms") as string,
    threshold_error_rate: formData.get("threshold_error_rate") as string,
  };

  const result = apiConfigSchema.safeParse(raw);
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  // Parse JSON fields
  let headers: Record<string, string> = {};
  let request_body: Record<string, unknown> | null = null;
  let auth_config: Record<string, unknown> | null = null;

  if (result.data.headers?.trim()) {
    try { headers = JSON.parse(result.data.headers); }
    catch { return { errors: { headers: ["Must be valid JSON"] } }; }
  }
  if (result.data.request_body?.trim()) {
    try { request_body = JSON.parse(result.data.request_body); }
    catch { return { errors: { request_body: ["Must be valid JSON"] } }; }
  }
  if (result.data.auth_config?.trim()) {
    try { auth_config = JSON.parse(result.data.auth_config); }
    catch { return { errors: { auth_config: ["Must be valid JSON"] } }; }
  }

  const { error } = await supabase
    .from("api_test_configs")
    .upsert(
      {
        test_case_id: testCaseId,
        method: result.data.method,
        endpoint_path: result.data.endpoint_path,
        headers,
        request_body,
        auth_type: result.data.auth_type,
        auth_config,
        concurrency: result.data.concurrency,
        request_count: result.data.request_count,
        threshold_p50_ms: result.data.threshold_p50_ms,
        threshold_p95_ms: result.data.threshold_p95_ms,
        threshold_p99_ms: result.data.threshold_p99_ms,
        threshold_error_rate: result.data.threshold_error_rate,
      },
      { onConflict: "test_case_id" }
    );

  if (error) return { message: error.message };

  revalidatePath(`/projects/${projectId}/features/${featureId}/test-cases/${testCaseId}`);
  return { message: "Configuration saved." };
}
