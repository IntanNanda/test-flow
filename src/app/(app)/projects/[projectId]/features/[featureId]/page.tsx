import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { TestCaseTable } from "./TestCaseTable";
import { FeatureHeader } from "./FeatureHeader";
import { TestTube2, ChevronRight } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ projectId: string; featureId: string }>;
}) {
  const { featureId } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("features")
    .select("name")
    .eq("id", featureId)
    .single();
  return { title: data ? `${data.name} — TestFlow` : "Feature — TestFlow" };
}


export default async function FeaturePage({
  params,
}: {
  params: Promise<{ projectId: string; featureId: string }>;
}) {
  const { projectId, featureId } = await params;
  const supabase = await createClient();

  const [{ data: feature }, { data: project }] = await Promise.all([
    supabase.from("features").select("*").eq("id", featureId).single(),
    supabase.from("projects").select("id, name").eq("id", projectId).single(),
  ]);

  if (!feature) notFound();

  const { data: testCases } = await supabase
    .from("test_cases")
    .select("*")
    .eq("feature_id", featureId)
    .order("created_at", { ascending: false });

  const total   = testCases?.length ?? 0;
  const passed  = testCases?.filter((tc) => tc.last_run_status === "passed").length ?? 0;
  const failed  = testCases?.filter((tc) => tc.last_run_status === "failed").length ?? 0;
  const pending = testCases?.filter((tc) => !tc.last_run_status || tc.last_run_status === "pending").length ?? 0;

  return (
    <div className="min-h-screen bg-[#EEF2F7]">
      <div className="mx-auto max-w-350 px-6 py-6">

        {/* Breadcrumb */}
        <nav className="mb-3 flex items-center gap-1.5 text-sm">
          <Link href="/projects" className="text-[#6B7A99] transition-colors hover:text-[#2B6CFF]">
            Projects
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-[#B0BAD0]" aria-hidden="true" />
          <Link href={`/projects/${projectId}`} className="text-[#6B7A99] transition-colors hover:text-[#2B6CFF]">
            {project?.name}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-[#B0BAD0]" aria-hidden="true" />
          <span className="font-semibold text-[#0A1B3D]">{feature.name}</span>
        </nav>

        {/* Header card */}
        <FeatureHeader
          projectId={projectId}
          featureId={featureId}
          name={feature.name}
          description={feature.description}
          lastRunAt={testCases?.find((tc) => tc.last_run_at)?.last_run_at ?? null}
        />

        {/* Table */}
        {testCases && testCases.length > 0 ? (
          <TestCaseTable
            testCases={testCases}
            projectId={projectId}
            featureId={featureId}
            featureName={feature.name}
            counts={{ total, passed, failed, pending }}
          />
        ) : (
          <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
            <EmptyState
              icon={TestTube2}
              title="No test cases yet"
              description="Add test cases to document what should be tested — positive flows, negative cases, and edge scenarios."
              action={{ label: "New test case" }}
            />
          </div>
        )}

      </div>
    </div>
  );
}
