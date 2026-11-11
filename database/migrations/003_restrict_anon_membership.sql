-- Fix explicit anon EXECUTE grant discovered by Supabase Security Advisor after 001 + 002.
-- Authenticated members still need to call this helper for RLS policies.
begin;
revoke execute on function public.is_team_member(uuid) from anon;
revoke execute on function public.is_team_member(uuid) from public;
grant execute on function public.is_team_member(uuid) to authenticated, service_role;
commit;
