-- LinkedIn posts can be drafted for review, but no external publishing is enabled.
alter table public.agent_approvals drop constraint if exists agent_approvals_service_check;
alter table public.agent_approvals add constraint agent_approvals_service_check
  check (service in ('trello','google_drive','github','vercel','linkedin'));
