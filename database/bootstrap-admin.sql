-- MANUAL DBA operation on the NEW project, after migrations and a verified signup.
-- Not an application endpoint or migration. Do not run unchanged.
-- Replace BOTH values after independently verifying the owner in Supabase Auth.
begin;
do $$
declare
  verified_user_id uuid := 'REPLACE_WITH_VERIFIED_AUTH_USER_UUID';
  verified_email text := 'REPLACE_WITH_VERIFIED_EMAIL';
begin
  perform pg_advisory_xact_lock(719204);
  if exists(select 1 from public.user_roles) then
    raise exception 'Bootstrap is only allowed for an empty team';
  end if;
  if not exists(select 1 from auth.users where id=verified_user_id and email=verified_email and email_confirmed_at is not null) then
    raise exception 'Verified owner not found';
  end if;
  insert into public.user_roles(user_id,role) values(verified_user_id,'admin');
end $$;
commit;
