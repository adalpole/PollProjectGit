create extension if not exists pgcrypto;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  organizer_token uuid not null default gen_random_uuid(),
  title text not null,
  slots jsonb not null,
  confirmed_slot_index integer,
  created_at timestamptz not null default now(),
  constraint events_slots_array check (jsonb_typeof(slots) = 'array'),
  constraint events_confirmed_slot_nonnegative check (
    confirmed_slot_index is null or confirmed_slot_index >= 0
  )
);

create table if not exists public.responses (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  participant_name text,
  organization text not null,
  email text not null,
  availability jsonb not null,
  created_at timestamptz not null default now(),
  unique (event_id, email),
  constraint responses_availability_array check (jsonb_typeof(availability) = 'array')
);

alter table public.events enable row level security;
alter table public.responses enable row level security;

drop policy if exists "events_public_select" on public.events;
drop policy if exists "events_public_insert" on public.events;
drop policy if exists "responses_public_insert" on public.responses;
drop policy if exists "responses_public_update" on public.responses;

create policy "events_public_select"
on public.events
for select
to anon, authenticated
using (true);

create policy "events_public_insert"
on public.events
for insert
to anon, authenticated
with check (true);

create policy "responses_public_insert"
on public.responses
for insert
to anon, authenticated
with check (true);

create policy "responses_public_update"
on public.responses
for update
to anon, authenticated
using (true)
with check (true);

revoke all on public.events from anon, authenticated;
revoke all on public.responses from anon, authenticated;

grant usage on schema public to anon, authenticated;
grant select (id, title, slots, confirmed_slot_index, created_at), insert (title, slots)
  on public.events to anon, authenticated;
grant insert (event_id, participant_name, organization, email, availability),
  update (participant_name, organization, email, availability)
  on public.responses to anon, authenticated;

create or replace function public.create_event(p_title text, p_slots jsonb)
returns table(id uuid, organizer_token uuid)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  insert into public.events (title, slots)
  values (btrim(p_title), p_slots)
  returning events.id, events.organizer_token;
end;
$$;

create or replace function public.submit_response(
  p_event_id uuid,
  p_participant_name text,
  p_organization text,
  p_email text,
  p_availability jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.responses (
    event_id,
    participant_name,
    organization,
    email,
    availability
  )
  values (
    p_event_id,
    nullif(btrim(p_participant_name), ''),
    btrim(p_organization),
    lower(btrim(p_email)),
    p_availability
  )
  on conflict (event_id, email)
  do update set
    participant_name = excluded.participant_name,
    organization = excluded.organization,
    availability = excluded.availability,
    created_at = now();
end;
$$;

create or replace function public.get_event_for_organizer(p_event_id uuid, p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'id', e.id,
    'title', e.title,
    'slots', e.slots,
    'confirmed_slot_index', e.confirmed_slot_index,
    'created_at', e.created_at,
    'responses', coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', r.id,
          'participant_name', r.participant_name,
          'organization', r.organization,
          'email', r.email,
          'availability', r.availability,
          'created_at', r.created_at
        )
        order by r.created_at
      ) filter (where r.id is not null),
      '[]'::jsonb
    )
  )
  into result
  from public.events e
  left join public.responses r on r.event_id = e.id
  where e.id = p_event_id
    and e.organizer_token = p_token
  group by e.id;

  return result;
end;
$$;

create or replace function public.confirm_event_slot(
  p_event_id uuid,
  p_token uuid,
  p_slot_index integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  slot_count integer;
begin
  select jsonb_array_length(slots)
  into slot_count
  from public.events
  where id = p_event_id
    and organizer_token = p_token;

  if slot_count is null then
    return false;
  end if;

  if p_slot_index < 0 or p_slot_index >= slot_count then
    raise exception 'invalid slot index';
  end if;

  update public.events
  set confirmed_slot_index = p_slot_index
  where id = p_event_id
    and organizer_token = p_token;

  return true;
end;
$$;

create or replace function public.delete_event(p_event_id uuid, p_token uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from public.events
  where id = p_event_id
    and organizer_token = p_token;

  get diagnostics deleted_count = row_count;
  return deleted_count = 1;
end;
$$;

revoke execute on function public.create_event(text, jsonb) from public;
revoke execute on function public.submit_response(uuid, text, text, text, jsonb) from public;
revoke execute on function public.get_event_for_organizer(uuid, uuid) from public;
revoke execute on function public.confirm_event_slot(uuid, uuid, integer) from public;
revoke execute on function public.delete_event(uuid, uuid) from public;

grant execute on function public.create_event(text, jsonb) to anon, authenticated;
grant execute on function public.submit_response(uuid, text, text, text, jsonb) to anon, authenticated;
grant execute on function public.get_event_for_organizer(uuid, uuid) to anon, authenticated;
grant execute on function public.confirm_event_slot(uuid, uuid, integer) to anon, authenticated;
grant execute on function public.delete_event(uuid, uuid) to anon, authenticated;
