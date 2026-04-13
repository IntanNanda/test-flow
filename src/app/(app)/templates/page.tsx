import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { FileText } from "lucide-react";

export const metadata = {
  title: "Templates — TestFlow",
};

const CATEGORY_LABELS: Record<string, string> = {
  auth: "Authentication",
  ecommerce: "E-commerce",
  forms: "Forms",
  navigation: "Navigation",
  custom: "Custom",
};

export default async function TemplatesPage() {
  const supabase = await createClient();

  const { data: templates } = await supabase
    .from("test_templates")
    .select("*")
    .eq("is_global", true)
    .order("category", { ascending: true });

  const grouped = (templates ?? []).reduce<Record<string, typeof templates>>(
    (acc, t) => {
      if (!t) return acc;
      const cat = t.category ?? "custom";
      if (!acc[cat]) acc[cat] = [];
      acc[cat]!.push(t);
      return acc;
    },
    {}
  );

  return (
    <div className="mx-auto max-w-[1400px] p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Template library
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Pre-built test case templates you can clone into any project.
        </p>
      </div>

      {Object.keys(grouped).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(grouped).map(([category, items]) => (
            <section key={category}>
              <h2 className="mb-3 text-base font-semibold text-[var(--text-primary)]">
                {CATEGORY_LABELS[category] ?? category}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items?.map((template) => (
                  <Card key={template.id} className="flex flex-col gap-2">
                    <div className="flex items-start gap-2">
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[#DBEAFE] dark:bg-[#1E3A8A]/30"
                        aria-hidden="true"
                      >
                        <FileText className="h-4 w-4 text-[#1E40AF]" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                          {template.name}
                        </h3>
                        {template.description && (
                          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                            {template.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                      <span className="rounded bg-[#F5F5F4] px-1.5 py-0.5 dark:bg-[#292524]">
                        {template.scenario_type}
                      </span>
                      <span className="rounded bg-[#F5F5F4] px-1.5 py-0.5 dark:bg-[#292524]">
                        {template.test_type === "functional"
                          ? "Functional"
                          : template.test_type === "api_performance"
                          ? "API Perf"
                          : "Lighthouse"}
                      </span>
                      <span>
                        {Array.isArray(template.steps_json)
                          ? (template.steps_json as unknown[]).length
                          : 0}{" "}
                        steps
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="No templates yet"
          description="Global templates will appear here. They are seeded via the Supabase seed.sql file."
        />
      )}
    </div>
  );
}
