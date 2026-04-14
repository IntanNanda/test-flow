"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { slugify } from "@/lib/utils";

const featureSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
});

export type FeatureActionState = {
  errors?: Record<string, string[]>;
  message?: string;
};

export async function updateFeature(
  featureId: string,
  projectId: string,
  prevState: FeatureActionState,
  formData: FormData
): Promise<FeatureActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { message: "Not authenticated" };

  const raw = {
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || undefined,
  };

  const result = featureSchema.safeParse(raw);
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const { error } = await supabase
    .from("features")
    .update({
      name: result.data.name,
      description: result.data.description ?? null,
    })
    .eq("id", featureId);

  if (error) return { message: error.message };

  revalidatePath(`/projects/${projectId}/features/${featureId}`);
  return { message: "ok" };
}

export async function deleteFeature(
  featureId: string,
  projectId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("features")
    .delete()
    .eq("id", featureId)
    .eq("project_id", projectId);
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return {};
}

export async function createFeature(
  projectId: string,
  prevState: FeatureActionState,
  formData: FormData
): Promise<FeatureActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { message: "Not authenticated" };

  const raw = {
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || undefined,
  };

  const result = featureSchema.safeParse(raw);
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  // Get current max sort_order
  const { data: existing } = await supabase
    .from("features")
    .select("sort_order")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const sortOrder = (existing?.sort_order ?? -1) + 1;
  const slug = slugify(result.data.name);

  const { data: feature, error } = await supabase
    .from("features")
    .insert({
      project_id: projectId,
      name: result.data.name,
      slug,
      description: result.data.description ?? null,
      sort_order: sortOrder,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { errors: { name: ["A feature with this name already exists in this project"] } };
    }
    return { message: error.message };
  }

  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}/features/${feature.id}`);
}
