import "dotenv/config";
import { supabase } from "./lib/supabase";
import { fetchWorkerDetails, patchRunResults } from "./lib/reporter";
import { runPlaywrightTest } from "./runners/playwright";
import { runLighthouseAudit } from "./runners/lighthouse";
import type { Database } from "../src/types/database";

type TestRunRow = Database["public"]["Tables"]["test_runs"]["Row"];
type TestCaseRunRow = Database["public"]["Tables"]["test_case_runs"]["Row"];

const POLL_INTERVAL_MS = 60_000;
let isProcessing = false;

function log(...args: unknown[]) {
  console.log(`[${new Date().toISOString()}]`, ...args);
}

async function processPendingRuns() {
  if (isProcessing) {
    log("Already processing runs, skipping this tick.");
    return;
  }

  isProcessing = true;
  try {
    const { data: pendingRuns, error } = await supabase
      .from("test_runs")
      .select("id, project_id, status")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(10);

    if (error) {
      log("Error fetching pending runs:", error.message);
      return;
    }

    if (!pendingRuns || pendingRuns.length === 0) {
      return;
    }

    log(`Found ${pendingRuns.length} pending run(s).`);

    for (const run of pendingRuns) {
      await processRun(run.id);
    }
  } finally {
    isProcessing = false;
  }
}

async function processRun(runId: string) {
  log(`Processing run ${runId}...`);

  // Mark run as running
  const { error: markRunningError } = await supabase
    .from("test_runs")
    .update({ status: "running", started_at: new Date().toISOString() })
    .eq("id", runId);

  if (markRunningError) {
    log(`Failed to mark run ${runId} as running:`, markRunningError.message);
    return;
  }

  // Fetch full details
  let details: unknown;
  try {
    details = await fetchWorkerDetails(runId);
  } catch (err) {
    log(`Failed to fetch worker details for run ${runId}:`, err);
    await supabase
      .from("test_runs")
      .update({ status: "error", completed_at: new Date().toISOString() })
      .eq("id", runId);
    return;
  }

  type WorkerTestStep = {
    id: string;
    step_order: number;
    action: string;
    selector: string | null;
    value: string | null;
    description: string | null;
    screenshot_on_step: boolean;
  };

  type WorkerLighthouseConfig = {
    id: string;
    test_case_id: string;
    url: string;
    device: "desktop" | "mobile";
    run_count: number;
    throttling: "none" | "simulated" | "applied";
    threshold_performance: number;
    threshold_accessibility: number;
    threshold_best_practices: number;
    threshold_seo: number;
  };

  const runData = details as TestRunRow & {
    test_case_runs: Array<
      TestCaseRunRow & {
        test_cases: {
          id: string;
          title: string;
          test_type: string;
          test_steps: WorkerTestStep[];
          lighthouse_configs: WorkerLighthouseConfig | null;
        };
      }
    >;
    projects: { base_url: string | null } | null;
  };

  const baseUrl = runData.base_url_override ?? runData.projects?.base_url ?? null;
  const caseRuns = runData.test_case_runs ?? [];

  const patchCaseRuns: Array<Record<string, unknown> & { id: string; test_case_id?: string; status?: string }> =
    [];
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  let errored = 0;
  const runStartTime = Date.now();

  for (const caseRun of caseRuns) {
    const testCase = caseRun.test_cases;
    if (!testCase) {
      log(`Skipping case run ${caseRun.id}: missing test case data`);
      skipped++;
      patchCaseRuns.push({
        id: caseRun.id,
        status: "skipped",
        error_message: "Test case data missing",
        completed_at: new Date().toISOString(),
      });
      continue;
    }

    // Mark case run as running
    await supabase
      .from("test_case_runs")
      .update({ status: "running", started_at: new Date().toISOString() })
      .eq("id", caseRun.id)
      .eq("test_run_id", runId);

    log(`Running ${testCase.test_type} case "${testCase.title}" (${caseRun.id})...`);

    try {
      if (testCase.test_type === "functional") {
        const result = await runPlaywrightTest({
          testCase,
          steps: testCase.test_steps ?? [],
          baseUrl,
          runId,
          caseRunId: caseRun.id,
        });

        patchCaseRuns.push({
          id: caseRun.id,
          test_case_id: testCase.id,
          status: result.status,
          duration_ms: result.duration_ms,
          error_message: result.error_message ?? null,
          error_stack: result.error_stack ?? null,
          step_results: result.step_results,
          screenshot_urls: result.screenshot_urls,
          video_url: result.video_url ?? null,
          console_log: result.console_log ?? null,
          completed_at: new Date().toISOString(),
        });

        if (result.status === "passed") passed++;
        else if (result.status === "failed") failed++;
        else if (result.status === "error") errored++;
      } else if (testCase.test_type === "frontend_performance") {
        if (!testCase.lighthouse_configs) {
          log(`Skipping lighthouse case run ${caseRun.id}: missing config`);
          skipped++;
          patchCaseRuns.push({
            id: caseRun.id,
            test_case_id: testCase.id,
            status: "skipped",
            error_message: "Lighthouse configuration missing",
            completed_at: new Date().toISOString(),
          });
          continue;
        }

        const result = await runLighthouseAudit({
          testCase,
          config: testCase.lighthouse_configs,
          runId,
          caseRunId: caseRun.id,
        });

        // Insert lighthouse_results via service role
        if (result.results.length > 0) {
          const { error: lhInsertError } = await supabase
            .from("lighthouse_results")
            .insert(result.results as Database["public"]["Tables"]["lighthouse_results"]["Insert"][]);
          if (lhInsertError) {
            log(`Failed to insert lighthouse results for ${caseRun.id}:`, lhInsertError.message);
          }
        }

        patchCaseRuns.push({
          id: caseRun.id,
          test_case_id: testCase.id,
          status: result.status,
          duration_ms: result.duration_ms,
          error_message: result.error_message ?? null,
          error_stack: result.error_stack ?? null,
          completed_at: new Date().toISOString(),
        });

        if (result.status === "passed") passed++;
        else if (result.status === "failed") failed++;
        else if (result.status === "error") errored++;
      } else {
        // api_performance not implemented in this plan
        log(`Skipping unsupported test type "${testCase.test_type}" for case run ${caseRun.id}`);
        skipped++;
        patchCaseRuns.push({
          id: caseRun.id,
          test_case_id: testCase.id,
          status: "skipped",
          error_message: "Test type not yet supported by worker",
          completed_at: new Date().toISOString(),
        });
      }
    } catch (runnerErr) {
      log(`Runner error for case run ${caseRun.id}:`, runnerErr);
      errored++;
      const msg = runnerErr instanceof Error ? runnerErr.message : String(runnerErr);
      patchCaseRuns.push({
        id: caseRun.id,
        test_case_id: testCase.id,
        status: "error",
        error_message: msg,
        completed_at: new Date().toISOString(),
      });
    }

    // Update test_cases.last_run_status immediately
    const lastCaseStatus = patchCaseRuns[patchCaseRuns.length - 1]?.status;
    if (lastCaseStatus) {
      await supabase
        .from("test_cases")
        .update({ last_run_at: new Date().toISOString(), last_run_status: lastCaseStatus })
        .eq("id", testCase.id);
    }
  }

  const duration_ms = Date.now() - runStartTime;

  // Determine final run status
  let finalStatus: TestRunRow["status"] = "passed";
  if (errored > 0 || failed > 0) {
    finalStatus = "failed";
  } else if (passed === 0 && skipped > 0) {
    finalStatus = "cancelled";
  }

  try {
    await patchRunResults(
      runId,
      {
        status: finalStatus,
        passed,
        failed,
        skipped,
        errored,
        completed_at: new Date().toISOString(),
        duration_ms,
      },
      patchCaseRuns
    );
    log(`Run ${runId} completed with status ${finalStatus}.`);
  } catch (patchErr) {
    log(`Failed to PATCH run ${runId} results:`, patchErr);
    // Attempt direct DB update as fallback
    await supabase
      .from("test_runs")
      .update({
        status: finalStatus,
        passed,
        failed,
        skipped,
        errored,
        completed_at: new Date().toISOString(),
        duration_ms,
      })
      .eq("id", runId);
  }
}

async function startWorker() {
  log("Worker starting...");

  // 1. Primary: Realtime subscription
  const channel = supabase
    .channel("worker-pending-runs")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "test_runs",
        filter: "status=eq.pending",
      },
      (payload) => {
        log("Realtime event received:", payload.eventType, (payload.new as Record<string, unknown>)?.id);
        void processPendingRuns();
      }
    )
    .subscribe((status) => {
      log("Realtime subscription status:", status);
    });

  // 2. Fallback polling
  const poll = setInterval(() => {
    void processPendingRuns();
  }, POLL_INTERVAL_MS);

  // 3. Immediate check on startup
  void processPendingRuns();

  // Graceful shutdown
  function shutdown() {
    log("Shutting down worker...");
    clearInterval(poll);
    void supabase.removeChannel(channel);
    process.exit(0);
  }

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

void startWorker();
