"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const configSchema = z.object({
  url: z.string().url("Valid URL is required"),
  device: z.enum(["desktop", "mobile"]),
  run_count: z.coerce.number().min(1).max(10).default(3),
  throttling: z.enum(["none", "simulated", "applied"]),
  threshold_performance: z.coerce.number().min(0).max(100).default(70),
  threshold_accessibility: z.coerce.number().min(0).max(100).default(90),
  threshold_best_practices: z.coerce.number().min(0).max(100).default(80),
  threshold_seo: z.coerce.number().min(0).max(100).default(70),
});

export type LighthouseConfigState = {
  errors?: Record<string, string[]>;
  message?: string;
};

export async function upsertLighthouseConfig(
  testCaseId: string,
  featureId: string,
  projectId: string,
  prevState: LighthouseConfigState,
  formData: FormData
): Promise<LighthouseConfigState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { message: "Not authenticated" };

  const raw = {
    url: formData.get("url") as string,
    device: formData.get("device") as string,
    run_count: formData.get("run_count") as string,
    throttling: formData.get("throttling") as string,
    threshold_performance: formData.get("threshold_performance") as string,
    threshold_accessibility: formData.get("threshold_accessibility") as string,
    threshold_best_practices: formData.get("threshold_best_practices") as string,
    threshold_seo: formData.get("threshold_seo") as string,
  };

  const result = configSchema.safeParse(raw);
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const { error } = await supabase
    .from("lighthouse_configs")
    .upsert(
      {
        test_case_id: testCaseId,
        url: result.data.url,
        device: result.data.device,
        run_count: result.data.run_count,
        throttling: result.data.throttling,
        threshold_performance: result.data.threshold_performance,
        threshold_accessibility: result.data.threshold_accessibility,
        threshold_best_practices: result.data.threshold_best_practices,
        threshold_seo: result.data.threshold_seo,
      },
      { onConflict: "test_case_id" }
    );

  if (error) return { message: error.message };

  revalidatePath(`/projects/${projectId}/features/${featureId}/test-cases/${testCaseId}`);
  return { message: "Configuration saved." };
}
