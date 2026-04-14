"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Plus, Pencil, X, Loader2, Clock, ArrowLeft } from "lucide-react";
import { updateFeature } from "@/app/actions/features";
import { formatRelativeTime } from "@/lib/utils";

interface Props {
  projectId: string;
  featureId: string;
  name: string;
  description: string | null;
  lastRunAt: string | null;
}

export function FeatureHeader({
  projectId, featureId, name, description, lastRunAt,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [nameVal, setNameVal] = useState(name);
  const [descVal, setDescVal] = useState(description ?? "");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const nameRef = useRef<HTMLInputElement>(null);

  function openModal() {
    setNameVal(name);
    setDescVal(description ?? "");
    setError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (isPending) return;
    setModalOpen(false);
    setError("");
  }

  function save() {
    if (!nameVal.trim()) { setError("Name is required"); return; }
    const fd = new FormData();
    fd.set("name", nameVal.trim());
    fd.set("description", descVal.trim());
    startTransition(async () => {
      const result = await updateFeature(featureId, projectId, {}, fd);
      if (result.message === "ok") {
        setModalOpen(false);
      } else {
        setError(result.errors?.name?.[0] ?? result.message ?? "Something went wrong");
      }
    });
  }

  useEffect(() => {
    if (modalOpen) setTimeout(() => nameRef.current?.focus(), 50);
  }, [modalOpen]);

  useEffect(() => {
    if (!modalOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeModal(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [modalOpen, isPending]);

  return (
    <>
      {/* Header card */}
      <div className="mb-6 rounded-2xl border border-[#E2E8F0] bg-white px-6 py-5 shadow-sm">
        <div className="flex items-center justify-between gap-6">

          {/* Left — back button + name + last run inline, description below */}
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <Link
              href={`/projects/${projectId}`}
              className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#6B7A99] transition-colors hover:border-[#2B6CFF] hover:text-[#2B6CFF]"
              aria-label="Back to project"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <h1 className="truncate text-lg font-semibold text-[#0A1B3D]">{name}</h1>
                <div className="flex shrink-0 items-center gap-1 text-xs text-[#6B7A99]">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  {lastRunAt
                    ? <span>Last run <span className="font-medium text-[#0A1B3D]">{formatRelativeTime(lastRunAt)}</span></span>
                    : <span className="italic text-[#B0BAD0]">Never run</span>
                  }
                </div>
              </div>
              {description && (
                <p className="mt-0.5 truncate text-sm text-[#6B7A99]">{description}</p>
              )}
            </div>
          </div>

          {/* Right — actions */}
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={openModal}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#D1DEFF] bg-white px-3 text-sm font-medium text-[#2B6CFF] transition-colors hover:bg-[#E8F0FF]"
              aria-label="Edit feature"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
            <Link href={`/projects/${projectId}/features/${featureId}/test-cases/new`}>
              <Button leftIcon={<Plus className="h-4 w-4" />}>New test case</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-feature-title"
        >
          <div className="absolute inset-0 bg-[#0A1B3D]/30 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#F0F4FA] px-6 py-4">
              <h2 id="edit-feature-title" className="text-sm font-semibold text-[#0A1B3D]">Edit feature</h2>
              <button
                onClick={closeModal}
                disabled={isPending}
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#6B7A99] transition-colors hover:bg-[#F5F8FF] hover:text-[#0A1B3D] disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#6B7A99]">
                  Name <span className="text-[#FF8A7A]">*</span>
                </label>
                <input
                  ref={nameRef}
                  value={nameVal}
                  onChange={(e) => { setNameVal(e.target.value); setError(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter") save(); }}
                  placeholder="Feature name"
                  className="w-full rounded-xl bg-[#F5F8FF] px-4 py-2.5 text-sm text-[#0A1B3D] outline-none placeholder-[#B0BAD0] transition-colors focus:bg-white focus:shadow-[0_0_0_1.5px_#2B6CFF]"
                />
                {error && <p className="mt-1.5 text-[11px] text-[#FF8A7A]">{error}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#6B7A99]">Description</label>
                <textarea
                  value={descVal}
                  onChange={(e) => setDescVal(e.target.value)}
                  placeholder="Add a description…"
                  rows={3}
                  className="w-full resize-none rounded-xl bg-[#F5F8FF] px-4 py-2.5 text-sm text-[#0A1B3D] outline-none placeholder-[#B0BAD0] transition-colors focus:bg-white focus:shadow-[0_0_0_1.5px_#2B6CFF]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#F0F4FA] px-6 py-4">
              <button
                onClick={closeModal}
                disabled={isPending}
                className="inline-flex h-9 items-center rounded-lg px-4 text-sm font-medium text-[#6B7A99] transition-colors hover:bg-[#F5F8FF] hover:text-[#0A1B3D] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={isPending}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#2B6CFF] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1E5AE8] disabled:opacity-60"
              >
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
