"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Settings2, X, Trash2, Plus, Loader2,
  ChevronDown, ChevronRight, CheckSquare, Square,
} from "lucide-react";
import { toast } from "sonner";
import { addCasesToRun, removeCaseFromRun } from "@/app/actions/test-runs";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface CaseRun { id: string; test_case_id: string; status: string; }
interface TestCase { id: string; title: string; scenario_type: string; priority: string; }
interface Feature { id: string; name: string; test_cases: TestCase[]; }

interface Props {
  runId: string;
  projectId: string;
  caseRuns: CaseRun[];
  testCaseMap: Record<string, { title: string; feature_name?: string }>;
  features: Feature[];
}

const SCENARIO_LABEL: Record<string, string> = { positive: "Positive", negative: "Negative", edge: "Edge" };
const PRIORITY_COLOR: Record<string, string> = {
  critical: "text-[#5B21B6]", high: "text-[#C2410C]", medium: "text-[#854D0E]", low: "text-[#1D4ED8]",
};

// ── Per-row delete button with its own pending state ─────────────────────────
function DeleteCaseButton({ onDelete }: { onDelete: () => Promise<void> }) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    try { await onDelete(); } finally { setPending(false); }
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#6B7A99] transition-colors hover:bg-[#FFF0EE] hover:text-[#FF8A7A] disabled:opacity-40"
      aria-label="Remove"
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
    </button>
  );
}

// ── Add picker panel (slide-in from right inside the modal) ──────────────────
function AddPicker({
  features,
  includedIds,
  onAdd,
  onClose,
}: {
  features: Feature[];
  includedIds: Set<string>;
  onAdd: (ids: string[]) => Promise<void>;
  onClose: () => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {};
    features.forEach((f) => { m[f.id] = true; });
    return m;
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const available = features.map((f) => ({
    ...f,
    test_cases: f.test_cases.filter((tc) => !includedIds.has(tc.id)),
  })).filter((f) => f.test_cases.length > 0);

  function toggleCase(id: string) {
    setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function toggleFeature(f: Feature & { test_cases: TestCase[] }) {
    const ids = f.test_cases.map((tc) => tc.id);
    const allSel = ids.every((id) => selected.has(id));
    setSelected((p) => {
      const n = new Set(p);
      allSel ? ids.forEach((id) => n.delete(id)) : ids.forEach((id) => n.add(id));
      return n;
    });
  }

  function handleAdd() {
    if (!selected.size) return;
    startTransition(async () => {
      await onAdd(Array.from(selected));
    });
  }

  return (
    <div className="flex h-full flex-col">
      {/* Sub-header */}
      <div className="flex items-center justify-between border-b border-[#F0F4FA] px-6 py-3">
        <span className="text-xs font-semibold text-[#0A1B3D]">
          Add test cases
          {selected.size > 0 && (
            <span className="ml-2 rounded-full bg-[#E8F0FF] px-2 py-0.5 text-[10px] font-bold text-[#2B6CFF]">
              {selected.size} selected
            </span>
          )}
        </span>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <button onClick={() => setSelected(new Set())} className="text-[11px] text-[#6B7A99] hover:text-[#FF8A7A]">Clear</button>
          )}
          <button onClick={onClose} className="inline-flex h-6 w-6 items-center justify-center rounded-lg text-[#6B7A99] hover:bg-[#F5F8FF] hover:text-[#0A1B3D]">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {available.length === 0 ? (
          <p className="py-6 text-center text-sm text-[#6B7A99]">All test cases are already included.</p>
        ) : (
          <div className="space-y-2">
            {available.map((feature) => {
              const ids = feature.test_cases.map((tc) => tc.id);
              const allSel = ids.every((id) => selected.has(id));
              const someSel = ids.some((id) => selected.has(id));
              const isExp = expanded[feature.id] ?? false;
              return (
                <div key={feature.id} className="overflow-hidden rounded-xl border border-[#E2E8F0]">
                  <div className="flex items-center gap-2 bg-[#F5F8FF] px-3 py-2.5">
                    <button onClick={() => toggleFeature(feature)} className="shrink-0 text-[#6B7A99] hover:text-[#2B6CFF]">
                      {allSel ? <CheckSquare className="h-4 w-4 text-[#2B6CFF]" /> : someSel ? <CheckSquare className="h-4 w-4 text-[#B0BAD0]" /> : <Square className="h-4 w-4" />}
                    </button>
                    <button onClick={() => setExpanded((p) => ({ ...p, [feature.id]: !p[feature.id] }))} className="flex flex-1 items-center gap-2 text-left min-w-0">
                      <span className="truncate text-sm font-semibold text-[#0A1B3D]">{feature.name}</span>
                      <span className="shrink-0 rounded-full bg-[#E8F0FF] px-2 py-0.5 text-[10px] font-semibold text-[#2B6CFF]">
                        {ids.filter((id) => selected.has(id)).length}/{feature.test_cases.length}
                      </span>
                      <span className="ml-auto shrink-0 text-[#B0BAD0]">
                        {isExp ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      </span>
                    </button>
                  </div>
                  {isExp && (
                    <div className="divide-y divide-[#F0F4FA]">
                      {feature.test_cases.map((tc) => (
                        <label key={tc.id} className="flex cursor-pointer items-center gap-3 px-3 py-2 transition-colors hover:bg-[#F5F8FF]">
                          <input type="checkbox" checked={selected.has(tc.id)} onChange={() => toggleCase(tc.id)} className="h-4 w-4 cursor-pointer accent-[#2B6CFF]" />
                          <span className="flex-1 min-w-0 truncate text-sm text-[#0A1B3D]">{tc.title}</span>
                          <span className="shrink-0 text-xs text-[#B0BAD0]">{SCENARIO_LABEL[tc.scenario_type] ?? tc.scenario_type}</span>
                          <span className={`shrink-0 text-xs font-medium capitalize ${PRIORITY_COLOR[tc.priority] ?? "text-[#6B7A99]"}`}>{tc.priority}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {available.length > 0 && (
        <div className="border-t border-[#F0F4FA] px-4 py-3">
          <button
            onClick={handleAdd}
            disabled={isPending || selected.size === 0}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2B6CFF] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1E5AE8] disabled:opacity-60"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Add {selected.size > 0 ? `${selected.size} ` : ""}case{selected.size !== 1 ? "s" : ""}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function ManageRunCases({ runId, projectId, caseRuns, testCaseMap, features }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  // Optimistic local list so UI updates immediately without waiting for server rerender
  const [localCaseRuns, setLocalCaseRuns] = useState<CaseRun[]>(caseRuns);

  // Sync if server props change (e.g. after router.refresh completes)
  useEffect(() => { setLocalCaseRuns(caseRuns); }, [caseRuns]);

  const includedIds = new Set(localCaseRuns.map((cr) => cr.test_case_id));

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  async function handleRemove(testCaseId: string) {
    // Optimistically remove from local state immediately
    setLocalCaseRuns((prev) => prev.filter((cr) => cr.test_case_id !== testCaseId));
    const res = await removeCaseFromRun(runId, projectId, testCaseId);
    if (res.error) {
      // Revert on error
      setLocalCaseRuns(caseRuns);
      toast.error(res.error);
      return;
    }
    toast.success("Test case removed");
    router.refresh();
  }

  async function handleAdd(ids: string[]) {
    const res = await addCasesToRun(runId, projectId, ids);
    if (res.error) { toast.error(res.error); return; }
    toast.success(`${ids.length} test case${ids.length > 1 ? "s" : ""} added`);
    setShowPicker(false);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => { setShowPicker(false); setOpen(true); }}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#D1DEFF] bg-white px-3 text-sm font-medium text-[#2B6CFF] transition-colors hover:bg-[#E8F0FF]"
      >
        <Settings2 className="h-3.5 w-3.5" />
        Manage cases
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-[#0A1B3D]/30 backdrop-blur-sm" onClick={() => setOpen(false)} />

          {/* Modal — split when picker is open */}
          <div className={`relative z-10 flex rounded-2xl bg-white shadow-2xl overflow-hidden transition-all ${showPicker ? "w-full max-w-2xl" : "w-full max-w-md"}`} style={{ maxHeight: "calc(100vh - 64px)" }}>

            {/* Left panel — current cases */}
            <div className="flex min-w-0 flex-1 flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#F0F4FA] px-6 py-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-[#0A1B3D]">Test cases in this run</h2>
                  <span className="rounded-full bg-[#E8F0FF] px-2.5 py-0.5 text-xs font-semibold text-[#2B6CFF]">
                    {localCaseRuns.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowPicker((v) => !v)}
                    className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors ${
                      showPicker
                        ? "border-[#2B6CFF] bg-[#E8F0FF] text-[#2B6CFF]"
                        : "border-[#D1DEFF] bg-white text-[#2B6CFF] hover:bg-[#E8F0FF]"
                    }`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add test case
                  </button>
                  <button onClick={() => setOpen(false)} className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#6B7A99] transition-colors hover:bg-[#F5F8FF] hover:text-[#0A1B3D]">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto px-4 py-3">
                {localCaseRuns.length === 0 ? (
                  <p className="py-8 text-center text-sm text-[#6B7A99]">No test cases yet. Click &ldquo;Add test case&rdquo; to include some.</p>
                ) : (
                  <div className="space-y-1.5">
                    {localCaseRuns.map((cr) => {
                      const tc = testCaseMap[cr.test_case_id];
                      return (
                        <div key={cr.id} className="flex items-center gap-3 rounded-xl border border-[#F0F4FA] px-4 py-3 transition-colors hover:bg-[#F5F8FF]">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm text-[#0A1B3D]">{tc?.title ?? "Unknown"}</p>
                            {tc?.feature_name && (
                              <p className="mt-0.5 truncate text-xs text-[#B0BAD0]">{tc.feature_name}</p>
                            )}
                          </div>
                          <StatusBadge status={cr.status as "passed" | "failed" | "pending"} size="sm" />
                          <DeleteCaseButton onDelete={() => handleRemove(cr.test_case_id)} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-[#F0F4FA] px-6 py-4 flex justify-end">
                <button onClick={() => setOpen(false)} className="inline-flex h-9 items-center rounded-lg px-4 text-sm font-medium text-[#6B7A99] transition-colors hover:bg-[#F5F8FF]">
                  Close
                </button>
              </div>
            </div>

            {/* Right panel — add picker */}
            {showPicker && (
              <div className="flex w-72 shrink-0 flex-col border-l border-[#F0F4FA]">
                <AddPicker
                  features={features}
                  includedIds={includedIds}
                  onAdd={handleAdd}
                  onClose={() => setShowPicker(false)}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
