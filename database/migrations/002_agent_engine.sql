-- Apply AFTER 001, only to a new independent Supabase. Prepared, not applied.
begin;

create table public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  agent_id uuid not null references public.agents(id),
  agent_slug text not null,
  request_id uuid references public.agent_requests(id),
  idempotency_key uuid not null,
  prompt text not null check (length(prompt) between 1 and 4000),
  status text not null default 'queued' check (status in ('queued','running','awaiting_approval','completed','failed','cancelled')),
  model text not null,
  response text not null default '',
  error_code text,
  reserved_usd numeric not null check (reserved_usd > 0),
  input_price numeric not null check (input_price >= 0),
  output_price numeric not null check (output_price >= 0),
  created_at timestamptz not null default now(),
  started_at timestamptz,
  started_by uuid references auth.users(id),
  cancelled_by uuid references auth.users(id),
  finished_at timestamptz,
  deadline_at timestamptz not null default now() + interval '5 minutes',
  unique (user_id,idempotency_key)
);
create index runs_user_created on public.agent_runs(user_id,created_at desc);
create index runs_agent_created on public.agent_runs(agent_slug,created_at desc);
create table public.agent_messages (
  id uuid primary key default gen_random_uuid(), run_id uuid not null references public.agent_runs(id),
  user_id uuid not null references auth.users(id), agent_id uuid not null references public.agents(id),
  role text not null check (role in ('user','assistant')), content text not null,
  created_at timestamptz not null default now(), unique(run_id,role)
);
create table public.agent_artifacts (
  id uuid primary key default gen_random_uuid(), run_id uuid not null references public.agent_runs(id),
  user_id uuid not null references auth.users(id), agent_id uuid not null references public.agents(id),
  kind text not null default 'markdown', content text not null,
  created_at timestamptz not null default now()
);
create table public.agent_tool_calls (
  id uuid primary key default gen_random_uuid(), run_id uuid not null references public.agent_runs(id),
  user_id uuid not null references auth.users(id), agent_id uuid not null references public.agents(id),
  tool_name text not null, status text not null check (status in ('completed','failed')),
  created_at timestamptz not null default now()
);
create table public.agent_approvals (
  id uuid primary key default gen_random_uuid(), run_id uuid not null references public.agent_runs(id),
  user_id uuid not null references auth.users(id), agent_id uuid not null references public.agents(id),
  service text not null check (service in ('trello','github','vercel')),
  action text not null check (length(action) between 1 and 100),
  proposal text not null check (length(proposal) between 1 and 2000),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  decided_by uuid references auth.users(id), decided_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.usage_logs (
  id uuid primary key default gen_random_uuid(), run_id uuid not null unique references public.agent_runs(id),
  user_id uuid not null references auth.users(id), agent_id uuid not null references public.agents(id),
  input_tokens integer, output_tokens integer, estimated_usd numeric,
  reserved_usd numeric not null, accounting_status text not null,
  created_at timestamptz not null default now()
);
create table public.agent_run_events (
  id bigint generated always as identity primary key, run_id uuid not null references public.agent_runs(id),
  user_id uuid not null references auth.users(id), agent_id uuid not null references public.agents(id),
  status text not null, actor_id uuid references auth.users(id), created_at timestamptz not null default now()
);

-- One team per database: approved viewers can read team history; unapproved users see nothing.
-- No browser can write runs, tool calls, costs or approvals directly, including administrators.
do $$ declare t text; begin
  foreach t in array array['agent_runs','agent_messages','agent_artifacts','agent_tool_calls','agent_approvals','usage_logs','agent_run_events'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from anon, authenticated',t);
    execute format('grant select on public.%I to authenticated',t);
    execute format('grant all on public.%I to service_role',t);
    execute format('create policy approved_team_read on public.%I for select to authenticated using (public.is_team_member(auth.uid()))',t);
  end loop;
end $$;
grant usage, select on sequence public.agent_run_events_id_seq to service_role;

create function public.record_run_event() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' or old.status is distinct from new.status then
    insert into public.agent_run_events(run_id,user_id,agent_id,status,actor_id) values(new.id,new.user_id,new.agent_id,new.status,coalesce(new.cancelled_by,new.started_by,new.user_id));
    if new.status in ('failed','cancelled') then
      update public.usage_logs set accounting_status='uncertain' where run_id=new.id;
    end if;
  end if;
  return new;
end $$;
create trigger run_event after insert or update on public.agent_runs for each row execute function public.record_run_event();
revoke all on function public.record_run_event() from public,anon,authenticated;

-- Serialization covers concurrent requests across server instances, daily team budget and replay.
create function public.reserve_agent_run(
  p_user uuid, p_slug text, p_prompt text, p_key uuid, p_request uuid,
  p_model text, p_reserve numeric, p_input_price numeric, p_output_price numeric,
  p_daily numeric, p_team_daily numeric, p_per_minute integer
) returns public.agent_runs language plpgsql security definer set search_path = '' as $$
declare r public.agent_runs; a uuid; day_start timestamptz;
begin
  perform pg_advisory_xact_lock(719205);
  if not public.can_edit(p_user) then raise exception 'EDITOR_REQUIRED'; end if;
  select * into r from public.agent_runs where user_id=p_user and idempotency_key=p_key;
  if found then
    if r.agent_slug<>p_slug or r.prompt<>p_prompt or r.request_id is distinct from p_request then
      raise exception 'IDEMPOTENCY_CONFLICT';
    end if;
    return r;
  end if;
  if p_reserve<=0 or p_daily<=0 or p_team_daily<=0 or p_per_minute not between 1 and 10 then raise exception 'INVALID_LIMITS'; end if;
  day_start := date_trunc('day',now() at time zone 'UTC') at time zone 'UTC';
  if (select count(*) from public.agent_runs where user_id=p_user and created_at>now()-interval '1 minute')>=p_per_minute then raise exception 'RATE_LIMIT'; end if;
  if exists(select 1 from public.agent_runs where user_id=p_user and status in ('queued','running')) then raise exception 'RUN_ACTIVE'; end if;
  -- Reservations are never refunded automatically: aborted/uncertain provider billing stays bounded.
  if (select coalesce(sum(reserved_usd),0) from public.agent_runs where user_id=p_user and created_at>=day_start)+p_reserve>p_daily
     or (select coalesce(sum(reserved_usd),0) from public.agent_runs where created_at>=day_start)+p_reserve>p_team_daily then
    raise exception 'BUDGET_EXCEEDED';
  end if;
  select id into a from public.agents where slug=p_slug;
  if a is null then raise exception 'AGENT_NOT_FOUND'; end if;
  if p_request is not null and not exists(select 1 from public.agent_requests where id=p_request and agent_id=a and requested_by=p_user) then raise exception 'REQUEST_NOT_FOUND'; end if;
  insert into public.agent_runs(user_id,agent_id,agent_slug,prompt,idempotency_key,request_id,model,reserved_usd,input_price,output_price)
    values(p_user,a,p_slug,p_prompt,p_key,p_request,p_model,p_reserve,p_input_price,p_output_price) returning * into r;
  insert into public.agent_messages(run_id,user_id,agent_id,role,content) values(r.id,p_user,a,'user',p_prompt);
  insert into public.usage_logs(run_id,user_id,agent_id,reserved_usd,accounting_status) values(r.id,p_user,a,p_reserve,'reserved');
  return r;
end $$;
revoke all on function public.reserve_agent_run(uuid,text,text,uuid,uuid,text,numeric,numeric,numeric,numeric,numeric,integer) from public,anon,authenticated;
grant execute on function public.reserve_agent_run(uuid,text,text,uuid,uuid,text,numeric,numeric,numeric,numeric,numeric,integer) to service_role;

create function public.finish_agent_run(p_run uuid,p_status text,p_response text,p_error text,p_input integer,p_output integer,p_estimate numeric)
returns public.agent_runs language plpgsql security definer set search_path = '' as $$
declare r public.agent_runs;
begin
  select * into r from public.agent_runs where id=p_run for update;
  if r.id is null then raise exception 'RUN_NOT_FOUND'; end if;
  if r.status <> 'running' then return r; end if;
  if p_status not in ('completed','failed','cancelled') then raise exception 'INVALID_STATUS'; end if;
  if p_status='completed' and exists(select 1 from public.agent_approvals where run_id=p_run and status='pending') then p_status:='awaiting_approval'; end if;
  update public.agent_runs set status=p_status,response=p_response,error_code=p_error,finished_at=now() where id=p_run returning * into r;
  insert into public.agent_messages(run_id,user_id,agent_id,role,content) values(r.id,r.user_id,r.agent_id,'assistant',p_response);
  if p_status in ('completed','awaiting_approval') then
    insert into public.agent_artifacts(run_id,user_id,agent_id,content) values(r.id,r.user_id,r.agent_id,p_response);
  end if;
  update public.usage_logs set input_tokens=p_input,output_tokens=p_output,estimated_usd=p_estimate,
    accounting_status=case when p_status in ('completed','awaiting_approval') then 'estimated' else 'uncertain' end where run_id=p_run;
  return r;
end $$;
revoke all on function public.finish_agent_run(uuid,text,text,text,integer,integer,numeric) from public,anon,authenticated;
grant execute on function public.finish_agent_run(uuid,text,text,text,integer,integer,numeric) to service_role;

create function public.decide_agent_approval(p_id uuid,p_approve boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare a public.agent_approvals; r public.agent_runs;
begin
  if not public.can_edit(auth.uid()) then raise exception 'EDITOR_REQUIRED'; end if;
  select * into a from public.agent_approvals where id=p_id;
  if a.id is null then raise exception 'APPROVAL_NOT_FOUND'; end if;
  select * into r from public.agent_runs where id=a.run_id for update;
  if a.user_id<>auth.uid() and not public.has_role(auth.uid(),'admin') then raise exception 'OWNER_REQUIRED'; end if;
  if r.status<>'awaiting_approval' then raise exception 'INVALID_STATUS'; end if;
  update public.agent_approvals set status=case when p_approve then 'approved' else 'rejected' end,
    decided_by=auth.uid(),decided_at=now() where id=p_id and status='pending';
  if not found then raise exception 'ALREADY_DECIDED'; end if;
  -- MVP records a reviewed proposal only. No external executor exists.
  if not exists(select 1 from public.agent_approvals where run_id=a.run_id and status='pending') then
    update public.agent_runs set status='completed' where id=a.run_id;
  end if;
end $$;
revoke all on function public.decide_agent_approval(uuid,boolean) from public,anon;
grant execute on function public.decide_agent_approval(uuid,boolean) to authenticated;
commit;
