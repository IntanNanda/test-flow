"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createSchedule(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const projectId = formData.get("projectId") as string;
  const name = (formData.get("name") as string)?.trim();
  const cronExpr = (formData.get("cronExpr") as string)?.trim();
  const timezone = (formData.get("timezone") as string) || "UTC";
  const preset = formData.get("preset") as string | null;

  if (!name || !cronExpr) return { error: "Name and cron expression are required." };

  const { error } = await supabase.from("schedules").insert({
    project_id: projectId,
    name,
    cron_expr: cronExpr,
    timezone,
    preset: preset as "nightly" | "weekly" | "hourly" | "custom" | null,
    created_by: user.id,
    is_active: true,
  });

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}/settings`);
}

export async function deleteSchedule(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const scheduleId = formData.get("scheduleId") as string;

  const { data: schedule } = await supabase
    .from("schedules")
    .select("project_id")
    .eq("id", scheduleId)
    .single();

  if (!schedule) return { error: "Schedule not found." };

  const { error } = await supabase
    .from("schedules")
    .delete()
    .eq("id", scheduleId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${schedule.project_id}/settings`);
}
