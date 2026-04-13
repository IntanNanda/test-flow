import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Bell,
  Clock,
  Trash2,
  Mail,
  Globe,
} from "lucide-react";
import { deleteProject } from "@/app/actions/projects";
import { ScheduleForm } from "./_components/ScheduleForm";
import { NotificationChannelForm } from "./_components/NotificationChannelForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("name")
    .eq("id", projectId)
    .single();
  return {
    title: data ? `Settings — ${data.name} — TestFlow` : "Settings — TestFlow",
  };
}

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (!project) notFound();

  const { data: schedules } = await supabase
    .from("schedules")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  const { data: channels } = await supabase
    .from("notification_channels")
    .select("*")
    .eq("team_id", project.team_id)
    .order("created_at", { ascending: false });

  const { data: rules } = await supabase
    .from("notification_rules")
    .select("*, notification_channels(name, channel_type)")
    .eq("project_id", projectId);

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-8">
      {/* Schedules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-(--text-muted)" aria-hidden="true" />
            Schedules
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {schedules && schedules.length > 0 ? (
            <div className="divide-y divide-(--border)">
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-(--text-primary)">
                      {schedule.name}
                    </p>
                    <p className="text-xs text-(--text-muted)">
                      {schedule.cron_expr} · {schedule.timezone} ·{" "}
                      <span
                        className={
                          schedule.is_active
                            ? "text-[#15803D]"
                            : "text-(--text-muted)"
                        }
                      >
                        {schedule.is_active ? "Active" : "Paused"}
                      </span>
                    </p>
                  </div>
                  <DeleteScheduleButton scheduleId={schedule.id} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-(--text-muted)">
              No schedules yet. Add one to run tests automatically.
            </p>
          )}
          <ScheduleForm projectId={projectId} />
        </CardContent>
      </Card>

      {/* Notification channels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-(--text-muted)" aria-hidden="true" />
            Notification Channels
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {channels && channels.length > 0 ? (
            <div className="divide-y divide-(--border)">
              {channels.map((ch) => (
                <div
                  key={ch.id}
                  className="flex items-center gap-3 py-3"
                >
                  {ch.channel_type === "slack" && (
                    <Globe className="h-4 w-4 shrink-0 text-[#4A154B]" aria-hidden="true" />
                  )}
                  {ch.channel_type === "email" && (
                    <Mail className="h-4 w-4 shrink-0 text-[#1E40AF]" aria-hidden="true" />
                  )}
                  {ch.channel_type === "discord" && (
                    <Globe className="h-4 w-4 shrink-0 text-[#5865F2]" aria-hidden="true" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-(--text-primary)">
                      {ch.name}
                    </p>
                    <p className="text-xs capitalize text-(--text-muted)">
                      {ch.channel_type}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-(--text-muted)">
              No notification channels yet.
            </p>
          )}
          <NotificationChannelForm teamId={project.team_id} />
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-[#FEE2E2] dark:border-[#7F1D1D]/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#B91C1C]">
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-(--text-primary)">
                Delete project
              </p>
              <p className="text-xs text-(--text-muted)">
                Permanently delete this project and all its test cases, runs, and data. This cannot be undone.
              </p>
            </div>
            <DeleteProjectButton projectId={projectId} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DeleteScheduleButton({ scheduleId }: { scheduleId: string }) {
  return (
    <form>
      <input type="hidden" name="scheduleId" value={scheduleId} />
      <Button variant="danger" size="sm" type="submit">
        Delete
      </Button>
    </form>
  );
}

function DeleteProjectButton({ projectId }: { projectId: string }) {
  return (
    <form action={deleteProject}>
      <input type="hidden" name="projectId" value={projectId} />
      <Button variant="danger" size="sm" type="submit">
        Delete project
      </Button>
    </form>
  );
}
