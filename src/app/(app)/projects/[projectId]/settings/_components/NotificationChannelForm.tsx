"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";
import { createNotificationChannel } from "@/app/actions/notifications";

const inputCls =
  "w-full rounded-md border border-(--border) bg-(--surface) px-3 py-2 text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:border-[#1E40AF] focus:outline-none focus:ring-2 focus:ring-[#1E40AF]/20";

const labelCls = "block text-sm font-medium text-(--text-primary) mb-1";

export function NotificationChannelForm({ teamId }: { teamId: string }) {
  const [open, setOpen] = useState(false);
  const [channelType, setChannelType] = useState<"slack" | "discord" | "email">("slack");
  const [name, setName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError("Channel name is required."); return; }
    if (channelType !== "email" && !webhookUrl.trim()) { setError("Webhook URL is required."); return; }
    if (channelType === "email" && !email.trim()) { setError("Email address is required."); return; }

    const formData = new FormData();
    formData.set("teamId", teamId);
    formData.set("name", name);
    formData.set("channelType", channelType);
    if (channelType === "email") formData.set("email", email);
    else formData.set("webhookUrl", webhookUrl);

    startTransition(async () => {
      const result = await createNotificationChannel(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setOpen(false);
        setName("");
        setWebhookUrl("");
        setEmail("");
      }
    });
  }

  if (!open) {
    return (
      <Button
        variant="secondary"
        size="sm"
        leftIcon={<Plus className="h-3.5 w-3.5" />}
        onClick={() => setOpen(true)}
      >
        Add channel
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-(--border) bg-(--bg) p-4">
      <h3 className="text-sm font-semibold text-(--text-primary)">New notification channel</h3>

      {error && (
        <p role="alert" className="text-xs text-[#B91C1C]">⚠ {error}</p>
      )}

      <div>
        <label htmlFor="ch-name" className={labelCls}>
          Name <span aria-hidden="true" className="text-[#B91C1C]">*</span>
        </label>
        <input
          id="ch-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. #qa-alerts"
          className={inputCls}
        />
      </div>

      <div>
        <label htmlFor="ch-type" className={labelCls}>Type</label>
        <select
          id="ch-type"
          value={channelType}
          onChange={(e) => setChannelType(e.target.value as "slack" | "discord" | "email")}
          className={inputCls}
        >
          <option value="slack">Slack</option>
          <option value="discord">Discord</option>
          <option value="email">Email</option>
        </select>
      </div>

      {channelType === "email" ? (
        <div>
          <label htmlFor="ch-email" className={labelCls}>
            Email address <span aria-hidden="true" className="text-[#B91C1C]">*</span>
          </label>
          <input
            id="ch-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="team@example.com"
            className={inputCls}
          />
        </div>
      ) : (
        <div>
          <label htmlFor="ch-webhook" className={labelCls}>
            {channelType === "slack" ? "Slack" : "Discord"} webhook URL{" "}
            <span aria-hidden="true" className="text-[#B91C1C]">*</span>
          </label>
          <p className="mb-1 text-xs text-(--text-muted)">
            {channelType === "slack"
              ? "From Slack App > Incoming Webhooks"
              : "From Discord channel settings > Integrations"}
          </p>
          <input
            id="ch-webhook"
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://hooks.slack.com/…"
            className={inputCls}
          />
        </div>
      )}

      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={isPending}>Save channel</Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
