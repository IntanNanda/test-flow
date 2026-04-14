import { chromium, type Browser, type Page } from "playwright";
import fs from "node:fs";
import path from "node:path";
import type { TestStep } from "../../src/types/database";

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

function resolveUrl(selector: string | null, baseUrl: string | null): string {
  if (!selector) return baseUrl || "about:blank";
  if (selector.startsWith("http://") || selector.startsWith("https://")) {
    return selector;
  }
  const base = (baseUrl || "").replace(/\/$/, "");
  const rel = selector.startsWith("/") ? selector : `/${selector}`;
  return base ? `${base}${rel}` : selector;
}

export type PlaywrightRunStep = Omit<TestStep, "test_case_id" | "created_at">;

export interface PlaywrightRunInput {
  testCase: { id: string; title: string };
  steps: PlaywrightRunStep[];
  baseUrl: string | null;
  runId: string;
  caseRunId: string;
}

export interface PlaywrightRunResult {
  status: "passed" | "failed" | "error";
  duration_ms: number;
  error_message?: string;
  error_stack?: string;
  step_results: Array<{
    step_order: number;
    action: string;
    status: "passed" | "failed";
    duration_ms: number;
    screenshot_url?: string;
    error?: string;
  }>;
  screenshot_urls: string[];
  video_url?: string;
  console_log?: string;
}

export async function runPlaywrightTest(input: PlaywrightRunInput): Promise<PlaywrightRunResult> {
  const { testCase, steps, baseUrl, runId, caseRunId } = input;
  const artifactDir = ensureArtifactsDir(runId, caseRunId);
  const videoDir = path.join(artifactDir, "videos");
  fs.mkdirSync(videoDir, { recursive: true });

  const startTime = Date.now();
  const stepResults: PlaywrightRunResult["step_results"] = [];
  const screenshotUrls: string[] = [];
  const consoleLogs: string[] = [];

  let browser: Browser | undefined;
  let page: Page | undefined;
  let overallStatus: PlaywrightRunResult["status"] = "passed";
  let errorMessage: string | undefined;
  let errorStack: string | undefined;

  // Console log collector
  function attachConsoleListeners(p: Page) {
    p.on("console", (msg) => {
      const loc = msg.location();
      consoleLogs.push(`[${msg.type()}] ${msg.text()} (${loc.url}:${loc.lineNumber})`);
    });
    p.on("pageerror", (err) => {
      consoleLogs.push(`[pageerror] ${err.message}`);
    });
  }

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      recordVideo: { dir: videoDir, size: { width: 1280, height: 720 } },
    });
    page = await context.newPage();
    attachConsoleListeners(page);

    for (const step of (steps as PlaywrightRunStep[]).sort((a, b) => a.step_order - b.step_order)) {
      const stepStart = Date.now();
      let stepStatus: "passed" | "failed" = "passed";
      let stepError: string | undefined;
      let stepScreenshotUrl: string | undefined;

      try {
        switch (step.action) {
          case "navigate": {
            const url = resolveUrl(step.selector, baseUrl);
            await page.goto(url, { waitUntil: "networkidle" });
            break;
          }
          case "click": {
            if (!step.selector) throw new Error("Selector required for click");
            await page.click(step.selector);
            break;
          }
          case "fill": {
            if (!step.selector) throw new Error("Selector required for fill");
            await page.fill(step.selector, step.value ?? "");
            break;
          }
          case "select": {
            if (!step.selector) throw new Error("Selector required for select");
            await page.selectOption(step.selector, step.value ?? "");
            break;
          }
          case "check": {
            if (!step.selector) throw new Error("Selector required for check");
            await page.check(step.selector);
            break;
          }
          case "uncheck": {
            if (!step.selector) throw new Error("Selector required for uncheck");
            await page.uncheck(step.selector);
            break;
          }
          case "assert_text": {
            if (!step.selector) throw new Error("Selector required for assert_text");
            const locator = page.locator(step.selector);
            await locator.waitFor({ state: "attached", timeout: 5000 });
            const text = await locator.textContent();
            const expected = step.value ?? "";
            if (!text?.includes(expected)) {
              throw new Error(`Expected text to include "${expected}", got "${text ?? ""}"`);
            }
            break;
          }
          case "assert_visible": {
            if (!step.selector) throw new Error("Selector required for assert_visible");
            await page.locator(step.selector).waitFor({ state: "visible", timeout: 5000 });
            break;
          }
          case "assert_url": {
            const expectedUrl = step.value ?? "";
            const currentUrl = page.url();
            if (!currentUrl.includes(expectedUrl)) {
              throw new Error(`Expected URL to include "${expectedUrl}", got "${currentUrl}"`);
            }
            break;
          }
          case "wait": {
            const ms = parseInt(step.value ?? "0", 10);
            await page.waitForTimeout(ms);
            break;
          }
          case "screenshot": {
            const name = step.value ? `${step.value}.png` : `step-${step.step_order}.png`;
            const screenshotPath = path.join(artifactDir, name);
            await page.screenshot({ path: screenshotPath, fullPage: false });
            stepScreenshotUrl = artifactUrl(runId, caseRunId, name);
            screenshotUrls.push(stepScreenshotUrl);
            break;
          }
          case "custom": {
            // Skip custom steps
            console.warn(`Skipping custom step ${step.step_order} for test case ${testCase.id}`);
            break;
          }
          default: {
            console.warn(`Unknown action "${step.action}" in step ${step.step_order}`);
          }
        }

        if (step.screenshot_on_step) {
          const name = `step-${step.step_order}-screenshot.png`;
          const screenshotPath = path.join(artifactDir, name);
          await page.screenshot({ path: screenshotPath, fullPage: false });
          stepScreenshotUrl = artifactUrl(runId, caseRunId, name);
          screenshotUrls.push(stepScreenshotUrl);
        }
      } catch (err) {
        stepStatus = "failed";
        stepError = err instanceof Error ? err.message : String(err);
        overallStatus = "failed";
        errorMessage = stepError;
        errorStack = err instanceof Error ? err.stack : undefined;

        // Capture failure screenshot
        try {
          const name = `failure-step-${step.step_order}.png`;
          const screenshotPath = path.join(artifactDir, name);
          await page.screenshot({ path: screenshotPath, fullPage: false });
          const url = artifactUrl(runId, caseRunId, name);
          screenshotUrls.push(url);
          stepScreenshotUrl = url;
        } catch {
          // Ignore screenshot errors
        }
      }

      stepResults.push({
        step_order: step.step_order,
        action: step.action,
        status: stepStatus,
        duration_ms: Date.now() - stepStart,
        screenshot_url: stepScreenshotUrl,
        error: stepError,
      });

      if (overallStatus === "failed") {
        break; // Stop executing further steps on failure
      }
    }
  } catch (err) {
    overallStatus = "error";
    errorMessage = err instanceof Error ? err.message : String(err);
    errorStack = err instanceof Error ? err.stack : undefined;
  } finally {
    await page?.close();
    await browser?.close();
  }

  // Resolve video path
  let videoUrl: string | undefined;
  const videoFiles = fs.existsSync(videoDir) ? fs.readdirSync(videoDir).filter((f) => f.endsWith(".webm")) : [];
  if (videoFiles.length > 0) {
    // Rename video to predictable name
    const src = path.join(videoDir, videoFiles[0]);
    const dest = path.join(artifactDir, "video.webm");
    fs.renameSync(src, dest);
    // Clean empty video dir
    fs.rmdirSync(videoDir);
    videoUrl = artifactUrl(runId, caseRunId, "video.webm");
  } else {
    // Remove empty video dir
    if (fs.existsSync(videoDir)) {
      fs.rmdirSync(videoDir);
    }
  }

  const duration_ms = Date.now() - startTime;

  return {
    status: overallStatus,
    duration_ms,
    error_message: errorMessage,
    error_stack: errorStack,
    step_results: stepResults,
    screenshot_urls: [...new Set(screenshotUrls)],
    video_url: videoUrl,
    console_log: consoleLogs.length > 0 ? consoleLogs.join("\n") : undefined,
  };
}
