// Type stubs — run `npx supabase gen types typescript` after linking your project
// to get fully auto-generated types. These manual stubs are enough to get TS happy
// until the Supabase project is linked.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ── Enum aliases ────────────────────────────────────────────────
export type ScenarioType = "positive" | "negative" | "edge";
export type TestType = "functional" | "api_performance" | "frontend_performance";
export type TestPriority = "critical" | "high" | "medium" | "low";
export type TestCaseStatus = "draft" | "active" | "deprecated";
export type RunStatus = "pending" | "queued" | "running" | "passed" | "failed" | "error" | "cancelled";
export type CaseRunStatus = "pending" | "running" | "passed" | "failed" | "error" | "skipped";
export type TriggerType = "manual" | "scheduled" | "api";
export type MemberRole = "owner" | "admin" | "member" | "viewer";
export type InviteRole = "admin" | "member" | "viewer";

// ── Row types ────────────────────────────────────────────────────
export type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Team = {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  created_at: string;
};

export type TeamMember = {
  id: string;
  team_id: string;
  profile_id: string;
  role: MemberRole;
  invited_by: string | null;
  joined_at: string;
};

export type PerformanceHistory = {
  id: string;
  test_case_id: string;
  run_date: string;
  performance_score: number | null;
  accessibility_score: number | null;
  lcp_ms: number | null;
  cls: number | null;
  fcp_ms: number | null;
  p95_ms: number | null;
  error_rate: number | null;
  created_at: string;
};

export type LighthouseConfig = {
  id: string;
  test_case_id: string;
  url: string;
  device: "desktop" | "mobile";
  run_count: number;
  throttling: "none" | "simulated" | "applied";
  threshold_performance: number;
  threshold_accessibility: number;
  threshold_best_practices: number;
  threshold_seo: number;
  regression_delta: number;
  created_at: string;
  updated_at: string;
};

export type ApiTestConfig = {
  id: string;
  test_case_id: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";
  endpoint_path: string;
  headers: Json;
  request_body: Json | null;
  auth_type: "none" | "bearer" | "basic" | "api_key" | null;
  auth_config: Json | null;
  concurrency: number;
  request_count: number;
  threshold_p50_ms: number;
  threshold_p95_ms: number;
  threshold_p99_ms: number;
  threshold_error_rate: number;
  created_at: string;
  updated_at: string;
};

export type LighthouseResult = {
  id: string;
  case_run_id: string;
  run_number: number;
  is_median: boolean;
  performance_score: number | null;
  accessibility_score: number | null;
  best_practices_score: number | null;
  seo_score: number | null;
  lcp_ms: number | null;
  cls: number | null;
  fid_ms: number | null;
  ttfb_ms: number | null;
  fcp_ms: number | null;
  tbt_ms: number | null;
  si_ms: number | null;
  chrome_version: string | null;
  lighthouse_version: string | null;
  throttling_profile: string | null;
  report_url: string | null;
  raw_json_url: string | null;
  regression_detected: boolean;
  previous_score: number | null;
  created_at: string;
};

export type LighthouseResultInsert = Omit<LighthouseResult, "id" | "created_at">;

export type TeamInvite = {
  id: string;
  team_id: string;
  email: string;
  role: InviteRole;
  token: string;
  invited_by: string;
  expires_at: string;
  accepted: boolean;
  created_at: string;
};

export type Project = {
  id: string;
  team_id: string;
  name: string;
  slug: string;
  description: string | null;
  base_url: string | null;
  status: "active" | "archived";
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type Feature = {
  id: string;
  project_id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type TestCase = {
  id: string;
  feature_id: string;
  title: string;
  description: string | null;
  scenario_type: ScenarioType;
  test_type: TestType;
  priority: TestPriority;
  status: TestCaseStatus;
  preconditions: string | null;
  test_data: Json | null;
  tags: string[];
  assignee_id: string | null;
  estimated_duration_ms: number | null;
  last_run_at: string | null;
  last_run_status: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type TestStep = {
  id: string;
  test_case_id: string;
  step_order: number;
  action: string;
  selector: string | null;
  value: string | null;
  description: string | null;
  screenshot_on_step: boolean;
  created_at: string;
};

export type TestRun = {
  id: string;
  project_id: string;
  name: string | null;
  status: RunStatus;
  trigger_type: TriggerType;
  triggered_by: string | null;
  schedule_id: string | null;
  environment: string;
  base_url_override: string | null;
  total_cases: number;
  passed: number;
  failed: number;
  skipped: number;
  errored: number;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  worker_node_id: string | null;
  metadata: Json;
  created_at: string;
};

export type TestCaseRun = {
  id: string;
  test_run_id: string;
  test_case_id: string;
  status: CaseRunStatus;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  error_message: string | null;
  error_stack: string | null;
  step_results: Json | null;
  screenshot_urls: string[];
  video_url: string | null;
  console_log: string | null;
  network_log: Json | null;
  created_at: string;
};

export type Schedule = {
  id: string;
  project_id: string;
  name: string;
  cron_expr: string;
  timezone: string;
  preset: "nightly" | "weekly" | "hourly" | "custom" | null;
  is_active: boolean;
  filter_tags: string[] | null;
  filter_feature_ids: string[] | null;
  environment: string;
  base_url_override: string | null;
  created_by: string;
  last_run_at: string | null;
  next_run_at: string | null;
  created_at: string;
  updated_at: string;
};

export type RunSummary = {
  id: string;
  project_id: string;
  feature_id: string | null;
  date: string;
  total_runs: number;
  total_cases_run: number;
  passed: number;
  failed: number;
  pass_rate: number | null;
  bug_rate: number | null;
  avg_duration_ms: number | null;
};

export type NotificationChannel = {
  id: string;
  team_id: string;
  name: string;
  channel_type: "slack" | "discord" | "email";
  config: Json;
  is_active: boolean;
  created_at: string;
};

export type TestTemplate = {
  id: string;
  name: string;
  description: string | null;
  test_type: TestType;
  scenario_type: ScenarioType;
  category: string;
  steps_json: Json;
  is_global: boolean;
  team_id: string | null;
  created_by: string | null;
  created_at: string;
};

// ── Insert types ─────────────────────────────────────────────────
export type ProjectInsert = {
  team_id: string;
  name: string;
  slug: string;
  description?: string | null;
  base_url?: string | null;
  status?: "active" | "archived";
  created_by: string;
};

export type FeatureInsert = {
  project_id: string;
  name: string;
  slug: string;
  description?: string | null;
  sort_order?: number;
  created_by: string;
};

export type TestCaseInsert = {
  feature_id: string;
  title: string;
  description?: string | null;
  scenario_type?: ScenarioType;
  test_type?: TestType;
  priority?: TestPriority;
  status?: TestCaseStatus;
  preconditions?: string | null;
  test_data?: Json | null;
  tags?: string[];
  assignee_id?: string | null;
  estimated_duration_ms?: number | null;
  created_by: string;
};

export type TestStepInsert = {
  test_case_id: string;
  step_order: number;
  action: string;
  selector?: string | null;
  value?: string | null;
  description?: string | null;
  screenshot_on_step?: boolean;
};

export type TestRunInsert = {
  project_id: string;
  name?: string | null;
  status?: RunStatus;
  trigger_type?: TriggerType;
  triggered_by?: string | null;
  schedule_id?: string | null;
  environment?: string;
  base_url_override?: string | null;
  total_cases?: number;
  passed?: number;
  failed?: number;
  skipped?: number;
  errored?: number;
  metadata?: Json;
};

export type TestCaseRunInsert = {
  test_run_id: string;
  test_case_id: string;
  status?: CaseRunStatus;
  started_at?: string | null;
  completed_at?: string | null;
  duration_ms?: number | null;
  error_message?: string | null;
  error_stack?: string | null;
  step_results?: Json | null;
  screenshot_urls?: string[];
  video_url?: string | null;
  console_log?: string | null;
  network_log?: Json | null;
};

// ── Database type (Supabase client generic) ───────────────────────
export type Database = {
  __InternalSupabase?: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at">;
        Update: Partial<Omit<Profile, "id">>;
        Relationships: [];
      };
      teams: {
        Row: Team;
        Insert: Omit<Team, "id" | "created_at">;
        Update: Partial<Omit<Team, "id" | "created_at">>;
        Relationships: [];
      };
      team_members: {
        Row: TeamMember;
        Insert: { team_id: string; profile_id: string; role?: MemberRole; invited_by?: string | null };
        Update: Partial<Omit<TeamMember, "id" | "joined_at">>;
        Relationships: [];
      };
      team_invites: {
        Row: TeamInvite;
        Insert: Omit<TeamInvite, "id" | "token" | "accepted" | "created_at">;
        Update: Partial<Omit<TeamInvite, "id" | "token" | "created_at">>;
        Relationships: [];
      };
      projects: {
        Row: Project;
        Insert: ProjectInsert;
        Update: Partial<Omit<Project, "id" | "created_at">>;
        Relationships: [];
      };
      features: {
        Row: Feature;
        Insert: FeatureInsert;
        Update: Partial<Omit<Feature, "id" | "created_at">>;
        Relationships: [];
      };
      test_cases: {
        Row: TestCase;
        Insert: TestCaseInsert;
        Update: Partial<Omit<TestCase, "id" | "created_at">>;
        Relationships: [];
      };
      test_steps: {
        Row: TestStep;
        Insert: TestStepInsert;
        Update: Partial<Omit<TestStep, "id" | "created_at">>;
        Relationships: [];
      };
      test_runs: {
        Row: TestRun;
        Insert: TestRunInsert;
        Update: Partial<Omit<TestRun, "id" | "created_at">>;
        Relationships: [];
      };
      test_case_runs: {
        Row: TestCaseRun;
        Insert: TestCaseRunInsert;
        Update: Partial<Omit<TestCaseRun, "id" | "created_at">>;
        Relationships: [];
      };
      schedules: {
        Row: Schedule;
        Insert: Pick<Schedule, "project_id" | "name" | "cron_expr" | "timezone" | "created_by"> & Partial<Omit<Schedule, "id" | "created_at" | "updated_at" | "project_id" | "name" | "cron_expr" | "timezone" | "created_by">>;
        Update: Partial<Omit<Schedule, "id" | "created_at">>;
        Relationships: [];
      };
      performance_history: {
        Row: PerformanceHistory;
        Insert: Omit<PerformanceHistory, "id" | "created_at">;
        Update: Partial<Omit<PerformanceHistory, "id" | "created_at">>;
        Relationships: [];
      };
      api_test_configs: {
        Row: ApiTestConfig;
        Insert: {
          test_case_id: string;
          method: ApiTestConfig["method"];
          endpoint_path: string;
          headers?: Json;
          request_body?: Json | null;
          auth_type?: ApiTestConfig["auth_type"];
          auth_config?: Json | null;
          concurrency?: number;
          request_count?: number;
          threshold_p50_ms?: number;
          threshold_p95_ms?: number;
          threshold_p99_ms?: number;
          threshold_error_rate?: number;
        };
        Update: Partial<Omit<ApiTestConfig, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      lighthouse_configs: {
        Row: LighthouseConfig;
        Insert: {
          test_case_id: string;
          url: string;
          device?: "desktop" | "mobile";
          run_count?: number;
          throttling?: "none" | "simulated" | "applied";
          threshold_performance?: number;
          threshold_accessibility?: number;
          threshold_best_practices?: number;
          threshold_seo?: number;
          regression_delta?: number;
        };
        Update: Partial<Omit<LighthouseConfig, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      lighthouse_results: {
        Row: LighthouseResult;
        Insert: Omit<LighthouseResult, "id" | "created_at">;
        Update: Partial<Omit<LighthouseResult, "id" | "created_at">>;
        Relationships: [];
      };
      run_summaries: {
        Row: RunSummary;
        Insert: Omit<RunSummary, "id">;
        Update: Partial<Omit<RunSummary, "id">>;
        Relationships: [];
      };
      notification_channels: {
        Row: NotificationChannel;
        Insert: Omit<NotificationChannel, "id" | "created_at">;
        Update: Partial<Omit<NotificationChannel, "id" | "created_at">>;
        Relationships: [];
      };
      test_templates: {
        Row: TestTemplate;
        Insert: Omit<TestTemplate, "id" | "created_at">;
        Update: Partial<Omit<TestTemplate, "id" | "created_at">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_team_member: { Args: { p_team_id: string }; Returns: boolean };
      team_role: { Args: { p_team_id: string }; Returns: string };
      can_write_team: { Args: { p_team_id: string }; Returns: boolean };
    };
    Enums: {
      test_scenario_type: ScenarioType;
      test_type: TestType;
      test_priority: TestPriority;
      test_case_status: TestCaseStatus;
      run_status: RunStatus;
      case_run_status: CaseRunStatus;
      trigger_type: TriggerType;
    };
  };
};
