"use client";

import { useState, useMemo, useTransition, useEffect, useRef } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { FlaskConical, Gauge, Zap, Eye, ChevronLeft, ChevronRight, Search, X, SlidersHorizontal, Pencil, Trash2, Loader2 } from "lucide-react";
import { ExportButton } from "@/components/ui/ExportButton";
import { formatRelativeTime } from "@/lib/utils";
import { updateTestCase, deleteTestCase } from "@/app/actions/test-cases";
import type { TestCase } from "@/types/database";

const SCENARIO_CONFIG: Record<string, { label: string; className: string }> = {
  positive: { label: "Positive", className: "bg-[#E8F0FF] text-[#1E40AF]" },
  negative: { label: "Negative", className: "bg-[#FFF0EE] text-[#C2410C]" },
  edge:     { label: "Edge",     className: "bg-[#FEF9C3] text-[#854D0E]" },
};

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  critical: { label: "Critical", className: "bg-[#EDE9FE] text-[#5B21B6]" },
  high:     { label: "High",     className: "bg-[#FFF0EE] text-[#C2410C]" },
  medium:   { label: "Medium",   className: "bg-[#FEF9C3] text-[#854D0E]" },
  low:      { label: "Low",      className: "bg-[#E8F0FF] text-[#1D4ED8]"  },
};

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType }> = {
  functional:           { label: "Functional", icon: FlaskConical },
  frontend_performance: { label: "Lighthouse", icon: Gauge },
  api_performance:      { label: "API Perf",   icon: Zap },
};

const STATUS_OPTIONS = ["passed", "failed", "pending"] as const;
const SCENARIO_OPTIONS = ["positive", "negative", "edge"] as const;
const PRIORITY_OPTIONS = ["critical", "high", "medium", "low"] as const;
const TYPE_OPTIONS = ["functional", "frontend_performance", "api_performance"] as const;

const PAGE_SIZE = 10;

interface Filters {
  status: string;
  scenario: string;
  priority: string;
}

interface Counts {
  total: number;
  passed: number;
  failed: number;
  pending: number;
}

interface Props {
  testCases: TestCase[];
  projectId: string;
  featureId: string;
  featureName: string;
  counts?: Counts;
}

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({
  tc,
  projectId,
  featureId,
  onClose,
}: {
  tc: TestCase;
  projectId: string;
  featureId: string;
  onClose: () => void;
}) {
  const [title, setTitle]       = useState(tc.title);
  const [scenario, setScenario] = useState(tc.scenario_type);
  const [priority, setPriority] = useState(tc.priority);
  const [type, setType]         = useState(tc.test_type);
  const [error, setError]       = useState("");
  const [isPending, start]      = useTransition();
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTimeout(() => titleRef.current?.focus(), 50); }, []);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && !isPending) onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isPending, onClose]);

  function save() {
    if (!title.trim()) { setError("Title is required"); return; }
    const fd = new FormData();
    fd.set("title", title.trim());
    fd.set("scenario_type", scenario);
    fd.set("priority", priority);
    fd.set("test_type", type);
    start(async () => {
      const res = await updateTestCase(tc.id, featureId, projectId, {}, fd);
      if (res.message === "ok") {
        onClose();
      } else {
        setError(res.errors?.title?.[0] ?? res.message ?? "Something went wrong");
      }
    });
  }

  const selectClass = "w-full cursor-pointer appearance-none rounded-xl bg-[#F5F8FF] px-4 py-2.5 pr-8 text-sm text-[#0A1B3D] outline-none transition-colors focus:bg-white focus:shadow-[0_0_0_1.5px_#2B6CFF]";
  const chevronBg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7A99' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="edit-tc-title">
      <div className="absolute inset-0 bg-[#0A1B3D]/30 backdrop-blur-sm" onClick={() => { if (!isPending) onClose(); }} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#F0F4FA] px-6 py-4">
          <h2 id="edit-tc-title" className="text-sm font-semibold text-[#0A1B3D]">Edit test case</h2>
          <button onClick={() => { if (!isPending) onClose(); }} disabled={isPending} className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#6B7A99] transition-colors hover:bg-[#F5F8FF] hover:text-[#0A1B3D] disabled:opacity-50" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#6B7A99]">Title <span className="text-[#FF8A7A]">*</span></label>
            <input
              ref={titleRef}
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") save(); }}
              placeholder="Test case title"
              className="w-full rounded-xl bg-[#F5F8FF] px-4 py-2.5 text-sm text-[#0A1B3D] outline-none placeholder-[#B0BAD0] transition-colors focus:bg-white focus:shadow-[0_0_0_1.5px_#2B6CFF]"
            />
            {error && <p className="mt-1.5 text-[11px] text-[#FF8A7A]">{error}</p>}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#6B7A99]">Scenario</label>
              <select value={scenario} onChange={(e) => setScenario(e.target.value as typeof scenario)} className={selectClass} style={{ backgroundImage: chevronBg, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}>
                {SCENARIO_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#6B7A99]">Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)} className={selectClass} style={{ backgroundImage: chevronBg, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}>
                {PRIORITY_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#6B7A99]">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className={selectClass} style={{ backgroundImage: chevronBg, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}>
                {TYPE_OPTIONS.map((o) => (
                  <option key={o} value={o}>{TYPE_CONFIG[o]?.label ?? o}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#F0F4FA] px-6 py-4">
          <button onClick={() => { if (!isPending) onClose(); }} disabled={isPending} className="inline-flex h-9 items-center rounded-lg px-4 text-sm font-medium text-[#6B7A99] transition-colors hover:bg-[#F5F8FF] hover:text-[#0A1B3D] disabled:opacity-50">
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

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
function DeleteModal({
  tc,
  projectId,
  featureId,
  onClose,
}: {
  tc: TestCase;
  projectId: string;
  featureId: string;
  onClose: () => void;
}) {
  const [isPending, start] = useTransition();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && !isPending) onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isPending, onClose]);

  function confirm() {
    start(async () => {
      await deleteTestCase(tc.id, featureId, projectId);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="delete-tc-title">
      <div className="absolute inset-0 bg-[#0A1B3D]/30 backdrop-blur-sm" onClick={() => { if (!isPending) onClose(); }} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#F0F4FA] px-6 py-4">
          <h2 id="delete-tc-title" className="text-sm font-semibold text-[#0A1B3D]">Delete test case</h2>
          <button onClick={() => { if (!isPending) onClose(); }} disabled={isPending} className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#6B7A99] transition-colors hover:bg-[#F5F8FF] hover:text-[#0A1B3D] disabled:opacity-50" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="text-sm text-[#6B7A99]">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-[#0A1B3D]">&ldquo;{tc.title}&rdquo;</span>?
            This action cannot be undone.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#F0F4FA] px-6 py-4">
          <button onClick={() => { if (!isPending) onClose(); }} disabled={isPending} className="inline-flex h-9 items-center rounded-lg px-4 text-sm font-medium text-[#6B7A99] transition-colors hover:bg-[#F5F8FF] hover:text-[#0A1B3D] disabled:opacity-50">
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

// ── Main Table ────────────────────────────────────────────────────────────────
export function TestCaseTable({ testCases, projectId, featureId, featureName, counts }: Props) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>({ status: "", scenario: "", priority: "" });
  const [filterOpen, setFilterOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TestCase | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TestCase | null>(null);

  const filtered = useMemo(() => {
    return testCases.filter((tc) => {
      if (search && !tc.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (filters.status) {
        const status = tc.last_run_status ?? "pending";
        if (status !== filters.status) return false;
      }
      if (filters.scenario && tc.scenario_type !== filters.scenario) return false;
      if (filters.priority && tc.priority !== filters.priority) return false;
      return true;
    });
  }, [testCases, search, filters]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const slice = filtered.slice(start, start + PAGE_SIZE);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  function setFilter(key: keyof Filters, value: string) {
    setFilters((f) => ({ ...f, [key]: f[key] === value ? "" : value }));
    setPage(1);
  }

  function clearAll() {
    setFilters({ status: "", scenario: "", priority: "" });
    setSearch("");
    setPage(1);
  }

  const statCards = counts
    ? [
        { label: "Total",   value: counts.total,   colorClass: "text-[#0A1B3D]", filter: "" },
        { label: "Passed",  value: counts.passed,  colorClass: "text-[#0D9488]", filter: "passed" },
        { label: "Failed",  value: counts.failed,  colorClass: "text-[#FF8A7A]", filter: "failed" },
        { label: "Pending", value: counts.pending, colorClass: "text-[#2B6CFF]", filter: "pending" },
      ]
    : null;

  return (
    <>
      {/* Stat cards */}
      {statCards && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statCards.map(({ label, value, colorClass, filter: f }) => {
            const isActive = filters.status === f;
            return (
              <button
                key={label}
                onClick={() => { setFilter("status", f); setPage(1); }}
                className={`flex flex-col gap-1 rounded-xl border px-5 py-4 text-left shadow-sm transition-all ${
                  isActive
                    ? "border-[#2B6CFF] bg-[#E8F0FF] ring-1 ring-[#2B6CFF]"
                    : "border-[#E2E8F0] bg-white hover:border-[#2B6CFF] hover:bg-[#F5F8FF]"
                }`}
              >
                <span className={`text-2xl font-bold ${colorClass}`}>{value}</span>
                <span className="text-xs font-medium text-[#6B7A99]">{label}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        {/* Header bar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#F0F4FA] px-6 py-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-[#0A1B3D]">Test Cases</h2>
            <span className="rounded-full bg-[#E8F0FF] px-2.5 py-0.5 text-xs font-semibold text-[#2B6CFF]">
              {total}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Search */}
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-[#B0BAD0]" aria-hidden="true" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search title…"
                className="h-8 w-44 rounded-lg bg-[#F5F8FF] pl-8 pr-7 text-xs text-[#0A1B3D] placeholder-[#B0BAD0] outline-none transition-colors focus:bg-white focus:shadow-[0_0_0_1.5px_#2B6CFF]"
              />
              {search && (
                <button onClick={() => { setSearch(""); setPage(1); }} className="absolute right-2 text-[#B0BAD0] hover:text-[#6B7A99]" aria-label="Clear search">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Filter */}
            <div className="relative">
              <button
                onClick={() => setFilterOpen((v) => !v)}
                className={`inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#D1DEFF] bg-white px-3 text-xs font-medium text-[#2B6CFF] transition-colors hover:bg-[#E8F0FF] ${activeFilterCount > 0 ? "bg-[#E8F0FF]" : ""}`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                Filter
                {activeFilterCount > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#2B6CFF] text-[10px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {filterOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setFilterOpen(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-64 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xl">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#0A1B3D]">Filter by</span>
                      {activeFilterCount > 0 && (
                        <button onClick={clearAll} className="text-[11px] font-medium text-[#6B7A99] hover:text-[#FF8A7A]">
                          Clear all
                        </button>
                      )}
                    </div>
                    {(["status", "scenario", "priority"] as const).map((key) => {
                      const options = key === "status" ? STATUS_OPTIONS : key === "scenario" ? SCENARIO_OPTIONS : PRIORITY_OPTIONS;
                      return (
                        <div key={key} className="mb-3 last:mb-0">
                          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-[#6B7A99]">{key}</label>
                          <select
                            value={filters[key]}
                            onChange={(e) => setFilter(key, e.target.value)}
                            className="w-full cursor-pointer appearance-none rounded-lg bg-[#F5F8FF] px-3 py-2 pr-8 text-xs text-[#0A1B3D] outline-none transition-colors focus:bg-white focus:shadow-[0_0_0_1.5px_#2B6CFF]"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7A99' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}
                          >
                            <option value="">All {key}es</option>
                            {options.map((o) => (
                              <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <ExportButton featureId={featureId} featureName={featureName} />
          </div>
        </div>

        <table className="w-full text-sm" role="grid" aria-label="Test cases">
          <thead>
            <tr className="border-b border-[#F0F4FA]">
              <th scope="col" className="w-12 px-6 py-3 text-left text-xs font-medium text-[#6B7A99]">No.</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#6B7A99]">Title</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#6B7A99]">Tags</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#6B7A99]">Status</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#6B7A99]">Scenario</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#6B7A99]">Priority</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#6B7A99]">Type</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#6B7A99]">Last run</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-[#6B7A99]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-sm text-[#6B7A99]">
                  No test cases match your search or filters.
                </td>
              </tr>
            ) : (
              slice.map((tc, idx) => {
                const scenario = SCENARIO_CONFIG[tc.scenario_type];
                const priority = PRIORITY_CONFIG[tc.priority];
                const typeConf = TYPE_CONFIG[tc.test_type] ?? { label: tc.test_type, icon: FlaskConical };
                const TypeIcon = typeConf.icon;
                const rowNum = start + idx + 1;
                const isLast = idx === slice.length - 1;

                return (
                  <tr
                    key={tc.id}
                    className={`transition-colors hover:bg-[#F5F8FF] ${!isLast ? "border-b border-[#F0F4FA]" : ""}`}
                  >
                    <td className="px-6 py-4 text-xs tabular-nums text-[#C4CDDE]">{rowNum}</td>

                    <td className="max-w-xs px-4 py-4">
                      <Link
                        href={`/projects/${projectId}/features/${featureId}/test-cases/${tc.id}`}
                        className="font-medium text-[#0A1B3D] transition-colors hover:text-[#2B6CFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B6CFF]"
                      >
                        {tc.title}
                      </Link>
                      {tc.tags.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {tc.tags.map((tag) => (
                            <span key={tag} className="rounded-full bg-[#E8F0FF] px-2 py-0.5 text-[11px] font-medium text-[#2B6CFF]">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge status={(tc.last_run_status as "passed" | "failed" | "pending") ?? "pending"} size="sm" />
                    </td>

                    <td className="px-4 py-4">
                      {scenario && (
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${scenario.className}`}>
                          {scenario.label}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      {priority && (
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${priority.className}`}>
                          {priority.label}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1.5 text-xs text-[#6B7A99]">
                        <TypeIcon className="h-3.5 w-3.5 text-[#2B6CFF]" aria-hidden="true" />
                        {typeConf.label}
                      </span>
                    </td>

                    <td className="px-4 py-4 tabular-nums text-xs text-[#6B7A99]">
                      {tc.last_run_at ? formatRelativeTime(tc.last_run_at) : (
                        <span className="text-[#C4CDDE]">—</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1">
                        {/* View */}
                        <div className="group/tip relative inline-flex">
                          <Link
                            href={`/projects/${projectId}/features/${featureId}/test-cases/${tc.id}`}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[#6B7A99] transition-colors hover:bg-[#E8F0FF] hover:text-[#2B6CFF]"
                            aria-label={`View ${tc.title}`}
                          >
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          </Link>
                          <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#0A1B3D] px-2.5 py-1 text-[11px] font-medium text-white opacity-0 shadow-md transition-opacity group-hover/tip:opacity-100">
                            View detail
                          </span>
                        </div>

                        {/* Edit */}
                        <div className="group/edit relative inline-flex">
                          <button
                            onClick={() => setEditTarget(tc)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[#6B7A99] transition-colors hover:bg-[#E8F0FF] hover:text-[#2B6CFF]"
                            aria-label={`Edit ${tc.title}`}
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                          <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#0A1B3D] px-2.5 py-1 text-[11px] font-medium text-white opacity-0 shadow-md transition-opacity group-hover/edit:opacity-100">
                            Edit
                          </span>
                        </div>

                        {/* Delete */}
                        <div className="group/del relative inline-flex">
                          <button
                            onClick={() => setDeleteTarget(tc)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[#6B7A99] transition-colors hover:bg-[#FFF0EE] hover:text-[#FF8A7A]"
                            aria-label={`Delete ${tc.title}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                          <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#0A1B3D] px-2.5 py-1 text-[11px] font-medium text-white opacity-0 shadow-md transition-opacity group-hover/del:opacity-100">
                            Delete
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination footer */}
        <div className="flex items-center justify-between border-t border-[#F0F4FA] px-6 py-3">
          <p className="text-xs text-[#6B7A99]">
            Showing{" "}
            <span className="font-medium text-[#0A1B3D]">{total === 0 ? 0 : start + 1}–{Math.min(start + PAGE_SIZE, total)}</span>
            {" "}of{" "}
            <span className="font-medium text-[#0A1B3D]">{total}</span> test cases
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={safePage === 1}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#6B7A99] transition-colors hover:bg-[#E8F0FF] hover:text-[#2B6CFF] disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                  p === safePage ? "bg-[#2B6CFF] text-white" : "text-[#6B7A99] hover:bg-[#E8F0FF] hover:text-[#2B6CFF]"
                }`}
                aria-label={`Page ${p}`}
                aria-current={p === safePage ? "page" : undefined}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={safePage === totalPages}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#6B7A99] transition-colors hover:bg-[#E8F0FF] hover:text-[#2B6CFF] disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {editTarget && (
        <EditModal
          tc={editTarget}
          projectId={projectId}
          featureId={featureId}
          onClose={() => setEditTarget(null)}
        />
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <DeleteModal
          tc={deleteTarget}
          projectId={projectId}
          featureId={featureId}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
