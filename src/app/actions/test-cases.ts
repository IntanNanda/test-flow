"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const testCaseSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  scenario_type: z.enum(["positive", "negative", "edge"]),
  test_type: z.enum(["functional", "api_performance", "frontend_performance"]),
  priority: z.enum(["critical", "high", "medium", "low"]),
  preconditions: z.string().max(2000).optional(),
  tags: z.string().optional(),
});

export type TestCaseActionState = {
  errors?: Record<string, string[]>;
  message?: string;
};

export async function createTestCase(
  featureId: string,
  projectId: string,
  prevState: TestCaseActionState,
  formData: FormData
): Promise<TestCaseActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { message: "Not authenticated" };

  const raw = {
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || undefined,
    scenario_type: formData.get("scenario_type") as string,
    test_type: formData.get("test_type") as string,
    priority: formData.get("priority") as string,
    preconditions: (formData.get("preconditions") as string) || undefined,
    tags: (formData.get("tags") as string) || undefined,
  };

  const result = testCaseSchema.safeParse(raw);
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const tags = result.data.tags
    ? result.data.tags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  const { data: tc, error } = await supabase
    .from("test_cases")
    .insert({
      feature_id: featureId,
      title: result.data.title,
      description: result.data.description ?? null,
      scenario_type: result.data.scenario_type,
      test_type: result.data.test_type,
      priority: result.data.priority,
      status: "draft",
      preconditions: result.data.preconditions ?? null,
      tags,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return { message: error.message };

  revalidatePath(`/projects/${projectId}/features/${featureId}`);
  redirect(`/projects/${projectId}/features/${featureId}/test-cases/${tc.id}`);
}

export async function deleteTestCase(
  testCaseId: string,
  featureId: string,
  projectId: string
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("test_cases")
    .delete()
    .eq("id", testCaseId);

  if (error) throw new Error(error.message);

  revalidatePath(`/projects/${projectId}/features/${featureId}`);
  redirect(`/projects/${projectId}/features/${featureId}`);
}

export async function duplicateTestCase(
  testCaseId: string,
  featureId: string,
  projectId: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: original } = await supabase
    .from("test_cases")
    .select("*")
    .eq("id", testCaseId)
    .single();

  if (!original) throw new Error("Test case not found");

  const { data: originalSteps } = await supabase
    .from("test_steps")
    .select("*")
    .eq("test_case_id", testCaseId)
    .order("step_order", { ascending: true });

  // Create duplicate
  const { data: copy, error: copyError } = await supabase
    .from("test_cases")
    .insert({
      feature_id: featureId,
      title: `${original.title} (copy)`,
      description: original.description,
      scenario_type: original.scenario_type,
      test_type: original.test_type,
      priority: original.priority,
      status: "draft",
      preconditions: original.preconditions,
      test_data: original.test_data,
      tags: original.tags,
      created_by: user.id,
    })
    .select()
    .single();

  if (copyError) throw new Error(copyError.message);

  // Duplicate steps
  if (originalSteps && originalSteps.length > 0) {
    await supabase.from("test_steps").insert(
      originalSteps.map((step) => ({
        test_case_id: copy.id,
        step_order: step.step_order,
        action: step.action,
        selector: step.selector,
        value: step.value,
        description: step.description,
        screenshot_on_step: step.screenshot_on_step,
      }))
    );
  }

  revalidatePath(`/projects/${projectId}/features/${featureId}`);
  redirect(`/projects/${projectId}/features/${featureId}/test-cases/${copy.id}`);
}
