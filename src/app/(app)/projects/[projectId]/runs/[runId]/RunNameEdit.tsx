"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { Pencil, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateTestRunName } from "@/app/actions/test-runs";

interface Props {
  runId: string;
  projectId: string;
  name: string;
  fallback: string;
}

export function RunNameEdit({ runId, projectId, name, fallback }: Props) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(name);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setValue(name);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, name]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && !isPending) setOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, isPending]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") save();
  }

  function save() {
    if (value.trim() === name) { setOpen(false); return; }
    startTransition(async () => {
      const res = await updateTestRunName(runId, projectId, value);
      if (res.error) { toast.error(res.error); return; }
      toast.success("Run name updated");
      setOpen(false);
    });
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <h1 className="truncate text-lg font-semibold text-[#0A1B3D]">
          {name || fallback}
        </h1>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#B0BAD0] transition-colors hover:bg-[#F5F8FF] hover:text-[#2B6CFF]"
          aria-label="Edit run name"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-[#0A1B3D]/30 backdrop-blur-sm" onClick={() => { if (!isPending) setOpen(false); }} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#F0F4FA] px-6 py-4">
              <h2 className="text-sm font-semibold text-[#0A1B3D]">Edit run name</h2>
              <button
                onClick={() => { if (!isPending) setOpen(false); }}
                disabled={isPending}
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#6B7A99] transition-colors hover:bg-[#F5F8FF] hover:text-[#0A1B3D] disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              <label className="mb-1.5 block text-xs font-medium text-[#6B7A99]">Name</label>
              <input
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isPending}
                placeholder={fallback}
                className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-sm text-[#0A1B3D] outline-none transition-colors placeholder:text-[#B0BAD0] focus:border-[#2B6CFF] focus:ring-2 focus:ring-[#2B6CFF]/20 disabled:opacity-50"
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-[#F0F4FA] px-6 py-4">
              <button
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="inline-flex h-9 items-center rounded-lg px-4 text-sm font-medium text-[#6B7A99] transition-colors hover:bg-[#F5F8FF] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={isPending || !value.trim()}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#2B6CFF] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1E5AE8] disabled:opacity-60"
              >
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
