"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CaseRunRow } from "./CaseRunRow";
import type { LighthouseResult } from "@/types/database";

type CaseRun = {
  id: string; status: string; duration_ms: number | null;
  test_case_id: string;
  error_message: string | null; error_stack: string | null;
  screenshot_urls: string[]; console_log: string | null; step_results: unknown;
};

type TestCaseMap = Record<string, { title: string; feature_name?: string; test_type: string }>;

const FILTERS = [
  { label: "All",     value: ""        },
  { label: "Passed",  value: "passed"  },
  { label: "Failed",  value: "failed"  },
  { label: "Errored", value: "error"   },
  { label: "Skipped", value: "skipped" },
  { label: "Pending", value: "pending" },
] as const;

const PAGE_SIZE = 10;

export function CaseRunTable({
  caseRuns,
  testCaseMap,
  lhMap,
}: {
  caseRuns: CaseRun[];
  testCaseMap: TestCaseMap;
  lhMap: Record<string, LighthouseResult[]>;
}) {
  const [activeFilter, setActiveFilter] = useState("");
  const [page, setPage] = useState(1);

  const filtered = activeFilter
    ? caseRuns.filter((cr) => cr.status === activeFilter)
    : caseRuns;

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const slice = filtered.slice(start, start + PAGE_SIZE);

  function handleFilter(value: string) {
    setActiveFilter(value);
    setPage(1);
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      {/* Header with filter pills */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0F4FA] px-6 py-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-[#0A1B3D]">Test case results</h2>
          <span className="rounded-full bg-[#E8F0FF] px-2.5 py-0.5 text-xs font-semibold text-[#2B6CFF]">
            {total}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {FILTERS.map(({ label, value }) => {
            const count = value ? caseRuns.filter((cr) => cr.status === value).length : caseRuns.length;
            const isActive = activeFilter === value;
            return (
              <button
                key={label}
                onClick={() => handleFilter(value)}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-[#2B6CFF] text-white"
                    : "text-[#6B7A99] hover:bg-[#F5F8FF] hover:text-[#0A1B3D]"
                }`}
              >
                {label}
                <span className={`tabular-nums ${isActive ? "text-white/80" : "text-[#B0BAD0]"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <table className="w-full text-sm" role="grid" aria-label="Test case results">
        <thead>
          <tr className="border-b border-[#F0F4FA]">
            <th scope="col" className="w-12 px-6 py-3 text-left text-xs font-medium text-[#6B7A99]">No.</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#6B7A99]">Title</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#6B7A99]">Status</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#6B7A99]">Feature</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#6B7A99]">Duration</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#6B7A99]">Details</th>
          </tr>
        </thead>
        <tbody>
          {slice.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-sm text-[#6B7A99]">
                {caseRuns.length === 0
                  ? "No test cases in this run yet. Use \"Manage cases\" to add some."
                  : "No cases match this filter."}
              </td>
            </tr>
          ) : (
            slice.map((cr, idx) => (
              <CaseRunRow
                key={cr.id}
                index={start + idx + 1}
                caseRun={cr}
                testCaseTitle={testCaseMap[cr.test_case_id]?.title ?? "Unknown test case"}
                testCaseFeature={testCaseMap[cr.test_case_id]?.feature_name}
                testType={testCaseMap[cr.test_case_id]?.test_type ?? "functional"}
                lighthouseResults={lhMap[cr.id] ?? []}
                isLast={idx === slice.length - 1}
              />
            ))
          )}
        </tbody>
      </table>

      {/* Pagination footer — always visible */}
      <div className="flex items-center justify-between border-t border-[#F0F4FA] px-6 py-3">
        <p className="text-xs text-[#6B7A99]">
          Showing{" "}
          <span className="font-medium text-[#0A1B3D]">{total === 0 ? 0 : start + 1}–{Math.min(start + PAGE_SIZE, total)}</span>
          {" "}of{" "}
          <span className="font-medium text-[#0A1B3D]">{total}</span> results
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
  );
}
