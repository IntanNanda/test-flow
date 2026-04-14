"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Eye, RotateCcw, XCircle, Trash2, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { cancelTestRun, deleteTestRun, rerunTestRun } from "@/app/actions/test-runs";
import type { RunStatus } from "@/types/database";

const CANCELLABLE: RunStatus[] = ["pending", "queued", "running"];
const RERUNNABLE: RunStatus[] = ["passed", "failed", "error", "cancelled"];

interface Props {
  runId: string;
  projectId: string;
  status: RunStatus;
}

function DeleteConfirmModal({
  onConfirm,
  onClose,
  isPending,
}: {
  onConfirm: () => void;
  onClose: () => void;
  isPending: boolean;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && !isPending) onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isPending, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-[#0A1B3D]/30 backdrop-blur-sm" onClick={() => { if (!isPending) onClose(); }} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#F0F4FA] px-6 py-4">
          <h2 className="text-sm font-semibold text-[#0A1B3D]">Delete run</h2>
          <button onClick={() => { if (!isPending) onClose(); }} disabled={isPending} className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#6B7A99] transition-colors hover:bg-[#F5F8FF] hover:text-[#0A1B3D] disabled:opacity-50">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-[#6B7A99]">
            Are you sure you want to delete this run? All results and artifacts will be permanently removed.
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-[#F0F4FA] px-6 py-4">
          <button onClick={() => { if (!isPending) onClose(); }} disabled={isPending} className="inline-flex h-9 items-center rounded-lg px-4 text-sm font-medium text-[#6B7A99] transition-colors hover:bg-[#F5F8FF] disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={isPending} className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#FF8A7A] px-4 text-sm font-medium text-white transition-colors hover:bg-[#F97060] disabled:opacity-60">
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export function RunActions({ runId, projectId, status }: Props) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  function handleView() {
    router.push(`/projects/${projectId}/runs/${runId}`);
  }

  function handleRerun() {
    setMenuOpen(false);
    startTransition(async () => {
      const res = await rerunTestRun(runId, projectId);
      if (res.error) { toast.error(res.error); return; }
      toast.success("Re-run started!");
      router.push(`/projects/${projectId}/runs/${res.runId}`);
      router.refresh();
    });
  }

  function handleCancel() {
    setMenuOpen(false);
    startTransition(async () => {
      const res = await cancelTestRun(runId, projectId);
      if (res.error) { toast.error(res.error); return; }
      toast.success("Run cancelled");
      router.refresh();
    });
  }

  function handleDeleteConfirm() {
    startTransition(async () => {
      const res = await deleteTestRun(runId, projectId);
      if (res.error) { toast.error(res.error); return; }
      toast.success("Run deleted");
      setDeleteOpen(false);
      router.refresh();
    });
  }

  const canCancel = CANCELLABLE.includes(status);
  const canRerun = RERUNNABLE.includes(status);

  return (
    <>
      <div ref={menuRef} className="relative inline-flex items-center gap-1">
        {/* View button — always visible */}
        <div className="group/tip relative inline-flex">
          <button
            onClick={handleView}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[#6B7A99] transition-colors hover:bg-[#E8F0FF] hover:text-[#2B6CFF]"
            aria-label="View run"
          >
            <Eye className="h-4 w-4" />
          </button>
          <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#0A1B3D] px-2.5 py-1 text-[11px] font-medium text-white opacity-0 shadow-md transition-opacity group-hover/tip:opacity-100">
            View
          </span>
        </div>

        {/* More menu */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen((v) => !v); }}
          disabled={isPending}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[#6B7A99] transition-colors hover:bg-[#E8F0FF] hover:text-[#2B6CFF] disabled:opacity-40"
          aria-label="More actions"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full z-30 mt-1 w-44 overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-xl">
            {canRerun && (
              <button
                onClick={(e) => { e.stopPropagation(); handleRerun(); }}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-[#0A1B3D] transition-colors hover:bg-[#F5F8FF]"
              >
                <RotateCcw className="h-3.5 w-3.5 text-[#2B6CFF]" />
                Re-run
              </button>
            )}
            {canCancel && (
              <button
                onClick={(e) => { e.stopPropagation(); handleCancel(); }}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-[#0A1B3D] transition-colors hover:bg-[#F5F8FF]"
              >
                <XCircle className="h-3.5 w-3.5 text-[#6B7A99]" />
                Cancel run
              </button>
            )}
            <div className="my-1 border-t border-[#F0F4FA]" />
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setDeleteOpen(true); }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-[#FF8A7A] transition-colors hover:bg-[#FFF0EE]"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        )}
      </div>

      {deleteOpen && (
        <DeleteConfirmModal
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeleteOpen(false)}
          isPending={isPending}
        />
      )}
    </>
  );
}
