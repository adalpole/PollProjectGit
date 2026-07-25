create table if not exists public.app_state (
  id boolean primary key default true,
  last_digest_sent_at timestamptz,
  constraint app_state_single_row check (id)
);

insert into public.app_state (id)
values (true)
on conflict (id) do nothing;

alter table public.app_state enable row level security;

revoke all on table public.app_state from public;
revoke all on table public.app_state from anon, authenticated;

grant select, insert, update on table public.app_state to service_role;
