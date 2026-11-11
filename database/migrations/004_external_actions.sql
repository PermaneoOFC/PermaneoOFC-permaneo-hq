-- Permaneo HQ: reviewed external actions, at most once, and Drive proposal support.
-- Apply only to the independent HQ Supabase project.
create table if not exists public.external_action_executions (
  id uuid primary key default gen_random_uuid(),
  approval_id uuid not null unique references public.agent_approvals(id) on delete restrict,
  service text not null,
  action text not null,
  status text not null check (status in ('started','completed','failed')),
  result_url text,
  error_code text,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
alter table public.external_action_executions enable row level security;
grant all on public.external_action_executions to service_role;
grant select on public.external_action_executions to authenticated;
create policy "approved members see own executions" on public.external_action_executions
  for select to authenticated
  using (exists (
    select 1 from public.agent_approvals a
    where a.id = approval_id
    and (a.user_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
  ));
alter table public.agent_approvals drop constraint if exists agent_approvals_service_check;
alter table public.agent_approvals
  add constraint agent_approvals_service_check check (service in ('trello','google_drive','github','vercel'));
