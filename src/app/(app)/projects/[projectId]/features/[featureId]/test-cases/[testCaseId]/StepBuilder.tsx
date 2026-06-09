"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { addStep, removeStep, updateStep } from "@/app/actions/test-steps";
import { Plus, Trash2, Camera, Pencil, X } from "lucide-react";
import type { TestStep } from "@/types/database";

const ACTION_OPTIONS = [
  { value: "navigate", label: "Navigate to URL" },
  { value: "click", label: "Click element" },
  { value: "fill", label: "Fill input" },
  { value: "select", label: "Select option" },
  { value: "check", label: "Check checkbox" },
  { value: "uncheck", label: "Uncheck checkbox" },
  { value: "assert_text", label: "Assert text content" },
  { value: "assert_visible", label: "Assert element visible" },
  { value: "assert_url", label: "Assert URL" },
  { value: "wait", label: "Wait (ms)" },
  { value: "screenshot", label: "Take screenshot" },
  { value: "custom", label: "Custom step" },
];

const SELECTOR_PLACEHOLDER: Record<string, string> = {
  navigate: "https://example.com/page",
  click: "#submit-button or text=Submit",
  fill: "input[name='email'] or [placeholder='Email']",
  select: "select#country",
  check: "input[type='checkbox']#agree",
  uncheck: "input[type='checkbox']#subscribe",
  assert_text: ".heading or h1",
  assert_visible: ".success-banner",
  assert_url: "",
  wait: "",
  screenshot: "",
  custom: "selector (optional)",
};

const VALUE_PLACEHOLDER: Record<string, string> = {
  navigate: "",
  click: "",
  fill: "value to type",
  select: "option value",
  check: "",
  uncheck: "",
  assert_text: "Expected text content",
  assert_visible: "",
  assert_url: "https://expected.com/path",
  wait: "1000",
  screenshot: "screenshot-name",
  custom: "expected value (optional)",
};

interface StepBuilderProps {
  testCaseId: string;
  featureId: string;
  projectId: string;
  initialSteps: TestStep[];
}

function StepEditModal({
  step,
  testCaseId,
  featureId,
  projectId,
  onClose,
}: {
  step: TestStep;
  testCaseId: string;
  featureId: string;
  projectId: string;
  onClose: () => void;
}) {
  const [action, setAction] = useState(step.action);
  const [selector, setSelector] = useState(step.selector ?? "");
  const [value, setValue] = useState(step.value ?? "");
  const [description, setDescription] = useState(step.description ?? "");
  const [screenshotOnStep, setScreenshotOnStep] = useState(step.screenshot_on_step);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const needsSelector = !["wait", "assert_url", "screenshot"].includes(action);
  const needsValue = !["click", "check", "uncheck", "assert_visible", "navigate"].includes(action);

  function handleSave() {
    const formData = new FormData();
    formData.set("action", action);
    formData.set("selector", selector.trim());
    formData.set("value", value.trim());
    formData.set("description", description.trim());
    if (screenshotOnStep) formData.set("screenshot_on_step", "true");

    startTransition(async () => {
      const result = await updateStep(step.id, testCaseId, featureId, projectId, formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Step updated");
      router.refresh();
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="edit-step-title">
      <div className="absolute inset-0 bg-[#0A1B3D]/30 backdrop-blur-sm" onClick={() => { if (!isPending) onClose(); }} />
      <div className="relative z-10 w-full max-w-xl rounded-2xl bg-white shadow-2xl dark:bg-[#1C1917]">
        <div className="flex items-center justify-between border-b border-[#E7E5E4] px-6 py-4 dark:border-[#292524]">
          <h2 id="edit-step-title" className="text-sm font-semibold text-[var(--text-primary)]">Edit step</h2>
          <button
            type="button"
            onClick={() => { if (!isPending) onClose(); }}
            disabled={isPending}
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[#F5F5F4] hover:text-[var(--text-primary)] disabled:opacity-50 dark:hover:bg-[#292524]"
            aria-label="Close"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-step-action" className="text-xs font-semibold text-[var(--text-primary)]">
                Action
              </label>
              <select
                id="edit-step-action"
                value={action}
                onChange={(event) => setAction(event.target.value)}
                className="h-9 rounded border border-[#E7E5E4] bg-white px-2 text-sm dark:border-[#292524] dark:bg-[#1C1917] dark:text-[#FAFAF9]"
              >
                {ACTION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {needsSelector && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="edit-step-selector" className="text-xs font-semibold text-[var(--text-primary)]">
                  Selector / URL
                </label>
                <input
                  id="edit-step-selector"
                  value={selector}
                  onChange={(event) => setSelector(event.target.value)}
                  placeholder={SELECTOR_PLACEHOLDER[action]}
                  className="h-9 rounded border border-[#E7E5E4] bg-white px-2 font-mono text-xs dark:border-[#292524] dark:bg-[#1C1917] dark:text-[#FAFAF9]"
                />
              </div>
            )}

            {needsValue && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="edit-step-value" className="text-xs font-semibold text-[var(--text-primary)]">
                  Value
                </label>
                <input
                  id="edit-step-value"
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  placeholder={VALUE_PLACEHOLDER[action]}
                  className="h-9 rounded border border-[#E7E5E4] bg-white px-2 text-sm dark:border-[#292524] dark:bg-[#1C1917] dark:text-[#FAFAF9]"
                />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-step-description" className="text-xs font-semibold text-[var(--text-primary)]">
              Description
            </label>
            <input
              id="edit-step-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="h-9 rounded border border-[#E7E5E4] bg-white px-2 text-sm dark:border-[#292524] dark:bg-[#1C1917] dark:text-[#FAFAF9]"
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={screenshotOnStep}
              onChange={(event) => setScreenshotOnStep(event.target.checked)}
              className="h-4 w-4 rounded border-[#E7E5E4] text-[#1E40AF]"
            />
            <Camera className="h-3.5 w-3.5 text-[var(--text-muted)]" aria-hidden="true" />
            Take screenshot after this step
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#E7E5E4] px-6 py-4 dark:border-[#292524]">
          <Button type="button" variant="secondary" size="sm" onClick={() => onClose()} disabled={isPending}>
            Cancel
          </Button>
          <Button type="button" size="sm" onClick={handleSave} loading={isPending}>
            Save step
          </Button>
        </div>
      </div>
    </div>
  );
}

export function StepBuilder({
  testCaseId,
  featureId,
  projectId,
  initialSteps,
}: StepBuilderProps) {
  const [showForm, setShowForm] = useState(false);
  const [selectedAction, setSelectedAction] = useState("navigate");
  const [editTarget, setEditTarget] = useState<TestStep | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleAddStep(formData: FormData) {
    startTransition(async () => {
      await addStep(testCaseId, featureId, projectId, formData);
      setShowForm(false);
      setSelectedAction("navigate");
    });
  }

  function handleRemoveStep(stepId: string) {
    startTransition(async () => {
      const result = await removeStep(stepId, testCaseId, featureId, projectId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Step deleted");
      router.refresh();
    });
  }

  const needsSelector = !["wait", "assert_url", "screenshot"].includes(selectedAction);
  const needsValue = !["click", "check", "uncheck", "assert_visible", "navigate"].includes(selectedAction);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Test steps{" "}
          <span className="ml-1 text-xs font-normal text-[var(--text-muted)]">
            ({initialSteps.length})
          </span>
        </CardTitle>
        {!showForm && (
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => setShowForm(true)}
          >
            Add step
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {/* Steps list */}
        {initialSteps.length > 0 ? (
          <ol aria-label="Test steps" className="mb-4 space-y-2">
            {initialSteps.map((step, index) => (
              <li
                key={step.id}
                className="group flex items-start gap-3 rounded border border-[#E7E5E4] bg-[#FAFAF9] p-3 dark:border-[#292524] dark:bg-[#0C0A09]"
              >
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#DBEAFE] text-xs font-semibold tabular-nums text-[#1E40AF]"
                  aria-label={`Step ${index + 1}`}
                >
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    <span className="rounded bg-[#F5F5F4] px-1 py-0.5 font-mono text-xs dark:bg-[#292524]">
                      {ACTION_OPTIONS.find((a) => a.value === step.action)?.label ?? step.action}
                    </span>
                    {step.selector && (
                      <>
                        {" "}
                        <code className="font-mono text-xs text-[#1E40AF]">{step.selector}</code>
                      </>
                    )}
                    {step.value && (
                      <span className="ml-1 text-[var(--text-secondary)]">
                        → &quot;{step.value}&quot;
                      </span>
                    )}
                  </p>
                  {step.description && (
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">{step.description}</p>
                  )}
                  {step.screenshot_on_step && (
                    <span className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--text-muted)]">
                      <Camera className="h-3 w-3" aria-hidden="true" />
                      Screenshot on this step
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditTarget(step)}
                    disabled={isPending}
                    aria-label={`Edit step ${index + 1}`}
                    className="rounded p-1 text-[var(--text-muted)] transition-colors hover:bg-[#DBEAFE] hover:text-[#1E40AF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] disabled:opacity-50"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveStep(step.id)}
                    disabled={isPending}
                    aria-label={`Remove step ${index + 1}`}
                    className="rounded p-1 text-[var(--text-muted)] transition-colors hover:bg-[#FEE2E2] hover:text-[#B91C1C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          !showForm && (
            <p className="mb-4 text-sm text-[var(--text-muted)]">
              No steps yet. Add steps to define how this test runs automatically.
            </p>
          )
        )}

        {/* Add step form */}
        {showForm && (
          <form
            action={handleAddStep}
            className="space-y-3 rounded border border-[#DBEAFE] bg-[#F0F7FF] p-4 dark:border-[#1E3A8A]/50 dark:bg-[#1E3A8A]/10"
            aria-label="Add test step"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Action */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="step-action" className="text-xs font-semibold text-[var(--text-primary)]">
                  Action <span className="text-[#B91C1C]" aria-hidden="true">*</span>
                </label>
                <select
                  id="step-action"
                  name="action"
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  required
                  className="h-9 rounded border border-[#E7E5E4] bg-white px-2 text-sm dark:border-[#292524] dark:bg-[#1C1917] dark:text-[#FAFAF9]"
                >
                  {ACTION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Selector */}
              {needsSelector && (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="step-selector" className="text-xs font-semibold text-[var(--text-primary)]">
                    Selector / URL
                  </label>
                  <input
                    id="step-selector"
                    name="selector"
                    type="text"
                    placeholder={SELECTOR_PLACEHOLDER[selectedAction]}
                    className="h-9 rounded border border-[#E7E5E4] bg-white px-2 font-mono text-xs dark:border-[#292524] dark:bg-[#1C1917] dark:text-[#FAFAF9]"
                  />
                </div>
              )}

              {/* Value */}
              {needsValue && (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="step-value" className="text-xs font-semibold text-[var(--text-primary)]">
                    {selectedAction === "assert_text" ? "Expected text" :
                     selectedAction === "assert_url" ? "Expected URL" :
                     selectedAction === "wait" ? "Duration (ms)" : "Value"}
                  </label>
                  <input
                    id="step-value"
                    name="value"
                    type="text"
                    placeholder={VALUE_PLACEHOLDER[selectedAction]}
                    className="h-9 rounded border border-[#E7E5E4] bg-white px-2 text-sm dark:border-[#292524] dark:bg-[#1C1917] dark:text-[#FAFAF9]"
                  />
                </div>
              )}
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="step-description" className="text-xs font-semibold text-[var(--text-primary)]">
                Description (optional)
              </label>
              <input
                id="step-description"
                name="description"
                type="text"
                placeholder="Human-readable description of this step"
                className="h-9 rounded border border-[#E7E5E4] bg-white px-2 text-sm dark:border-[#292524] dark:bg-[#1C1917] dark:text-[#FAFAF9]"
              />
            </div>

            {/* Screenshot toggle */}
            <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text-secondary)]">
              <input
                type="checkbox"
                name="screenshot_on_step"
                value="true"
                className="h-4 w-4 rounded border-[#E7E5E4] text-[#1E40AF]"
              />
              <Camera className="h-3.5 w-3.5 text-[var(--text-muted)]" aria-hidden="true" />
              Take screenshot after this step
            </label>

            <div className="flex items-center gap-2">
              <Button type="submit" size="sm" loading={isPending}>
                Add step
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Show add button at bottom when steps exist */}
        {initialSteps.length > 0 && !showForm && (
          <Button
            size="sm"
            variant="tertiary"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => setShowForm(true)}
          >
            Add another step
          </Button>
        )}
      </CardContent>
      {editTarget && (
        <StepEditModal
          step={editTarget}
          testCaseId={testCaseId}
          featureId={featureId}
          projectId={projectId}
          onClose={() => setEditTarget(null)}
        />
      )}
    </Card>
  );
}
