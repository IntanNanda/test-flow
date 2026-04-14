const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
const workerSecret = process.env.WORKER_WEBHOOK_SECRET;

export async function patchRunResults(
  runId: string,
  runUpdates: Record<string, unknown>,
  caseRuns?: Array<Record<string, unknown> & { id: string; test_case_id?: string; status?: string }>
) {
  if (!appUrl || !workerSecret) {
    throw new Error("Missing NEXT_PUBLIC_APP_URL or WORKER_WEBHOOK_SECRET");
  }

  const body: Record<string, unknown> = { ...runUpdates };
  if (caseRuns) {
    body.case_runs = caseRuns;
  }

  const res = await fetch(`${appUrl}/api/test-runs/${runId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-worker-secret": workerSecret,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`Failed to PATCH run ${runId}: ${res.status} ${text}`);
  }

  return res.json();
}

export async function fetchWorkerDetails(runId: string) {
  if (!appUrl || !workerSecret) {
    throw new Error("Missing NEXT_PUBLIC_APP_URL or WORKER_WEBHOOK_SECRET");
  }

  const res = await fetch(`${appUrl}/api/test-runs/${runId}/worker-details`, {
    headers: {
      "x-worker-secret": workerSecret,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`Failed to fetch worker details for run ${runId}: ${res.status} ${text}`);
  }

  const json = (await res.json()) as { run: unknown };
  return json.run;
}
