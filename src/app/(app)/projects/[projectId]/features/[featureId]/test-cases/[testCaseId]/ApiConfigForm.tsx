"use client";

import { useActionState, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { upsertApiConfig, type ApiConfigState } from "@/app/actions/api-configs";

export type ApiTestConfig = {
  id: string;
  test_case_id: string;
  method: string;
  endpoint_path: string;
  headers: Record<string, string>;
  request_body: Record<string, unknown> | null;
  auth_type: string | null;
  auth_config: Record<string, unknown> | null;
  concurrency: number;
  request_count: number;
  threshold_p50_ms: number;
  threshold_p95_ms: number;
  threshold_p99_ms: number;
  threshold_error_rate: number;
  created_at: string;
  updated_at: string;
};

interface Props {
  testCaseId: string;
  featureId: string;
  projectId: string;
  config: ApiTestConfig | null;
}

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
const AUTH_TYPES = [
  { value: "none",    label: "None" },
  { value: "bearer",  label: "Bearer token" },
  { value: "basic",   label: "Basic auth" },
  { value: "api_key", label: "API key" },
];

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-[#6B7A99]">{label}</label>
      {children}
      {hint && !error && <p className="text-[11px] text-[#B0BAD0]">{hint}</p>}
      {error && <p className="text-[11px] text-[#FF8A7A]">{error}</p>}
    </div>
  );
}

function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-9 w-full rounded-xl bg-[#F5F8FF] px-3 text-sm text-[#0A1B3D] outline-none placeholder-[#B0BAD0] transition-colors focus:bg-white focus:shadow-[0_0_0_1.5px_#2B6CFF] ${className}`}
    />
  );
}

function Textarea({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full resize-none rounded-xl bg-[#F5F8FF] px-3 py-2 font-mono text-xs text-[#0A1B3D] outline-none placeholder-[#B0BAD0] transition-colors focus:bg-white focus:shadow-[0_0_0_1.5px_#2B6CFF] ${className}`}
    />
  );
}

function Select({ className = "", ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`h-9 w-full rounded-xl bg-[#F5F8FF] px-3 text-sm text-[#0A1B3D] outline-none transition-colors focus:bg-white focus:shadow-[0_0_0_1.5px_#2B6CFF] ${className}`}
    />
  );
}

export function ApiConfigForm({ testCaseId, featureId, projectId, config }: Props) {
  const [authType, setAuthType] = useState(config?.auth_type ?? "none");

  const [state, action, isPending] = useActionState<ApiConfigState, FormData>(
    async (prevState, formData) => {
      return upsertApiConfig(testCaseId, featureId, projectId, prevState, formData);
    },
    {}
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>API configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-5">

          {/* Endpoint */}
          <div className="flex gap-2">
            <div className="w-36 shrink-0">
              <Field label="Method">
                <Select name="method" defaultValue={config?.method ?? "GET"}>
                  {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </Select>
              </Field>
            </div>
            <div className="flex-1">
              <Field
                label="Endpoint path"
                hint="e.g. /api/users or https://api.example.com/users"
                error={state.errors?.endpoint_path?.[0]}
              >
                <Input
                  name="endpoint_path"
                  defaultValue={config?.endpoint_path ?? ""}
                  placeholder="/api/v1/endpoint"
                  required
                />
              </Field>
            </div>
          </div>

          {/* Headers */}
          <Field label="Headers (JSON)" hint='e.g. {"Content-Type": "application/json"}' error={state.errors?.headers?.[0]}>
            <Textarea
              name="headers"
              rows={3}
              defaultValue={config?.headers && Object.keys(config.headers).length ? JSON.stringify(config.headers, null, 2) : ""}
              placeholder={'{\n  "Content-Type": "application/json"\n}'}
            />
          </Field>

          {/* Request body */}
          <Field label="Request body (JSON)" hint="Only used for POST, PUT, PATCH" error={state.errors?.request_body?.[0]}>
            <Textarea
              name="request_body"
              rows={4}
              defaultValue={config?.request_body ? JSON.stringify(config.request_body, null, 2) : ""}
              placeholder={'{\n  "key": "value"\n}'}
            />
          </Field>

          {/* Auth */}
          <div className="space-y-3">
            <Field label="Authentication">
              <Select
                name="auth_type"
                value={authType}
                onChange={(e) => setAuthType(e.target.value)}
              >
                {AUTH_TYPES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
              </Select>
            </Field>

            {authType === "bearer" && (
              <Field label="Bearer token" error={state.errors?.auth_config?.[0]}>
                <Input
                  name="auth_config"
                  defaultValue={config?.auth_config ? JSON.stringify(config.auth_config) : ""}
                  placeholder='{"token": "your-token-here"}'
                />
              </Field>
            )}
            {authType === "basic" && (
              <Field label="Basic auth (JSON)" error={state.errors?.auth_config?.[0]}>
                <Input
                  name="auth_config"
                  defaultValue={config?.auth_config ? JSON.stringify(config.auth_config) : ""}
                  placeholder='{"username": "user", "password": "pass"}'
                />
              </Field>
            )}
            {authType === "api_key" && (
              <Field label="API key config (JSON)" error={state.errors?.auth_config?.[0]}>
                <Input
                  name="auth_config"
                  defaultValue={config?.auth_config ? JSON.stringify(config.auth_config) : ""}
                  placeholder='{"header": "X-API-Key", "value": "your-key"}'
                />
              </Field>
            )}
          </div>

          {/* Load settings */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6B7A99]">Load settings</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Request count" hint="Total requests to send" error={state.errors?.request_count?.[0]}>
                <Input name="request_count" type="number" min={1} max={10000} defaultValue={config?.request_count ?? 10} />
              </Field>
              <Field label="Concurrency" hint="Parallel requests (max 50)" error={state.errors?.concurrency?.[0]}>
                <Input name="concurrency" type="number" min={1} max={50} defaultValue={config?.concurrency ?? 1} />
              </Field>
            </div>
          </div>

          {/* Thresholds */}
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#6B7A99]">Pass/fail thresholds</p>
            <p className="mb-3 text-[11px] text-[#B0BAD0]">Test fails if any threshold is exceeded</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Field label="p50 (ms)" error={state.errors?.threshold_p50_ms?.[0]}>
                <Input name="threshold_p50_ms" type="number" min={0} defaultValue={config?.threshold_p50_ms ?? 200} />
              </Field>
              <Field label="p95 (ms)" error={state.errors?.threshold_p95_ms?.[0]}>
                <Input name="threshold_p95_ms" type="number" min={0} defaultValue={config?.threshold_p95_ms ?? 500} />
              </Field>
              <Field label="p99 (ms)" error={state.errors?.threshold_p99_ms?.[0]}>
                <Input name="threshold_p99_ms" type="number" min={0} defaultValue={config?.threshold_p99_ms ?? 1000} />
              </Field>
              <Field label="Max error rate" hint="0.05 = 5%" error={state.errors?.threshold_error_rate?.[0]}>
                <Input name="threshold_error_rate" type="number" min={0} max={1} step={0.01} defaultValue={config?.threshold_error_rate ?? 0.05} />
              </Field>
            </div>
          </div>

          {state.message && (
            <p className={`text-sm ${state.errors ? "text-[#FF8A7A]" : "text-[#0D9488]"}`}>
              {state.message}
            </p>
          )}

          <Button type="submit" loading={isPending}>Save configuration</Button>
        </form>
      </CardContent>
    </Card>
  );
}
