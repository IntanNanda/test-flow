"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, Pencil, Trash2, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { deleteFeature, updateFeature } from "@/app/actions/features";

interface Props {
  featureId: string;
  projectId: string;
  name: string;
  description: string | null;
}

function EditModal({
  featureId, projectId, name, description, onClose,
}: Props & { onClose: () => void }) {
  const [nameVal, setNameVal] = useState(name);
  const [descVal, setDescVal] = useState(description ?? "");
  const [error, setError] = useState("");
  const [isPending, start] = useTransition();
  const router = useRouter();

  function save() {
    if (!nameVal.trim()) { setError("Name is required"); return; }
    const fd = new FormData();
    fd.set("name", nameVal.trim());
    fd.set("description", descVal.trim());
    start(async () => {
      const res = await updateFeature(featureId, projectId, {}, fd);
      if (res.message === "ok") {
        toast.success("Test suite updated");
        router.refresh();
        onClose();
      } else {
        setError(res.errors?.name?.[0] ?? res.message ?? "Something went wrong");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-[#0A1B3D]/30 backdrop-blur-sm" onClick={() => { if (!isPending) onClose(); }} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#F0F4FA] px-6 py-4">
          <h2 className="text-sm font-semibold text-[#0A1B3D]">Edit test suite</h2>
          <button onClick={() => { if (!isPending) onClose(); }} disabled={isPending} className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#6B7A99] transition-colors hover:bg-[#F5F8FF] hover:text-[#0A1B3D] disabled:opacity-50">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#6B7A99]">Name <span className="text-[#FF8A7A]">*</span></label>
            <input
              value={nameVal}
              onChange={(e) => { setNameVal(e.target.value); setError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape" && !isPending) onClose(); }}
              autoFocus
              className="w-full rounded-xl bg-[#F5F8FF] px-4 py-2.5 text-sm text-[#0A1B3D] outline-none placeholder-[#B0BAD0] transition-colors focus:bg-white focus:shadow-[0_0_0_1.5px_#2B6CFF]"
            />
            {error && <p className="mt-1.5 text-[11px] text-[#FF8A7A]">{error}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#6B7A99]">Description</label>
            <textarea
              value={descVal}
              onChange={(e) => setDescVal(e.target.value)}
              rows={3}
              placeholder="Add a description…"
              className="w-full resize-none rounded-xl bg-[#F5F8FF] px-4 py-2.5 text-sm text-[#0A1B3D] outline-none placeholder-[#B0BAD0] transition-colors focus:bg-white focus:shadow-[0_0_0_1.5px_#2B6CFF]"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-[#F0F4FA] px-6 py-4">
          <button onClick={() => { if (!isPending) onClose(); }} disabled={isPending} className="inline-flex h-9 items-center rounded-lg px-4 text-sm font-medium text-[#6B7A99] transition-colors hover:bg-[#F5F8FF] disabled:opacity-50">
            Cancel
          </button>
          <button onClick={save} disabled={isPending} className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#2B6CFF] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1E5AE8] disabled:opacity-60">
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({
  featureId, projectId, name, onClose,
}: { featureId: string; projectId: string; name: string; onClose: () => void }) {
  const [isPending, start] = useTransition();
  const router = useRouter();

  function confirm() {
    start(async () => {
      const res = await deleteFeature(featureId, projectId);
      if (res.error) { toast.error(res.error); return; }
      toast.success("Test suite deleted");
      router.refresh();
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-[#0A1B3D]/30 backdrop-blur-sm" onClick={() => { if (!isPending) onClose(); }} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#F0F4FA] px-6 py-4">
          <h2 className="text-sm font-semibold text-[#0A1B3D]">Delete test suite</h2>
          <button onClick={() => { if (!isPending) onClose(); }} disabled={isPending} className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#6B7A99] transition-colors hover:bg-[#F5F8FF] hover:text-[#0A1B3D] disabled:opacity-50">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-[#6B7A99]">
            Are you sure you want to delete <span className="font-semibold text-[#0A1B3D]">&ldquo;{name}&rdquo;</span>? All test cases inside will also be deleted. This cannot be undone.
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-[#F0F4FA] px-6 py-4">
          <button onClick={() => { if (!isPending) onClose(); }} disabled={isPending} className="inline-flex h-9 items-center rounded-lg px-4 text-sm font-medium text-[#6B7A99] transition-colors hover:bg-[#F5F8FF] disabled:opacity-50">
            Cancel
          </button>
          <button onClick={confirm} disabled={isPending} className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#FF8A7A] px-4 text-sm font-medium text-white transition-colors hover:bg-[#F97060] disabled:opacity-60">
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export function SuiteActions({ featureId, projectId, name, description }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
        {/* View */}
        <div className="group/tip relative">
          <a
            href={`/projects/${projectId}/features/${featureId}`}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[#6B7A99] transition-colors hover:bg-[#E8F0FF] hover:text-[#2B6CFF]"
            aria-label="View"
          >
            <Eye className="h-3.5 w-3.5" />
          </a>
          <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#0A1B3D] px-2.5 py-1 text-[11px] font-medium text-white opacity-0 shadow-md transition-opacity group-hover/tip:opacity-100">View</span>
        </div>

        {/* Edit */}
        <div className="group/edit relative">
          <button
            onClick={() => setEditOpen(true)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[#6B7A99] transition-colors hover:bg-[#E8F0FF] hover:text-[#2B6CFF]"
            aria-label="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#0A1B3D] px-2.5 py-1 text-[11px] font-medium text-white opacity-0 shadow-md transition-opacity group-hover/edit:opacity-100">Edit</span>
        </div>

        {/* Delete */}
        <div className="group/del relative">
          <button
            onClick={() => setDeleteOpen(true)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[#6B7A99] transition-colors hover:bg-[#FFF0EE] hover:text-[#FF8A7A]"
            aria-label="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#0A1B3D] px-2.5 py-1 text-[11px] font-medium text-white opacity-0 shadow-md transition-opacity group-hover/del:opacity-100">Delete</span>
        </div>
      </div>

      {editOpen && (
        <EditModal featureId={featureId} projectId={projectId} name={name} description={description} onClose={() => setEditOpen(false)} />
      )}
      {deleteOpen && (
        <DeleteModal featureId={featureId} projectId={projectId} name={name} onClose={() => setDeleteOpen(false)} />
      )}
    </>
  );
}
