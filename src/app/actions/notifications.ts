"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createNotificationChannel(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const teamId = formData.get("teamId") as string;
  const name = (formData.get("name") as string)?.trim();
  const channelType = formData.get("channelType") as "slack" | "discord" | "email";
  const webhookUrl = formData.get("webhookUrl") as string | null;
  const email = formData.get("email") as string | null;

  if (!name) return { error: "Name is required." };
  if (channelType !== "email" && !webhookUrl) return { error: "Webhook URL is required." };
  if (channelType === "email" && !email) return { error: "Email is required." };

  const config =
    channelType === "email" ? { email } : { webhook_url: webhookUrl };

  const { error } = await supabase.from("notification_channels").insert({
    team_id: teamId,
    name,
    channel_type: channelType,
    config,
    is_active: true,
  });

  if (error) return { error: error.message };

  revalidatePath("/settings");
}
