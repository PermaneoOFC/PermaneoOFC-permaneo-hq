-- Secure Google Drive OAuth (app-created files only)
create table if not exists public.google_oauth_states (
  state text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  code_verifier text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
alter table public.google_oauth_states enable row level security;
revoke all on public.google_oauth_states from anon, authenticated;
grant all on public.google_oauth_states to service_role;

create table if not exists public.google_drive_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  encrypted_tokens text not null,
  scopes text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.google_drive_connections enable row level security;
revoke all on public.google_drive_connections from anon, authenticated;
grant all on public.google_drive_connections to service_role;
