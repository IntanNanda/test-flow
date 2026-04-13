import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { formatPercent } from "@/lib/utils";
import { CheckCircle2, XCircle, Activity, TrendingUp } from "lucide-react";

export const metadata = {
  title: "Dashboard — TestFlow",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  // Fetch recent run summaries across all projects
  const { data: summaries } = await supabase
    .from("run_summaries")
    .select(`*, projects(name)`)
    .order("date", { ascending: false })
    .limit(30);

  const today = summaries?.[0];
  const overallPassRate = today?.pass_rate ?? null;
  const overallBugRate = today?.bug_rate ?? null;

  return (
    <div className="mx-auto max-w-[1400px] p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Overall test health across all your projects
        </p>
      </div>

      {/* Summary cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pass Rate"
          value={overallPassRate !== null ? formatPercent(overallPassRate) : "—"}
          icon={CheckCircle2}
          iconColor="text-[#15803D]"
          description="Today"
        />
        <StatCard
          title="Bug Rate"
          value={overallBugRate !== null ? formatPercent(overallBugRate) : "—"}
          icon={XCircle}
          iconColor="text-[#B91C1C]"
          description="Today"
        />
        <StatCard
          title="Tests Run"
          value={today?.total_cases_run?.toString() ?? "0"}
          icon={Activity}
          iconColor="text-[#1E40AF]"
          description="Today"
        />
        <StatCard
          title="Total Runs"
          value={today?.total_runs?.toString() ?? "0"}
          icon={TrendingUp}
          iconColor="text-[#B45309]"
          description="Today"
        />
      </div>

      {/* Empty state when no data */}
      {(!summaries || summaries.length === 0) && (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Activity
                className="mb-4 h-10 w-10 text-[var(--text-muted)]"
                aria-hidden="true"
              />
              <h2 className="mb-1 text-base font-semibold text-[var(--text-primary)]">
                No test runs yet
              </h2>
              <p className="max-w-sm text-sm text-[var(--text-secondary)]">
                Create a project, add test cases, and run them to see health
                metrics here.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  iconColor,
  description,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  iconColor: string;
  description: string;
}) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              {title}
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-[var(--text-primary)]">
              {value}
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{description}</p>
          </div>
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F5F5F4] dark:bg-[#292524]"
            aria-hidden="true"
          >
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
