"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { RunStatus } from "@/types/database";

const ACTIVE_STATUSES: RunStatus[] = ["pending", "queued", "running"];

export function RunLiveRefresh({
  runId,
  status,
}: {
  runId: string;
  status: RunStatus;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!ACTIVE_STATUSES.includes(status)) return;

    const supabase = createClient();
    const refresh = () => router.refresh();

    const channel = supabase
      .channel(`run-live-refresh:${runId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "test_runs",
          filter: `id=eq.${runId}`,
        },
        refresh
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "test_case_runs",
          filter: `test_run_id=eq.${runId}`,
        },
        refresh
      )
      .subscribe();

    const fallback = window.setInterval(refresh, 5000);

    return () => {
      window.clearInterval(fallback);
      void supabase.removeChannel(channel);
    };
  }, [router, runId, status]);

  return null;
}
