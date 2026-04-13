"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { slugify } from "@/lib/utils";

const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  base_url: z.string().url("Enter a valid URL").optional().or(z.literal("")),
});

export type CreateProjectState = {
  errors?: Record<string, string[]>;
  message?: string;
};

export async function createProject(
  prevState: CreateProjectState,
  formData: FormData
): Promise<CreateProjectState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { message: "Not authenticated" };

  // Get user's first team
  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("profile_id", user.id)
    .limit(1)
    .single();

  if (!membership) return { message: "No team found" };

  const raw = {
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || undefined,
    base_url: (formData.get("base_url") as string) || undefined,
  };

  const result = createProjectSchema.safeParse(raw);
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const slug = slugify(result.data.name);

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      team_id: membership.team_id,
      name: result.data.name,
      slug,
      description: result.data.description ?? null,
      base_url: result.data.base_url || null,
      status: "active",
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { errors: { name: ["A project with this name already exists"] } };
    }
    return { message: error.message };
  }

  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

export async function archiveProject(projectId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("projects")
    .update({ status: "archived" })
    .eq("id", projectId);

  if (error) throw new Error(error.message);

  revalidatePath("/projects");
}

export async function deleteProject(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const projectId = formData.get("projectId") as string;

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId);

  if (error) throw new Error(error.message);

  revalidatePath("/projects");
  redirect("/projects");
}
