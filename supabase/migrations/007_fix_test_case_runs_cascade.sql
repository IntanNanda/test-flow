-- Fix missing ON DELETE CASCADE on test_case_runs.test_case_id
-- Without this, deleting a test_case fails with FK violation if runs exist.

alter table public.test_case_runs
  drop constraint test_case_runs_test_case_id_fkey;

alter table public.test_case_runs
  add constraint test_case_runs_test_case_id_fkey
    foreign key (test_case_id)
    references public.test_cases(id)
    on delete cascade;
