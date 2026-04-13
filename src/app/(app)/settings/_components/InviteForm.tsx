"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { sendInvite } from "@/app/actions/invites";

const inputCls =
  "w-full rounded-md border border-(--border) bg-(--surface) px-3 py-2 text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:border-[#1E40AF] focus:outline-none focus:ring-2 focus:ring-[#1E40AF]/20";

const labelCls = "block text-sm font-medium text-(--text-primary) mb-1";

export function InviteForm({ teamId }: { teamId: string }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!email.trim()) { setError("Email is required."); return; }

    const formData = new FormData();
    formData.set("teamId", teamId);
    formData.set("email", email.trim().toLowerCase());
    formData.set("role", role);

    startTransition(async () => {
      const result = await sendInvite(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setEmail("");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {success && (
        <div role="status" className="rounded-md bg-pass-bg px-3 py-2 text-sm text-[#15803D]">
          Invite sent! The link will be valid for 7 days.
        </div>
      )}
      {error && (
        <p role="alert" className="text-xs text-[#B91C1C]">⚠ {error}</p>
      )}

      <div className="flex gap-3">
        <div className="flex-1">
          <label htmlFor="invite-email" className={labelCls}>
            Email address <span aria-hidden="true" className="text-[#B91C1C]">*</span>
          </label>
          <input
            id="invite-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="colleague@example.com"
            className={inputCls}
          />
        </div>
        <div className="w-36 shrink-0">
          <label htmlFor="invite-role" className={labelCls}>Role</label>
          <select
            id="invite-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className={inputCls}
          >
            <option value="admin">Admin</option>
            <option value="member">Member</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>
      </div>

      <Button type="submit" size="sm" loading={isPending}>
        Send invite
      </Button>
    </form>
  );
}
