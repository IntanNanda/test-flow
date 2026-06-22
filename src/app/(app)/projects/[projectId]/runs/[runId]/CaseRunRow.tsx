"use client";

import { useState } from "react";
import {
  ChevronDown, Clock, CheckCircle2, XCircle,
  Image as ImageIcon, Terminal, FileJson,
} from "lucide-react";
import { StatusBadge, type StatusValue } from "@/components/ui/StatusBadge";
import { formatDuration } from "@/lib/utils";
import type { LighthouseResult } from "@/types/database";

function scoreColor(score: number | null) {
  if (score == null) return "text-[#6B7A99]";
  if (score >= 90) return "text-[#0D9488]";
  if (score >= 50) return "text-[#854D0E]";
  return "text-[#FF8A7A]";
}

export function CaseRunRow({
  index, isLast, caseRun, testCaseTitle, testCaseFeature, testType, lighthouseResults,
}: {
  index: number;
  isLast: boolean;
  caseRun: {
    id: string; status: string; duration_ms: number | null;
    error_message: string | null; error_stack: string | null;
    screenshot_urls: string[]; console_log: string | null; step_results: unknown;
  };
  testCaseTitle: string;
  testCaseFeature?: string;
  testType: string;
  lighthouseResults: LighthouseResult[];
}) {
  const [expanded, setExpanded] = useState(false);
  const isPassed = caseRun.status === "passed";

  const stepResults = Array.isArray(caseRun.step_results)
    ? (caseRun.step_results as Array<{
        step_order: number; action: string; status: string;
        duration_ms: number; screenshot_url?: string; error?: string;
      }>)
    : [];

  const medianLh = lighthouseResults.find((r) => r.is_median) ?? lighthouseResults[0];
  const hasDetails = !!(caseRun.error_message || caseRun.screenshot_urls.length || caseRun.console_log || stepResults.length || lighthouseResults.length);

  return (
    <>
      <tr
        className={`transition-colors hover:bg-[#F5F8FF] ${!isLast || expanded ? "border-b border-[#F0F4FA]" : ""}`}
      >
        <td className="px-6 py-4 text-xs tabular-nums text-[#C4CDDE]">{index}</td>
        <td className="max-w-xs px-4 py-4">
          <p className="truncate text-sm font-medium text-[#0A1B3D]">{testCaseTitle}</p>
        </td>
        <td className="px-4 py-4">
          <StatusBadge status={caseRun.status as StatusValue} size="sm" />
        </td>
        <td className="px-4 py-4 text-xs text-[#6B7A99]">
          {testCaseFeature ?? <span className="text-[#C4CDDE]">—</span>}
        </td>
        <td className="px-4 py-4 tabular-nums text-xs text-[#6B7A99]">
          {caseRun.duration_ms != null ? (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {formatDuration(caseRun.duration_ms)}
            </span>
          ) : <span className="text-[#C4CDDE]">—</span>}
        </td>
        <td className="px-6 py-4">
          {hasDetails && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#2B6CFF] hover:underline"
            >
              {expanded ? "Hide" : "View"}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
            </button>
          )}
        </td>
      </tr>

      {/* Always rendered — animated via grid-rows trick so height transitions smoothly */}
      {hasDetails && (
        <tr className={`${!isLast ? "border-b border-[#F0F4FA]" : ""}`}>
          <td colSpan={6} className="p-0">
            <div
              className="grid transition-[grid-template-rows] duration-300 ease-in-out"
              style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <div className="bg-[#F5F8FF] px-6 py-5">
                  <div className="space-y-4">

                    {caseRun.error_message && (
                      <div className="rounded-xl border border-[#FFD0C8] bg-[#FFF0EE] p-4">
                        <p className="mb-1.5 text-xs font-semibold text-[#FF8A7A]">Error</p>
                        <p className="whitespace-pre-wrap font-mono text-xs text-[#C2410C]">{caseRun.error_message}</p>
                        {caseRun.error_stack && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-xs text-[#FF8A7A]/70 hover:text-[#FF8A7A]">Stack trace</summary>
                            <pre className="mt-1 overflow-x-auto whitespace-pre-wrap font-mono text-xs text-[#C2410C]/80">{caseRun.error_stack}</pre>
                          </details>
                        )}
                      </div>
                    )}

                    {testType === "frontend_performance" && medianLh && (
                      <div className="space-y-3">
                        <p className="text-xs font-semibold text-[#6B7A99]">Lighthouse scores</p>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          {[
                            { label: "Performance",    score: medianLh.performance_score },
                            { label: "Accessibility",  score: medianLh.accessibility_score },
                            { label: "Best Practices", score: medianLh.best_practices_score },
                            { label: "SEO",            score: medianLh.seo_score },
                          ].map(({ label, score }) => (
                            <div key={label} className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-3">
                              <p className="text-xs text-[#6B7A99]">{label}</p>
                              <p className={`text-lg font-bold tabular-nums ${scoreColor(score)}`}>{score ?? "—"}</p>
                            </div>
                          ))}
                        </div>
                        <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white">
                          <table className="min-w-full text-xs">
                            <thead>
                              <tr className="border-b border-[#F0F4FA]">
                                <th className="px-4 py-2.5 text-left font-medium text-[#6B7A99]">Metric</th>
                                <th className="px-4 py-2.5 text-left font-medium text-[#6B7A99]">Value</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F0F4FA]">
                              {[
                                { label: "LCP", value: medianLh.lcp_ms != null ? `${medianLh.lcp_ms.toFixed(0)} ms` : "—" },
                                { label: "CLS", value: medianLh.cls != null ? medianLh.cls.toFixed(3) : "—" },
                                { label: "FCP", value: medianLh.fcp_ms != null ? `${medianLh.fcp_ms.toFixed(0)} ms` : "—" },
                                { label: "TBT", value: medianLh.tbt_ms != null ? `${medianLh.tbt_ms.toFixed(0)} ms` : "—" },
                                { label: "SI",  value: medianLh.si_ms != null ? `${medianLh.si_ms.toFixed(0)} ms` : "—" },
                              ].map(({ label, value }) => (
                                <tr key={label}>
                                  <td className="px-4 py-2.5 text-[#6B7A99]">{label}</td>
                                  <td className="px-4 py-2.5 font-medium tabular-nums text-[#0A1B3D]">{value}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {medianLh.raw_json_url && (
                          <a href={medianLh.raw_json_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-[#2B6CFF] hover:underline">
                            <FileJson className="h-3.5 w-3.5" aria-hidden="true" />
                            View raw JSON report
                          </a>
                        )}
                      </div>
                    )}

                    {testType === "functional" && stepResults.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-[#6B7A99]">Step results</p>
                        <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white divide-y divide-[#F0F4FA]">
                          {stepResults.map((step) => (
                            <div key={step.step_order} className="flex items-center justify-between px-4 py-2.5">
                              <div className="flex items-center gap-2.5">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E8F0FF] text-xs font-semibold text-[#2B6CFF]">{step.step_order}</span>
                                <span className="text-xs text-[#0A1B3D]">{step.action}</span>
                                {step.status === "failed"
                                  ? <XCircle className="h-3.5 w-3.5 text-[#FF8A7A]" aria-hidden="true" />
                                  : <CheckCircle2 className="h-3.5 w-3.5 text-[#0D9488]" aria-hidden="true" />
                                }
                              </div>
                              <div className="flex items-center gap-3">
                                {step.screenshot_url && (
                                  <a href={step.screenshot_url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#2B6CFF] hover:underline">Screenshot</a>
                                )}
                                <span className="text-xs tabular-nums text-[#6B7A99]">{formatDuration(step.duration_ms)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {caseRun.screenshot_urls.length > 0 && (
                      <div>
                        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[#6B7A99]">
                          <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
                          Screenshots
                        </p>
                        <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white divide-y divide-[#F0F4FA]">
                          {caseRun.screenshot_urls.map((url, i) => (
                            <div key={i} className="flex items-center gap-4 px-4 py-3">
                              <a href={url} target="_blank" rel="noopener noreferrer" className="block shrink-0 overflow-hidden rounded-lg border border-[#E2E8F0] transition-colors hover:border-[#2B6CFF]">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={url} alt={`Screenshot ${i + 1}`} className="h-16 w-24 object-cover" />
                              </a>
                              <a href={url} target="_blank" rel="noopener noreferrer" className="truncate text-xs text-[#2B6CFF] hover:underline">
                                Screenshot {i + 1}
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {caseRun.console_log && (
                      <div>
                        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[#6B7A99]">
                          <Terminal className="h-3.5 w-3.5" aria-hidden="true" />
                          Console log
                        </p>
                        <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
                          <pre className="max-h-48 overflow-y-auto overflow-x-auto p-4 font-mono text-xs text-[#0A1B3D]">{caseRun.console_log}</pre>
                        </div>
                      </div>
                    )}

                    {isPassed && !caseRun.error_message && caseRun.screenshot_urls.length === 0 && !caseRun.console_log && stepResults.length === 0 && lighthouseResults.length === 0 && (
                      <p className="text-xs text-[#B0BAD0]">Test passed with no captured artifacts.</p>
                    )}

                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
