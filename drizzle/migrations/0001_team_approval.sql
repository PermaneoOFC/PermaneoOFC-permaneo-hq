-- Permaneo HQ: membership approval and protected team data.
-- Apply to the same Supabase database used by the live application.
-- Existing roles are preserved; all future registrations need admin approval.
-- IMPORTANT: create/verify the owner's admin account BEFORE exposing signup to the public.

create or replace function public.handle_new_user_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Bootstrap only when the team has never had any roles.
  -- Subsequent signups do not receive access until an admin approves them.
  if not exists (select 1 from public.user_roles) then
    insert into public.user_roles(user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;

create or replace function public.is_team_member(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
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
  with check (public.is_team_member(auth.uid()) and requested_by = auth.uid());
alter policy "requests update owner or editor" on public.agent_requests
  using ((requested_by = auth.uid() and public.is_team_member(auth.uid())) or public.can_edit(auth.uid()));

do $$ declare t text; begin
  foreach t in array array['documents','decisions','changelog_entries','financial_scenarios','cost_items'] loop
    execute format('alter policy "read %1$s" on public.%1$I using (public.is_team_member(auth.uid()))', t);
  end loop;
end $$;

-- Admin-only user list. This exposes email addresses only to approved admins.
create or replace function public.list_team_members()
returns table(user_id uuid, email text, role text, created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
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
returns void language plpgsql security definer set search_path = public as $$
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
  delete from public.user_roles where user_id = target_user_id;
  insert into public.user_roles(user_id,role) values(target_user_id,desired_role);
end $$;
revoke all on function public.set_team_member_role(uuid, public.app_role) from public;
grant execute on function public.set_team_member_role(uuid, public.app_role) to authenticated;
