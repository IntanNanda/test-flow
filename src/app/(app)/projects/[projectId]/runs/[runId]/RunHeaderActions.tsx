"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cancelTestRun, rerunTestRun } from "@/app/actions/test-runs";
import type { RunStatus } from "@/types/database";

const CANCELLABLE: RunStatus[] = ["pending", "queued", "running"];
const RERUNNABLE: RunStatus[] = ["passed", "failed", "error", "cancelled"];

interface Props {
  runId: string;
  projectId: string;
  status: RunStatus;
}

export function RunHeaderActions({ runId, projectId, status }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const canCancel = CANCELLABLE.includes(status);
  const canRerun = RERUNNABLE.includes(status);

  function handleRerun() {
    startTransition(async () => {
      const res = await rerunTestRun(runId, projectId);
      if (res.error) { toast.error(res.error); return; }
      toast.success("Re-run started!");
      router.push(`/projects/${projectId}/runs/${res.runId}`);
    });
  }

  function handleCancel() {
    startTransition(async () => {
      const res = await cancelTestRun(runId, projectId);
      if (res.error) { toast.error(res.error); return; }
      toast.success("Run cancelled");
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      {canCancel && (
        <button
          onClick={handleCancel}
          disabled={isPending}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm font-medium text-[#6B7A99] transition-colors hover:border-[#FF8A7A] hover:text-[#FF8A7A] disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
          Cancel
        </button>
      )}
      {canRerun && (
        <button
          onClick={handleRerun}
          disabled={isPending}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#2B6CFF] px-3 text-sm font-medium text-white transition-colors hover:bg-[#1E5AE8] disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
          Re-run
        </button>
      )}
    </div>
  );
}
