"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createProject } from "@/app/actions/projects";
import { FormField, TextareaField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";

export default function NewProjectPage() {
  const [state, action, isPending] = useActionState(createProject, {});

  return (
    <div className="mx-auto max-w-[720px] p-6">
      <div className="mb-6">
        <Link
          href="/projects"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to projects
        </Link>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          New project
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Group related features and test cases under a single project.
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
            label="Project name"
            name="name"
            required
            placeholder="e.g. E-commerce App"
            error={state.errors?.name?.[0]}
          />

          <TextareaField
            label="Description"
            name="description"
            placeholder="What does this project test? (optional)"
            error={state.errors?.description?.[0]}
          />

          <FormField
            label="Base URL"
            name="base_url"
            type="url"
            placeholder="https://your-app.com"
            hint="The root URL for automated Playwright and Lighthouse tests"
            error={state.errors?.base_url?.[0]}
          />

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" loading={isPending}>
              Create project
            </Button>
            <Link href="/projects">
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
