"use client";

import { useState, useTransition } from "react";
import { updateCaseRunStatus } from "@/app/actions/test-case-runs";
import { toast } from "sonner";

const STATUSES = [
  { value: "pending", label: "Pending", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  { value: "running", label: "Running", className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  { value: "passed", label: "Passed", className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  { value: "failed", label: "Failed", className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  { value: "error", label: "Error", className: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" },
  { value: "skipped", label: "Skipped", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" },
];

export function CaseRunStatusSelect({
  caseRunId,
  runId,
  projectId,
  currentStatus,
}: {
  caseRunId: string;
  runId: string;
  projectId: string;
  currentStatus: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    setStatus(newStatus);

    startTransition(async () => {
      const result = await updateCaseRunStatus(caseRunId, runId, projectId, newStatus);
      if (result.error) {
        toast.error(result.error);
        setStatus(currentStatus); // rollback on error
      } else {
        toast.success("Status updated");
      }
    });
  }

  const activeStyle = STATUSES.find((s) => s.value === status)?.className ?? STATUSES[0].className;

  return (
    <select
      value={status}
      onChange={handleChange}
      disabled={isPending}
      className={`
        rounded px-2 py-1 text-xs font-medium uppercase tracking-wide
        border-0 outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]
        cursor-pointer disabled:opacity-60
        ${activeStyle}
      `}
    >
      {STATUSES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
