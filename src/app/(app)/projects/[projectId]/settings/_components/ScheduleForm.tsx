"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";
import { createSchedule } from "@/app/actions/schedules";

const PRESETS = [
  { value: "nightly", label: "Nightly (2 AM)", cron: "0 2 * * *" },
  { value: "weekly", label: "Weekly (Mon 9 AM)", cron: "0 9 * * 1" },
  { value: "hourly", label: "Hourly", cron: "0 * * * *" },
  { value: "custom", label: "Custom…", cron: "" },
];

const inputCls =
  "w-full rounded-md border border-(--border) bg-(--surface) px-3 py-2 text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:border-[#1E40AF] focus:outline-none focus:ring-2 focus:ring-[#1E40AF]/20";

const labelCls = "block text-sm font-medium text-(--text-primary) mb-1";

export function ScheduleForm({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState("nightly");
  const [cron, setCron] = useState(PRESETS[0].cron);
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handlePresetChange(value: string) {
    setPreset(value);
    const found = PRESETS.find((p) => p.value === value);
    if (found && found.cron) setCron(found.cron);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError("Schedule name is required."); return; }
    if (!cron.trim()) { setError("Cron expression is required."); return; }

    const formData = new FormData();
    formData.set("projectId", projectId);
    formData.set("name", name);
    formData.set("cronExpr", cron);
    formData.set("timezone", timezone);
    formData.set("preset", preset === "custom" ? "custom" : preset);

    startTransition(async () => {
      const result = await createSchedule(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setOpen(false);
        setName("");
        setPreset("nightly");
        setCron(PRESETS[0].cron);
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
        Add schedule
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-(--border) bg-(--bg) p-4">
      <h3 className="text-sm font-semibold text-(--text-primary)">New schedule</h3>

      {error && (
        <p role="alert" className="text-xs text-[#B91C1C]">⚠ {error}</p>
      )}

      <div>
        <label htmlFor="sched-name" className={labelCls}>
          Name <span aria-hidden="true" className="text-[#B91C1C]">*</span>
        </label>
        <input
          id="sched-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Nightly regression"
          className={inputCls}
        />
      </div>

      <div>
        <label htmlFor="sched-preset" className={labelCls}>Preset</label>
        <select
          id="sched-preset"
          value={preset}
          onChange={(e) => handlePresetChange(e.target.value)}
          className={inputCls}
        >
          {PRESETS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      {preset === "custom" && (
        <div>
          <label htmlFor="sched-cron" className={labelCls}>Cron expression</label>
          <p className="mb-1 text-xs text-(--text-muted)">e.g. 0 2 * * * (2 AM every day)</p>
          <input
            id="sched-cron"
            type="text"
            value={cron}
            onChange={(e) => setCron(e.target.value)}
            placeholder="0 2 * * *"
            className={`${inputCls} font-mono`}
          />
        </div>
      )}

      <div>
        <label htmlFor="sched-tz" className={labelCls}>Timezone</label>
        <select
          id="sched-tz"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className={inputCls}
        >
          <option value="UTC">UTC</option>
          <option value="America/New_York">Eastern (ET)</option>
          <option value="America/Chicago">Central (CT)</option>
          <option value="America/Denver">Mountain (MT)</option>
          <option value="America/Los_Angeles">Pacific (PT)</option>
          <option value="Europe/London">London (GMT)</option>
          <option value="Europe/Paris">Paris (CET)</option>
          <option value="Asia/Tokyo">Tokyo (JST)</option>
          <option value="Asia/Singapore">Singapore (SGT)</option>
          <option value="Asia/Jakarta">Jakarta (WIB)</option>
        </select>
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={isPending}>Save schedule</Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
