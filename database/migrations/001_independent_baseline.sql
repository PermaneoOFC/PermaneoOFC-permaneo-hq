-- FRESH Supabase database only. Never run against the existing Lovable database.
-- Reviewed replacement of legacy 0000 + 0001; no automatic administrator bootstrap.
begin;
create type public.app_role as enum ('admin','editor','viewer');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
revoke insert, update, delete, truncate, references, trigger on public.user_roles from anon, authenticated;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
create or replace function public.can_edit(_user_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('admin','editor'))
$$;

create policy "own roles readable" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- No signup trigger grants roles. Bootstrap is an explicit offline DBA operation.

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

-- AGENTS
create type public.agent_status as enum ('disponivel','aguardando_aprovacao','em_andamento','pausado','nao_configurado');
create table public.agents (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  role_title text not null,
  description text not null default '',
  responsibilities text[] not null default '{}',
  room text not null,
  status public.agent_status not null default 'disponivel',
  is_coordinator boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, update on public.agents to authenticated;
grant all on public.agents to service_role;
alter table public.agents enable row level security;
create policy "agents readable" on public.agents for select to authenticated using (true);
create policy "editors update agents" on public.agents for update to authenticated using (public.can_edit(auth.uid())) with check (public.can_edit(auth.uid()));
create trigger agents_touch before update on public.agents for each row execute function public.touch_updated_at();

-- REQUESTS
create type public.request_status as enum ('pendente','aprovado','em_andamento','concluido','rejeitado');
create table public.agent_requests (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  title text not null,
  details text not null default '',
  priority text not null default 'media',
  due_date date,
  status public.request_status not null default 'pendente',
  requested_by uuid not null default auth.uid(),
  requester_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.agent_requests to authenticated;
grant all on public.agent_requests to service_role;
alter table public.agent_requests enable row level security;
create policy "requests readable" on public.agent_requests for select to authenticated using (true);
create policy "requests insert own" on public.agent_requests for insert to authenticated with check (requested_by = auth.uid());
create policy "requests update owner or editor" on public.agent_requests for update to authenticated using (requested_by = auth.uid() or public.can_edit(auth.uid()));
create policy "requests delete admin" on public.agent_requests for delete to authenticated using (public.has_role(auth.uid(),'admin'));
create trigger requests_touch before update on public.agent_requests for each row execute function public.touch_updated_at();

-- MIRRORED TRELLO TASKS
create table public.mirrored_tasks (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'trello',
  external_id text not null,
  board_id text,
  list_id text,
  list_name text,
  name text not null,
  description text,
  url text,
  labels jsonb not null default '[]',
  due timestamptz,
  closed boolean not null default false,
  agent_id uuid references public.agents(id) on delete set null,
  last_synced_at timestamptz not null default now(),
  unique (source, external_id)
);
grant select, update on public.mirrored_tasks to authenticated;
grant all on public.mirrored_tasks to service_role;
alter table public.mirrored_tasks enable row level security;
create policy "tasks readable" on public.mirrored_tasks for select to authenticated using (true);
create policy "editors assign tasks" on public.mirrored_tasks for update to authenticated using (public.can_edit(auth.uid()));

create table public.sync_logs (
  id uuid primary key default gen_random_uuid(),
  integration text not null,
  status text not null,
  message text,
  items_count int not null default 0,
  triggered_by uuid,
  created_at timestamptz not null default now()
);
grant select on public.sync_logs to authenticated;
grant all on public.sync_logs to service_role;
alter table public.sync_logs enable row level security;
create policy "sync logs readable" on public.sync_logs for select to authenticated using (true);

-- DOCS
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  kind text not null default 'evidencia',
  url text,
  notes text,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);
create table public.decisions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  context text not null default '',
  decision text not null default '',
  status text not null default 'proposta',
  decided_on date not null default current_date,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);
create table public.changelog_entries (
  id uuid primary key default gen_random_uuid(),
  version text,
  summary text not null,
  entry_date date not null default current_date,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);
create table public.financial_scenarios (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price_per_school numeric not null default 0,
  schools numeric not null default 0,
  churn_pct numeric not null default 0,
  growth_pct numeric not null default 0,
  assumptions text not null default '',
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.cost_items (
  id uuid primary key default gen_random_uuid(),
  category text not null default 'infraestrutura',
  name text not null,
  monthly_cost numeric not null default 0,
  one_time_cost numeric not null default 0,
  assumption text not null default '',
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$ declare t text; begin
  foreach t in array array['documents','decisions','changelog_entries','financial_scenarios','cost_items'] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "read %1$s" on public.%1$I for select to authenticated using (true)', t);
    execute format('create policy "insert %1$s" on public.%1$I for insert to authenticated with check (public.can_edit(auth.uid()) and created_by = auth.uid())', t);
    execute format('create policy "update %1$s" on public.%1$I for update to authenticated using (public.can_edit(auth.uid()))', t);
    execute format('create policy "delete %1$s" on public.%1$I for delete to authenticated using (public.can_edit(auth.uid()))', t);
  end loop;
end $$;
create trigger scen_touch before update on public.financial_scenarios for each row execute function public.touch_updated_at();
create trigger cost_touch before update on public.cost_items for each row execute function public.touch_updated_at();

-- AUDIT
create table public.audit_log (
  id bigint generated always as identity primary key,
  table_name text not null,
  record_id text,
  action text not null,
  actor uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);
grant select on public.audit_log to authenticated;
grant all on public.audit_log to service_role;
alter table public.audit_log enable row level security;
create policy "audit readable by editors" on public.audit_log for select to authenticated using (public.can_edit(auth.uid()));

create or replace function public.audit_trigger() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.audit_log(table_name, record_id, action, actor, old_data, new_data)
  values (tg_table_name, coalesce((to_jsonb(new)->>'id'),(to_jsonb(old)->>'id')), tg_op, auth.uid(),
    case when tg_op <> 'INSERT' then to_jsonb(old) end,
    case when tg_op <> 'DELETE' then to_jsonb(new) end);
  return coalesce(new, old);
end $$;
do $$ declare t text; begin
  foreach t in array array['agents','agent_requests','mirrored_tasks','documents','decisions','changelog_entries','financial_scenarios','cost_items'] loop
    execute format('create trigger audit_%1$s after insert or update or delete on public.%1$I for each row execute function public.audit_trigger()', t);
  end loop;
end $$;

insert into public.agents (slug,name,role_title,description,responsibilities,room,is_coordinator,sort_order) values
('project-manager','Project Manager','Coordenação central','Coordena todos os agentes, prioriza a fila e garante a entrega do Demo Day.','{"Priorizar backlog","Distribuir solicitações","Acompanhar riscos","Aprovar mudanças externas"}','coordenacao',true,1),
('trello-scrum','Trello & Scrum','Cerimônias e quadro','Mantém o quadro Demo Day organizado e conduz as cerimônias da sprint.','{"Organizar listas do Trello","Conduzir dailies","Revisar sprint","Atualizar status dos cards"}','coordenacao',false,2),
('frontend','Front-end','Interface do produto','Desenvolve as telas do Permaneo com foco em acessibilidade.','{"Implementar telas","Responsividade","Acessibilidade","Integração com APIs"}','engenharia',false,3),
('backend','Back-end','APIs e dados','Modela dados e expõe APIs do Permaneo.','{"Modelagem de banco","APIs","Autenticação","Integrações"}','engenharia',false,4),
('devops','DevOps','Infraestrutura e deploy','Cuida de deploy, ambientes e monitoramento.','{"Pipelines de deploy","Ambientes","Monitoramento","Backups"}','engenharia',false,5),
('qa-seguranca','QA & Segurança','Qualidade e proteção','Testa fluxos e revisa segurança e LGPD.','{"Plano de testes","Testes de regressão","Revisão LGPD","Análise de vulnerabilidades"}','engenharia',false,6),
('ui-ux','UI/UX','Design e experiência','Desenha jornadas e protótipos centrados em estudantes e escolas.','{"Pesquisa com usuários","Protótipos","Design system","Testes de usabilidade"}','estudio',false,7),
('marketing','Marketing','Comunicação','Planeja a comunicação e a presença do Permaneo.','{"Posicionamento","Redes sociais","Materiais de divulgação","Landing page"}','estudio',false,8),
('pitch','Pitch & Storytelling','Narrativa do Demo Day','Constrói a narrativa e o roteiro da apresentação.','{"Roteiro do pitch","Slides","Ensaios","Perguntas da banca"}','estudio',false,9),
('documentarista','Documentarista','Dossiê e registros','Mantém o dossiê, decisões e evidências do projeto.','{"Criação do Dossiê","Registro de decisões","Changelog","Evidências"}','biblioteca',false,10),
('pesquisa-dados','Pesquisa & Dados','Evidências e indicadores','Levanta dados sobre evasão escolar e define indicadores.','{"Pesquisa de mercado","Dados do INEP","Indicadores de evasão","Análise de concorrentes"}','biblioteca',false,11),
('educacional','Especialista Educacional','Pedagogia','Garante aderência pedagógica e ao contexto escolar.','{"Validação pedagógica","Contato com escolas","BNCC","Protocolos de acolhimento"}','biblioteca',false,12),
('negocios','Negócios','Modelo de negócio','Define modelo de negócio, canais e parcerias.','{"Modelo de negócio","Concorrentes e valores de mercado","Parcerias","Canvas"}','negocios',false,13),
('financeiro','Financeiro','Custos e cenários','Mantém orçamento, custos e cenários SaaS.','{"Orçamento do Projeto","Custos de infraestrutura","Cenários SaaS","Ponto de equilíbrio"}','negocios',false,14);
create or replace function public.is_team_member(_user_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.user_roles where user_id = _user_id)
$$;
revoke all on function public.is_team_member(uuid) from public;
grant execute on function public.is_team_member(uuid) to authenticated;

-- Every project read must be limited to approved users.
alter policy "agents readable" on public.agents using (public.is_team_member(auth.uid()));
alter policy "requests readable" on public.agent_requests using (public.is_team_member(auth.uid()));
alter policy "tasks readable" on public.mirrored_tasks using (public.is_team_member(auth.uid()));
alter policy "sync logs readable" on public.sync_logs using (public.is_team_member(auth.uid()));
alter policy "requests insert own" on public.agent_requests
  with check (public.can_edit(auth.uid()) and requested_by = auth.uid());
alter policy "requests update owner or editor" on public.agent_requests
  using (public.can_edit(auth.uid())) with check (public.can_edit(auth.uid()));

do $$ declare t text; begin
  foreach t in array array['documents','decisions','changelog_entries','financial_scenarios','cost_items'] loop
    execute format('alter policy "read %1$s" on public.%1$I using (public.is_team_member(auth.uid()))', t);
  end loop;
end $$;

-- Admin-only user list. This exposes email addresses only to approved admins.
create or replace function public.list_team_members()
returns table(user_id uuid, email text, role text, created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'Somente administradores podem consultar integrantes';
  end if;
  return query
    select u.id, u.email::text, coalesce(r.role::text, 'pendente'), u.created_at
    from auth.users u
    left join lateral (
      select ur.role from public.user_roles ur
      where ur.user_id = u.id
      order by case ur.role when 'admin' then 0 when 'editor' then 1 else 2 end
      limit 1
    ) r on true
    order by u.created_at;
end $$;
revoke all on function public.list_team_members() from public;
grant execute on function public.list_team_members() to authenticated;

create or replace function public.set_team_member_role(
  target_user_id uuid,
  desired_role public.app_role
)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'Somente administradores podem aprovar integrantes';
  end if;
  if desired_role not in ('viewer','editor') then
    raise exception 'Administradores não podem ser atribuídos por este painel';
  end if;
  if not exists (select 1 from auth.users where id = target_user_id) then
    raise exception 'Usuário não encontrado';
  end if;
  if public.has_role(target_user_id,'admin') then
    raise exception 'Não é permitido alterar outro administrador por este painel';
  end if;
  perform pg_advisory_xact_lock(719204);
  if not exists (select 1 from public.user_roles where user_id = target_user_id)
     and (select count(*) from public.user_roles) >= 5 then
    raise exception 'Limite de cinco integrantes';
  end if;
  delete from public.user_roles where user_id = target_user_id;
  insert into public.user_roles(user_id,role) values(target_user_id,desired_role);
end $$;
revoke all on function public.set_team_member_role(uuid, public.app_role) from public;
grant execute on function public.set_team_member_role(uuid, public.app_role) to authenticated;

revoke all on function public.has_role(uuid,public.app_role), public.can_edit(uuid) from public, anon;
grant execute on function public.has_role(uuid,public.app_role), public.can_edit(uuid), public.is_team_member(uuid) to authenticated, service_role;
revoke all on function public.audit_trigger(), public.touch_updated_at() from public, anon, authenticated;
revoke all on function public.list_team_members(), public.set_team_member_role(uuid,public.app_role) from anon;
revoke all on function public.has_role(uuid,public.app_role), public.can_edit(uuid), public.is_team_member(uuid),
  public.list_team_members(), public.set_team_member_role(uuid,public.app_role) from public;
-- Execution tables are created and permissioned in 002_agent_engine.sql.
commit;
