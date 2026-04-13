"use client";

import { use, useActionState } from "react";
import Link from "next/link";
import { createTestCase } from "@/app/actions/test-cases";
import { FormField, TextareaField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";

const SCENARIO_OPTIONS = [
  { value: "positive", label: "Positive — happy path, expected behavior" },
  { value: "negative", label: "Negative — error handling, invalid input" },
  { value: "edge", label: "Edge — boundary conditions, unusual states" },
];

const TYPE_OPTIONS = [
  { value: "functional", label: "Functional (Playwright)" },
  { value: "api_performance", label: "API Performance" },
  { value: "frontend_performance", label: "Frontend Performance (Lighthouse)" },
];

const PRIORITY_OPTIONS = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export default function NewTestCasePage({
  params,
}: {
  params: Promise<{ projectId: string; featureId: string }>;
}) {
  const { projectId, featureId } = use(params);
  const boundAction = createTestCase.bind(null, featureId, projectId);
  const [state, action, isPending] = useActionState(boundAction, {});

  return (
    <div className="mx-auto max-w-[720px] p-6">
      <div className="mb-6">
        <Link
          href={`/projects/${projectId}/features/${featureId}`}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to feature
        </Link>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          New test case
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Document what should be tested and how to test it.
        </p>
      </div>

      {state.message && (
        <div role="alert" className="mb-4 rounded border border-[#FEE2E2] bg-[#FEE2E2] p-3 text-sm text-[#7F1D1D]">
          {state.message}
        </div>
      )}

      <div className="rounded-lg border border-[#E7E5E4] bg-white p-6 dark:border-[#292524] dark:bg-[#1C1917]">
        <form action={action} className="space-y-6">
          {/* Basic info */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-[var(--text-primary)]">
              Basic information
            </legend>

            <FormField
              label="Title"
              name="title"
              required
              placeholder="e.g. User can log in with valid credentials"
              error={state.errors?.title?.[0]}
            />

            <TextareaField
              label="Description"
              name="description"
              placeholder="What does this test verify?"
              error={state.errors?.description?.[0]}
            />

            <TextareaField
              label="Preconditions"
              name="preconditions"
              placeholder="What needs to be set up before running this test?"
              error={state.errors?.preconditions?.[0]}
            />
          </fieldset>

          {/* Classification */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-[var(--text-primary)]">
              Classification
            </legend>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Scenario type */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="scenario_type" className="text-sm font-medium text-[var(--text-primary)]">
                  Scenario type <span className="text-[#B91C1C]" aria-hidden="true">*</span>
                  <span className="sr-only"> (required)</span>
                </label>
                <select
                  id="scenario_type"
                  name="scenario_type"
                  required
                  defaultValue="positive"
                  className="h-10 w-full rounded border border-[#E7E5E4] bg-white px-3 text-sm text-[#1C1917] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 dark:border-[#292524] dark:bg-[#1C1917] dark:text-[#FAFAF9]"
                >
                  {SCENARIO_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                {state.errors?.scenario_type && (
                  <p role="alert" className="text-xs text-[#B91C1C]">{state.errors.scenario_type[0]}</p>
                )}
              </div>

              {/* Priority */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="priority" className="text-sm font-medium text-[var(--text-primary)]">
                  Priority <span className="text-[#B91C1C]" aria-hidden="true">*</span>
                  <span className="sr-only"> (required)</span>
                </label>
                <select
                  id="priority"
                  name="priority"
                  required
                  defaultValue="medium"
                  className="h-10 w-full rounded border border-[#E7E5E4] bg-white px-3 text-sm text-[#1C1917] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 dark:border-[#292524] dark:bg-[#1C1917] dark:text-[#FAFAF9]"
                >
                  {PRIORITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Test type */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="test_type" className="text-sm font-medium text-[var(--text-primary)]">
                Test type <span className="text-[#B91C1C]" aria-hidden="true">*</span>
                <span className="sr-only"> (required)</span>
              </label>
              <select
                id="test_type"
                name="test_type"
                required
                defaultValue="functional"
                className="h-10 w-full rounded border border-[#E7E5E4] bg-white px-3 text-sm text-[#1C1917] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 dark:border-[#292524] dark:bg-[#1C1917] dark:text-[#FAFAF9]"
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <FormField
              label="Tags"
              name="tags"
              placeholder="smoke, regression, auth (comma-separated)"
              hint="Tags help filter and organize test cases"
              error={state.errors?.tags?.[0]}
            />
          </fieldset>

          <div className="flex items-center gap-3 border-t border-[#E7E5E4] pt-4 dark:border-[#292524]">
            <Button type="submit" loading={isPending}>
              Create test case
            </Button>
            <Link href={`/projects/${projectId}/features/${featureId}`}>
              <Button type="button" variant="secondary">Cancel</Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
