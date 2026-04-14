"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Play, X, ChevronDown, ChevronRight, Loader2, CheckSquare, Square } from "lucide-react";
import { toast } from "sonner";

interface TestCase {
  id: string;
  title: string;
  scenario_type: string;
  priority: string;
}

interface Feature {
  id: string;
  name: string;
  test_cases: TestCase[];
}

interface Props {
  projectId: string;
  features: Feature[];
}

const SCENARIO_LABEL: Record<string, string> = {
  positive: "Positive",
  negative: "Negative",
  edge: "Edge",
};

const PRIORITY_COLOR: Record<string, string> = {
  critical: "text-[#5B21B6]",
  high:     "text-[#C2410C]",
  medium:   "text-[#854D0E]",
  low:      "text-[#1D4ED8]",
};

export function NewRunButton({ projectId, features }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [runName, setRunName] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  // Expand all features and select all test cases by default when modal opens
  useEffect(() => {
    if (open) {
      const allExpanded: Record<string, boolean> = {};
      const allIds = new Set<string>();
      features.forEach((f) => {
        allExpanded[f.id] = true;
        f.test_cases.forEach((tc) => allIds.add(tc.id));
      });
      setExpanded(allExpanded);
      setSelected(allIds);
      setRunName("");
    }
  }, [open, features]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && !isPending) setOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, isPending]);

  function toggleFeature(feature: Feature) {
    const ids = feature.test_cases.map((tc) => tc.id);
    const allSelected = ids.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function toggleCase(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleStart() {
    if (selected.size === 0) {
      toast.error("Select at least one test case");
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch("/api/test-runs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_id: projectId,
            name: runName.trim() || null,
            environment: "production",
            test_case_ids: Array.from(selected),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error(data.error ?? "Failed to create run");
          return;
        }
        toast.success("Test run started!");
        setOpen(false);
        router.push(`/projects/${projectId}/runs/${data.run.id}`);
        router.refresh();
      } catch {
        toast.error("Something went wrong");
      }
    });
  }

  const totalCases = features.reduce((sum, f) => sum + f.test_cases.length, 0);

  return (
    <>
      <Button onClick={() => setOpen(true)} leftIcon={<Play className="h-4 w-4" />}>
        New test run
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="new-run-title">
          <div className="absolute inset-0 bg-[#0A1B3D]/30 backdrop-blur-sm" onClick={() => { if (!isPending) setOpen(false); }} />
          <div className="relative z-10 flex w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl" style={{ maxHeight: "calc(100vh - 64px)" }}>

            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#F0F4FA] px-6 py-4">
              <h2 id="new-run-title" className="text-sm font-semibold text-[#0A1B3D]">New test run</h2>
              <button
                onClick={() => { if (!isPending) setOpen(false); }}
                disabled={isPending}
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#6B7A99] transition-colors hover:bg-[#F5F8FF] hover:text-[#0A1B3D] disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {/* Run name */}
              <div className="mb-5">
                <label className="mb-1.5 block text-xs font-semibold text-[#6B7A99]">Run name <span className="font-normal text-[#B0BAD0]">(optional)</span></label>
                <input
                  value={runName}
                  onChange={(e) => setRunName(e.target.value)}
                  placeholder="e.g. Sprint 12 regression"
                  className="w-full rounded-xl bg-[#F5F8FF] px-4 py-2.5 text-sm text-[#0A1B3D] outline-none placeholder-[#B0BAD0] transition-colors focus:bg-white focus:shadow-[0_0_0_1.5px_#2B6CFF]"
                />
              </div>

              {/* Test case selection */}
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-[#0A1B3D]">Test cases</span>
                <span className="text-xs text-[#6B7A99]">
                  <span className="font-semibold text-[#2B6CFF]">{selected.size}</span> / {totalCases} selected
                </span>
              </div>

              {totalCases === 0 ? (
                <p className="rounded-xl bg-[#F5F8FF] px-4 py-6 text-center text-sm text-[#6B7A99]">
                  No test cases found. Create test cases first.
                </p>
              ) : (
                <div className="space-y-2">
                  {features.filter((f) => f.test_cases.length > 0).map((feature) => {
                    const ids = feature.test_cases.map((tc) => tc.id);
                    const allSelected = ids.every((id) => selected.has(id));
                    const someSelected = ids.some((id) => selected.has(id));
                    const isExpanded = expanded[feature.id] ?? false;

                    return (
                      <div key={feature.id} className="overflow-hidden rounded-xl border border-[#E2E8F0]">
                        {/* Feature row */}
                        <div className="flex items-center gap-3 bg-[#F5F8FF] px-4 py-3">
                          <button
                            onClick={() => toggleFeature(feature)}
                            className="shrink-0 text-[#6B7A99] transition-colors hover:text-[#2B6CFF]"
                            aria-label={allSelected ? "Deselect all in feature" : "Select all in feature"}
                          >
                            {allSelected ? (
                              <CheckSquare className="h-4 w-4 text-[#2B6CFF]" />
                            ) : someSelected ? (
                              <CheckSquare className="h-4 w-4 text-[#B0BAD0]" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => setExpanded((p) => ({ ...p, [feature.id]: !p[feature.id] }))}
                            className="flex flex-1 items-center gap-2 text-left"
                          >
                            <span className="text-sm font-semibold text-[#0A1B3D]">{feature.name}</span>
                            <span className="rounded-full bg-[#E8F0FF] px-2 py-0.5 text-[10px] font-semibold text-[#2B6CFF]">
                              {ids.filter((id) => selected.has(id)).length}/{feature.test_cases.length}
                            </span>
                            <span className="ml-auto text-[#B0BAD0]">
                              {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                            </span>
                          </button>
                        </div>

                        {/* Test cases */}
                        {isExpanded && (
                          <div className="divide-y divide-[#F0F4FA]">
                            {feature.test_cases.map((tc) => (
                              <label key={tc.id} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[#F5F8FF]">
                                <input
                                  type="checkbox"
                                  checked={selected.has(tc.id)}
                                  onChange={() => toggleCase(tc.id)}
                                  className="h-4 w-4 cursor-pointer accent-[#2B6CFF]"
                                />
                                <span className="flex-1 text-sm text-[#0A1B3D]">{tc.title}</span>
                                <span className="shrink-0 text-xs text-[#B0BAD0]">
                                  {SCENARIO_LABEL[tc.scenario_type] ?? tc.scenario_type}
                                </span>
                                <span className={`shrink-0 text-xs font-medium capitalize ${PRIORITY_COLOR[tc.priority] ?? "text-[#6B7A99]"}`}>
                                  {tc.priority}
                                </span>
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
            <div className="flex items-center justify-end gap-2 border-t border-[#F0F4FA] px-6 py-4">
              <button
                onClick={() => { if (!isPending) setOpen(false); }}
                disabled={isPending}
                className="inline-flex h-9 items-center rounded-lg px-4 text-sm font-medium text-[#6B7A99] transition-colors hover:bg-[#F5F8FF] hover:text-[#0A1B3D] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleStart}
                disabled={isPending || selected.size === 0}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#2B6CFF] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1E5AE8] disabled:opacity-60"
              >
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Start run
                {selected.size > 0 && !isPending && (
                  <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">
                    {selected.size}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
