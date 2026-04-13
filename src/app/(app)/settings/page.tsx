import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Users, UserPlus, Shield } from "lucide-react";
import { InviteForm } from "./_components/InviteForm";

export const metadata = {
  title: "Team Settings — TestFlow",
};

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  viewer: "Viewer",
};

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-[#DBEAFE] text-[#1E40AF]",
  admin: "bg-[#EDE9FE] text-[#6D28D9]",
  member: "bg-[#DCFCE7] text-[#15803D]",
  viewer: "bg-[#F5F5F4] text-[#78716C]",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get user's team membership
  const { data: membership } = await supabase
    .from("team_members")
    .select("id, team_id, profile_id, role, invited_by, joined_at")
    .eq("profile_id", user.id)
    .order("joined_at", { ascending: true })
    .limit(1)
    .single();

  if (!membership) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <p className="text-sm text-(--text-muted)">No team found.</p>
      </div>
    );
  }

  const teamId = membership.team_id;

  // Fetch team separately
  const { data: team } = await supabase
    .from("teams")
    .select("id, name")
    .eq("id", teamId)
    .single();
  const isAdminOrOwner =
    membership.role === "owner" || membership.role === "admin";

  // Get all members
  const { data: members } = teamId
    ? await supabase
        .from("team_members")
        .select("id, team_id, profile_id, role, invited_by, joined_at")
        .eq("team_id", teamId)
        .order("created_at", { ascending: true })
    : { data: [] };

  // Get profiles for members
  const profileIds = members?.map((m) => m.profile_id) ?? [];
  const { data: profiles } = profileIds.length
    ? await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", profileIds)
    : { data: [] };

  const profileMap = Object.fromEntries(
    (profiles ?? []).map((p) => [p.id, p])
  );

  // Pending invites
  const { data: invites } = teamId
    ? await supabase
        .from("team_invites")
        .select("*")
        .eq("team_id", teamId)
        .eq("accepted", false)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      {/* Team info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-(--text-muted)" aria-hidden="true" />
            Team: {team?.name ?? "My Team"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-(--text-muted)">Team ID: {teamId}</p>
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4 text-(--text-muted)" aria-hidden="true" />
            Members
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {members?.map((member) => {
            const profile = profileMap[member.profile_id];
            const isSelf = member.profile_id === user.id;
            return (
              <div
                key={member.id}
                className="flex items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-(--bg)"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DBEAFE] text-xs font-semibold text-[#1E40AF]">
                    {profile?.display_name
                      ? profile.display_name[0].toUpperCase()
                      : "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-(--text-primary)">
                      {profile?.display_name ?? "Unknown"}
                      {isSelf && (
                        <span className="ml-2 text-xs text-(--text-muted)">
                          (you)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[member.role] ?? "bg-surface-hover text-(--text-muted)"}`}
                >
                  {ROLE_LABELS[member.role] ?? member.role}
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Invite members */}
      {isAdminOrOwner && teamId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus
                className="h-4 w-4 text-(--text-muted)"
                aria-hidden="true"
              />
              Invite member
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {invites && invites.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
                  Pending invites
                </p>
                <div className="divide-y divide-(--border)">
                  {invites.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between py-2 text-sm"
                    >
                      <span className="text-(--text-primary)">{inv.email}</span>
                      <span className="text-xs capitalize text-(--text-muted)">
                        {inv.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <InviteForm teamId={teamId} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
