import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Users, AlertTriangle } from "lucide-react";
import { acceptInvite } from "@/app/actions/invites";

export const metadata = {
  title: "Accept Invitation — TestFlow",
};

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Fetch invite
  const { data: invite } = await supabase
    .from("team_invites")
    .select("id, team_id, email, role, token, expires_at, accepted")
    .eq("token", token)
    .single();

  if (!invite) {
    return (
      <InviteShell>
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertTriangle className="h-10 w-10 text-[#B45309]" aria-hidden="true" />
          <h1 className="text-xl font-semibold text-(--text-primary)">
            Invalid invite link
          </h1>
          <p className="text-sm text-(--text-secondary)">
            This invite link is invalid or has already been used.
          </p>
        </div>
      </InviteShell>
    );
  }

  const isExpired =
    invite.expires_at && new Date(invite.expires_at) < new Date();

  if (isExpired) {
    return (
      <InviteShell>
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertTriangle className="h-10 w-10 text-[#B45309]" aria-hidden="true" />
          <h1 className="text-xl font-semibold text-(--text-primary)">
            Invite expired
          </h1>
          <p className="text-sm text-(--text-secondary)">
            This invite link has expired. Ask a team admin to send a new one.
          </p>
        </div>
      </InviteShell>
    );
  }

  // Fetch team name separately
  const { data: teamData } = await supabase
    .from("teams")
    .select("name")
    .eq("id", invite.team_id)
    .single();
  const teamName = teamData?.name ?? "a team";

  if (!user) {
    // Redirect to signup with invite token preserved
    redirect(`/signup?invite=${token}`);
  }

  return (
    <InviteShell>
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#DBEAFE] dark:bg-running-text/30">
          <Users className="h-7 w-7 text-[#1E40AF]" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-(--text-primary)">
            You&apos;ve been invited
          </h1>
          <p className="mt-1 text-sm text-(--text-secondary)">
            Join <span className="font-semibold text-(--text-primary)">{teamName}</span> as{" "}
            <span className="capitalize">{invite.role}</span>
          </p>
        </div>

        <form action={acceptInvite} className="w-full">
          <input type="hidden" name="token" value={token} />
          <Button type="submit" className="w-full">
            Accept invitation
          </Button>
        </form>

        <p className="text-xs text-(--text-muted)">
          Signed in as {user.email}. Wrong account?{" "}
          <a href="/login" className="underline hover:text-(--text-primary)">
            Switch account
          </a>
        </p>
      </div>
    </InviteShell>
  );
}

function InviteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-(--bg) p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="pt-6">{children}</CardContent>
      </Card>
    </div>
  );
}
