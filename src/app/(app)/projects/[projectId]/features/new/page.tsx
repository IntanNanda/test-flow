"use client";

import { use, useActionState } from "react";
import Link from "next/link";
import { createFeature } from "@/app/actions/features";
import { FormField, TextareaField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";

export default function NewFeaturePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const boundAction = createFeature.bind(null, projectId);
  const [state, action, isPending] = useActionState(boundAction, {});

  return (
    <div className="mx-auto max-w-[720px] p-6">
      <div className="mb-6">
        <Link
          href={`/projects/${projectId}`}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to project
        </Link>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          New feature
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Features group related test cases — e.g. &quot;Login Flow&quot;, &quot;Checkout&quot;,
          &quot;Dashboard&quot;.
        </p>
      </div>

      {state.message && (
        <div
          role="alert"
          className="mb-4 rounded border border-[#FEE2E2] bg-[#FEE2E2] p-3 text-sm text-[#7F1D1D]"
        >
          {state.message}
        </div>
      )}

      <div className="rounded-lg border border-[#E7E5E4] bg-white p-6 dark:border-[#292524] dark:bg-[#1C1917]">
        <form action={action} className="space-y-5">
          <FormField
            label="Feature name"
            name="name"
            required
            placeholder="e.g. Login Flow"
            error={state.errors?.name?.[0]}
          />
          <TextareaField
            label="Description"
            name="description"
            placeholder="What functionality does this feature cover? (optional)"
            error={state.errors?.description?.[0]}
          />
          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" loading={isPending}>
              Create feature
            </Button>
            <Link href={`/projects/${projectId}`}>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
