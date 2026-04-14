"use client";

import { useActionState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { upsertLighthouseConfig, type LighthouseConfigState } from "@/app/actions/lighthouse-configs";
import type { LighthouseConfig } from "@/types/database";

interface LighthouseConfigFormProps {
  testCaseId: string;
  featureId: string;
  projectId: string;
  config: LighthouseConfig | null;
}

export function LighthouseConfigForm({
  testCaseId,
  featureId,
  projectId,
  config,
}: LighthouseConfigFormProps) {
  const [state, action, isPending] = useActionState<LighthouseConfigState, FormData>(
    async (prevState, formData) => {
      return upsertLighthouseConfig(testCaseId, featureId, projectId, prevState, formData);
    },
    {}
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lighthouse configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <FormField
            label="URL"
            name="url"
            type="url"
            defaultValue={config?.url ?? ""}
            required
            hint="The page URL to audit"
            error={state.errors?.url?.[0]}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="device" className="text-sm font-medium text-[var(--text-primary)]">
                Device
              </label>
              <select
                id="device"
                name="device"
                defaultValue={config?.device ?? "desktop"}
                className="h-10 rounded border border-[#E7E5E4] bg-white px-3 text-sm dark:border-[#292524] dark:bg-[#1C1917] dark:text-[#FAFAF9]"
              >
                <option value="desktop">Desktop</option>
                <option value="mobile">Mobile</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="run_count" className="text-sm font-medium text-[var(--text-primary)]">
                Run count
              </label>
              <input
                id="run_count"
                name="run_count"
                type="number"
                min={1}
                max={10}
                defaultValue={config?.run_count ?? 3}
                className="h-10 rounded border border-[#E7E5E4] bg-white px-3 text-sm dark:border-[#292524] dark:bg-[#1C1917] dark:text-[#FAFAF9]"
              />
              {state.errors?.run_count && (
                <p className="text-xs text-[#B91C1C]">{state.errors.run_count[0]}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="throttling" className="text-sm font-medium text-[var(--text-primary)]">
                Throttling
              </label>
              <select
                id="throttling"
                name="throttling"
                defaultValue={config?.throttling ?? "simulated"}
                className="h-10 rounded border border-[#E7E5E4] bg-white px-3 text-sm dark:border-[#292524] dark:bg-[#1C1917] dark:text-[#FAFAF9]"
              >
                <option value="none">None</option>
                <option value="simulated">Simulated</option>
                <option value="applied">Applied</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <FormField
              label="Performance threshold"
              name="threshold_performance"
              type="number"
              min={0}
              max={100}
              defaultValue={config?.threshold_performance ?? 70}
              error={state.errors?.threshold_performance?.[0]}
            />
            <FormField
              label="Accessibility threshold"
              name="threshold_accessibility"
              type="number"
              min={0}
              max={100}
              defaultValue={config?.threshold_accessibility ?? 90}
              error={state.errors?.threshold_accessibility?.[0]}
            />
            <FormField
              label="Best practices threshold"
              name="threshold_best_practices"
              type="number"
              min={0}
              max={100}
              defaultValue={config?.threshold_best_practices ?? 80}
              error={state.errors?.threshold_best_practices?.[0]}
            />
            <FormField
              label="SEO threshold"
              name="threshold_seo"
              type="number"
              min={0}
              max={100}
              defaultValue={config?.threshold_seo ?? 70}
              error={state.errors?.threshold_seo?.[0]}
            />
          </div>

          {state.message && (
            <p
              className={`text-sm ${
                state.errors ? "text-[#B91C1C]" : "text-[#15803D]"
              }`}
            >
              {state.message}
            </p>
          )}

          <div className="flex items-center gap-2">
            <Button type="submit" loading={isPending}>
              Save configuration
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
