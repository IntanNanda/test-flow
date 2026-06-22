"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const stepSchema = z.object({
  action: z.string().min(1, "Action is required"),
  selector: z.string().optional(),
  value: z.string().optional(),
  description: z.string().optional(),
  screenshot_on_step: z.boolean().default(false),
});

export async function addStep(
  testCaseId: string,
  featureId: string,
  projectId: string,
  formData: FormData
) {
  const supabase = await createClient();

  // Get current max step_order
  const { data: existing } = await supabase
    .from("test_steps")
    .select("step_order")
    .eq("test_case_id", testCaseId)
    .order("step_order", { ascending: false })
    .limit(1)
    .single();

  const nextOrder = (existing?.step_order ?? -1) + 1;

  const { error } = await supabase.from("test_steps").insert({
    test_case_id: testCaseId,
    step_order: nextOrder,
    action: formData.get("action") as string,
    selector: (formData.get("selector") as string) || null,
    value: (formData.get("value") as string) || null,
    description: (formData.get("description") as string) || null,
    screenshot_on_step: formData.get("screenshot_on_step") === "true",
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/projects/${projectId}/features/${featureId}/test-cases/${testCaseId}`);
}

export async function removeStep(
  stepId: string,
  testCaseId: string,
  featureId: string,
  projectId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("test_steps")
    .delete()
    .eq("id", stepId)
    .eq("test_case_id", testCaseId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}/features/${featureId}/test-cases/${testCaseId}`);
  return {};
}

export async function updateStep(
  stepId: string,
  testCaseId: string,
  featureId: string,
  projectId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const result = stepSchema.safeParse({
    action: formData.get("action") as string,
    selector: (formData.get("selector") as string) || undefined,
    value: (formData.get("value") as string) || undefined,
    description: (formData.get("description") as string) || undefined,
    screenshot_on_step: formData.get("screenshot_on_step") === "true",
  });

  if (!result.success) {
    return { error: result.error.flatten().fieldErrors.action?.[0] ?? "Invalid step" };
  }

  const { error } = await supabase
    .from("test_steps")
    .update({
      action: result.data.action,
      selector: result.data.selector ?? null,
      value: result.data.value ?? null,
      description: result.data.description ?? null,
      screenshot_on_step: result.data.screenshot_on_step,
    })
    .eq("id", stepId)
    .eq("test_case_id", testCaseId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}/features/${featureId}/test-cases/${testCaseId}`);
  return {};
}

export async function reorderSteps(
  testCaseId: string,
  orderedIds: string[],
  featureId: string,
  projectId: string
) {
  const supabase = await createClient();

  // Update step_order for each step
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from("test_steps")
        .update({ step_order: index })
        .eq("id", id)
        .eq("test_case_id", testCaseId)
    )
  );

  revalidatePath(`/projects/${projectId}/features/${featureId}/test-cases/${testCaseId}`);
}
