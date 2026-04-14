"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, ChevronDown } from "lucide-react";

interface ExportButtonProps {
  featureId: string;
  featureName: string;
}

export function ExportButton({ featureId, featureName }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<"csv" | "excel" | null>(null);

  async function handleExport(format: "csv" | "excel") {
    setLoading(format);
    setOpen(false);
    try {
      const url = `/api/export?feature_id=${featureId}&format=${format}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const ext = format === "csv" ? "csv" : "xlsx";
      const filename = `${featureName.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.${ext}`;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={loading !== null}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#D1DEFF] bg-white px-3 text-xs font-medium text-[#2B6CFF] transition-colors hover:bg-[#E8F0FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B6CFF] disabled:opacity-60"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        {loading ? "Exporting…" : "Export"}
        <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
      </button>

      {open && (
        <>
          {/* backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1.5 w-44 rounded-lg border border-[#E2E8F0] bg-white py-1 shadow-lg">
            <button
              onClick={() => handleExport("csv")}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-[#0A1B3D] hover:bg-[#F5F8FF]"
            >
              <FileText className="h-4 w-4 text-[#2B6CFF]" aria-hidden="true" />
              Export as CSV
            </button>
            <button
              onClick={() => handleExport("excel")}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-[#0A1B3D] hover:bg-[#F5F8FF]"
            >
              <FileSpreadsheet className="h-4 w-4 text-[#2B6CFF]" aria-hidden="true" />
              Export as Excel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
