import * as chromeLauncher from "chrome-launcher";
import fs from "node:fs";
import path from "node:path";
import type { LighthouseConfig, LighthouseResultInsert } from "../../src/types/database";

// Dynamic import to avoid ESM/CJS import.meta.url issues under tsx
async function loadLighthouse() {
  const mod = await import("lighthouse");
  return (mod.default ?? mod) as typeof import("lighthouse").default;
}

type LighthouseRunConfig = Pick<
  LighthouseConfig,
  | "url"
  | "device"
  | "run_count"
  | "throttling"
  | "threshold_performance"
  | "threshold_accessibility"
  | "threshold_best_practices"
  | "threshold_seo"
>;

const PROJECT_ROOT = process.cwd();
const ARTIFACTS_DIR = path.join(PROJECT_ROOT, "public", "test-artifacts");

function ensureArtifactsDir(runId: string, caseRunId: string) {
  const dir = path.join(ARTIFACTS_DIR, runId, caseRunId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function artifactUrl(runId: string, caseRunId: string, filename: string) {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${appUrl}/test-artifacts/${runId}/${caseRunId}/${filename}`;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

export interface LighthouseRunInput {
  testCase: { id: string; title: string };
  config: LighthouseRunConfig;
  runId: string;
  caseRunId: string;
}

export interface LighthouseRunResult {
  status: "passed" | "failed" | "error";
  duration_ms: number;
  error_message?: string;
  error_stack?: string;
  results: LighthouseResultInsert[];
}

export async function runLighthouseAudit(input: LighthouseRunInput): Promise<LighthouseRunResult> {
  const { testCase, config, runId, caseRunId } = input;
  const artifactDir = ensureArtifactsDir(runId, caseRunId);
  const startTime = Date.now();

  let chrome: chromeLauncher.LaunchedChrome | undefined;
  const results: LighthouseResultInsert[] = [];

  try {
    chrome = await chromeLauncher.launch({ chromeFlags: ["--headless", "--no-sandbox", "--disable-gpu"] });
    const lighthouse = await loadLighthouse();

    const lhOptions: Record<string, unknown> = {
      logLevel: "error" as const,
      output: "json" as const,
      onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
      port: chrome.port,
      formFactor: config.device === "mobile" ? "mobile" : "desktop",
      screenEmulation: {
        mobile: config.device === "mobile",
      },
      emulatedUserAgent: config.device === "mobile" ? undefined : "desktop",
    };

    // Adjust throttling
    if (config.throttling === "none") {
      lhOptions.throttling = {
        rttMs: 0,
        throughputKbps: 0,
        cpuSlowdownMultiplier: 1,
        requestLatencyMs: 0,
        downloadThroughputKbps: 0,
        uploadThroughputKbps: 0,
      };
    }

    const runScores: number[] = [];
    const runData: Array<{
      report: string;
      performanceScore: number;
      accessibilityScore: number;
      bestPracticesScore: number;
      seoScore: number;
      lcp: number | null;
      cls: number | null;
      fid: number | null;
      ttfb: number | null;
      fcp: number | null;
      tbt: number | null;
      si: number | null;
    }> = [];

    for (let i = 1; i <= config.run_count; i++) {
      const runnerResult = await lighthouse(config.url, lhOptions);
      if (!runnerResult || !runnerResult.report) {
        throw new Error(`Lighthouse run ${i} returned no report`);
      }

      const reportJson = JSON.parse(runnerResult.report as string);
      const audit = reportJson.audits || {};
      const categories = reportJson.categories || {};

      const performanceScore = Math.round((categories.performance?.score ?? 0) * 100);
      const accessibilityScore = Math.round((categories.accessibility?.score ?? 0) * 100);
      const bestPracticesScore = Math.round((categories["best-practices"]?.score ?? 0) * 100);
      const seoScore = Math.round((categories.seo?.score ?? 0) * 100);

      const lcp = audit["largest-contentful-paint"]?.numericValue ?? null;
      const cls = audit["cumulative-layout-shift"]?.numericValue ?? null;
      const fid = audit["max-potential-fid"]?.numericValue ?? null;
      const ttfb = audit["server-response-time"]?.numericValue ?? null;
      const fcp = audit["first-contentful-paint"]?.numericValue ?? null;
      const tbt = audit["total-blocking-time"]?.numericValue ?? null;
      const si = audit["speed-index"]?.numericValue ?? null;

      runScores.push(performanceScore);
      runData.push({
        report: runnerResult.report as string,
        performanceScore,
        accessibilityScore,
        bestPracticesScore,
        seoScore,
        lcp,
        cls,
        fid,
        ttfb,
        fcp,
        tbt,
        si,
      });
    }

    const medianPerfScore = median(runScores);

    for (let i = 0; i < runData.length; i++) {
      const data = runData[i]!;
      const isMedian = data.performanceScore === medianPerfScore;
      const reportFileName = `lighthouse-report-${i + 1}.json`;
      const reportPath = path.join(artifactDir, reportFileName);
      fs.writeFileSync(reportPath, data.report, "utf-8");

      results.push({
        case_run_id: caseRunId,
        run_number: i + 1,
        is_median: isMedian,
        performance_score: data.performanceScore,
        accessibility_score: data.accessibilityScore,
        best_practices_score: data.bestPracticesScore,
        seo_score: data.seoScore,
        lcp_ms: data.lcp,
        cls: data.cls,
        fid_ms: data.fid,
        ttfb_ms: data.ttfb,
        fcp_ms: data.fcp,
        tbt_ms: data.tbt,
        si_ms: data.si,
        raw_json_url: artifactUrl(runId, caseRunId, reportFileName),
        throttling_profile: config.throttling,
      } as LighthouseResultInsert);
    }

    // Threshold check against median result
    const medianResult = results.find((r) => r.is_median) || results[0];
    let status: "passed" | "failed" = "passed";
    if (medianResult) {
      if (
        (medianResult.performance_score ?? 0) < config.threshold_performance ||
        (medianResult.accessibility_score ?? 0) < config.threshold_accessibility ||
        (medianResult.best_practices_score ?? 0) < config.threshold_best_practices ||
        (medianResult.seo_score ?? 0) < config.threshold_seo
      ) {
        status = "failed";
      }
    }

    return {
      status,
      duration_ms: Date.now() - startTime,
      results,
    };
  } catch (err) {
    return {
      status: "error",
      duration_ms: Date.now() - startTime,
      error_message: err instanceof Error ? err.message : String(err),
      error_stack: err instanceof Error ? err.stack : undefined,
      results,
    };
  } finally {
    if (chrome) {
      await chrome.kill();
    }
  }
}
