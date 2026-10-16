create extension if not exists pgcrypto;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  organizer_token uuid not null default gen_random_uuid(),
  organizer_email text,
  title text not null,
  slots jsonb not null,
  time_zone text,
  confirmed_slot_index integer,
  created_at timestamptz not null default now(),
  constraint events_slots_array check (jsonb_typeof(slots) = 'array'),
  constraint events_confirmed_slot_nonnegative check (
    confirmed_slot_index is null or confirmed_slot_index >= 0
  ),
  constraint events_time_zone_format check (
    time_zone is null or (
      char_length(time_zone) between 1 and 64
      and time_zone ~ '^(UTC|[A-Za-z_+-]+(/[A-Za-z0-9_+.-]+)+)$'
    )
  )
);

alter table public.events
  add column if not exists organizer_email text;

alter table public.events
  add column if not exists time_zone text;

alter table public.events
  drop constraint if exists events_time_zone_format;

alter table public.events
  add constraint events_time_zone_format check (
    time_zone is null or (
      char_length(time_zone) between 1 and 64
      and time_zone ~ '^(UTC|[A-Za-z_+-]+(/[A-Za-z0-9_+.-]+)+)$'
    )
  );

create index if not exists events_organizer_email_idx
  on public.events (lower(organizer_email))
  where organizer_email is not null;

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

create table if not exists public.app_state (
  id boolean primary key default true,
  last_digest_sent_at timestamptz,
  constraint app_state_single_row check (id)
);

create table if not exists public.telemetry_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  poll_id uuid,
  external_id text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  constraint telemetry_events_type_check check (
    event_type in (
      'response_submitted', 'poll_deleted', 'poll_flagged', 'app_error',
      'email_send_succeeded', 'email_send_failed', 'email_delivered',
      'email_delivery_delayed', 'email_failed', 'email_bounced', 'email_suppressed'
    )
  ),
  constraint telemetry_events_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create unique index if not exists telemetry_events_external_id_idx
  on public.telemetry_events (external_id)
  where external_id is not null;

create index if not exists telemetry_events_occurred_at_idx
  on public.telemetry_events (occurred_at desc);

create index if not exists telemetry_events_type_occurred_at_idx
  on public.telemetry_events (event_type, occurred_at desc);

create index if not exists telemetry_events_poll_id_idx
  on public.telemetry_events (poll_id)
  where poll_id is not null;

insert into public.app_state (id)
values (true)
on conflict (id) do nothing;

alter table public.events enable row level security;
alter table public.responses enable row level security;
alter table public.app_state enable row level security;
alter table public.telemetry_events enable row level security;

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
revoke all on table public.app_state from public;
revoke all on table public.app_state from anon, authenticated;
revoke all on table public.telemetry_events from public;
revoke all on table public.telemetry_events from anon, authenticated;

grant usage on schema public to anon, authenticated;
grant select (id, title, slots, time_zone, confirmed_slot_index, created_at),
  insert (title, slots, organizer_email)
  on public.events to anon, authenticated;
grant insert (event_id, participant_name, organization, email, availability),
  update (participant_name, organization, email, availability)
  on public.responses to anon, authenticated;
grant select, insert, update on table public.app_state to service_role;
grant select, insert on table public.telemetry_events to service_role;

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

create or replace function public.create_event(
  p_title text,
  p_slots jsonb,
  p_organizer_email text
)
returns table(id uuid, organizer_token uuid)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  insert into public.events (title, slots, organizer_email)
  values (
    btrim(p_title),
    p_slots,
    nullif(lower(btrim(p_organizer_email)), '')
  )
  returning events.id, events.organizer_token;
end;
$$;

create or replace function public.create_event(
  p_title text,
  p_slots jsonb,
  p_organizer_email text,
  p_time_zone text
)
returns table(id uuid, organizer_token uuid)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  insert into public.events (title, slots, organizer_email, time_zone)
  values (
    btrim(p_title),
    p_slots,
    nullif(lower(btrim(p_organizer_email)), ''),
    nullif(btrim(p_time_zone), '')
  )
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
    'time_zone', e.time_zone,
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

create or replace function public.get_public_event(p_event_id uuid)
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
    'time_zone', e.time_zone,
    'confirmed_slot_index', e.confirmed_slot_index,
    'created_at', e.created_at,
    'response_summary', jsonb_build_object(
      'total_responses', coalesce(response_totals.total_responses, 0),
      'slots', coalesce(slot_totals.slots, '[]'::jsonb)
    )
  )
  into result
  from public.events e
  left join lateral (
    select count(*)::int as total_responses
    from public.responses r
    where r.event_id = e.id
  ) response_totals on true
  left join lateral (
    select jsonb_agg(
      jsonb_build_object(
        'slot_index', slot_index,
        'yes_count', yes_count,
        'if_needed_count', if_needed_count,
        'no_count', no_count,
        'answer_count', yes_count + if_needed_count
      )
      order by slot_index
    ) as slots
    from (
      select
        idx as slot_index,
        count(r.id) filter (where r.availability ->> idx = 'yes')::int as yes_count,
        count(r.id) filter (where r.availability ->> idx = 'maybe')::int as if_needed_count,
        count(r.id) filter (where r.availability ->> idx = 'no')::int as no_count
      from generate_series(0, jsonb_array_length(e.slots) - 1) as slot_indexes(idx)
      left join public.responses r on r.event_id = e.id
      group by idx
    ) per_slot
  ) slot_totals on true
  where e.id = p_event_id;

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
revoke execute on function public.create_event(text, jsonb, text) from public;
revoke execute on function public.create_event(text, jsonb, text, text) from public;
revoke execute on function public.submit_response(uuid, text, text, text, jsonb) from public;
revoke execute on function public.get_event_for_organizer(uuid, uuid) from public;
revoke execute on function public.get_public_event(uuid) from public;
revoke execute on function public.confirm_event_slot(uuid, uuid, integer) from public;
revoke execute on function public.delete_event(uuid, uuid) from public;

grant execute on function public.create_event(text, jsonb) to anon, authenticated;
grant execute on function public.create_event(text, jsonb, text) to anon, authenticated;
grant execute on function public.create_event(text, jsonb, text, text) to anon, authenticated;
grant execute on function public.submit_response(uuid, text, text, text, jsonb) to anon, authenticated;
grant execute on function public.get_event_for_organizer(uuid, uuid) to anon, authenticated;
grant execute on function public.get_public_event(uuid) to anon, authenticated;
grant execute on function public.confirm_event_slot(uuid, uuid, integer) to anon, authenticated;
grant execute on function public.delete_event(uuid, uuid) to anon, authenticated;

create or replace function public.get_admin_weekly_digest(
  p_current_start timestamptz,
  p_current_end timestamptz,
  p_previous_start timestamptz
)
returns jsonb
language sql
security definer
set search_path = public
as $$
  with poll_stats as (
    select
      e.id,
      e.created_at,
      e.confirmed_slot_index,
      count(r.id)::integer as respondent_count
    from public.events e
    left join public.responses r on r.event_id = e.id
    group by e.id
  )
  select jsonb_build_object(
    'current', jsonb_build_object(
      'polls_created', count(*) filter (
        where created_at >= p_current_start and created_at < p_current_end
      ),
      'polls_with_responses', count(*) filter (
        where created_at >= p_current_start and created_at < p_current_end
          and respondent_count > 0
      ),
      'participants_for_new_polls', coalesce(sum(respondent_count) filter (
        where created_at >= p_current_start and created_at < p_current_end
      ), 0),
      'votes_submitted', (
        select count(*) from public.telemetry_events
        where event_type = 'response_submitted'
          and occurred_at >= p_current_start and occurred_at < p_current_end
      )
    ),
    'previous', jsonb_build_object(
      'polls_created', count(*) filter (
        where created_at >= p_previous_start and created_at < p_current_start
      ),
      'polls_with_responses', count(*) filter (
        where created_at >= p_previous_start and created_at < p_current_start
          and respondent_count > 0
      ),
      'participants_for_new_polls', coalesce(sum(respondent_count) filter (
        where created_at >= p_previous_start and created_at < p_current_start
      ), 0),
      'votes_submitted', (
        select count(*) from public.telemetry_events
        where event_type = 'response_submitted'
          and occurred_at >= p_previous_start and occurred_at < p_current_start
      )
    ),
    'operations_current', jsonb_build_object(
      'app_errors', (select count(*) from public.telemetry_events where event_type = 'app_error' and occurred_at >= p_current_start and occurred_at < p_current_end),
      'email_send_failures', (select count(*) from public.telemetry_events where event_type = 'email_send_failed' and occurred_at >= p_current_start and occurred_at < p_current_end),
      'email_delivery_failures', (select count(*) from public.telemetry_events where event_type in ('email_failed', 'email_bounced', 'email_suppressed') and occurred_at >= p_current_start and occurred_at < p_current_end),
      'email_delivery_delays', (select count(*) from public.telemetry_events where event_type = 'email_delivery_delayed' and occurred_at >= p_current_start and occurred_at < p_current_end),
      'polls_flagged', (select count(*) from public.telemetry_events where event_type = 'poll_flagged' and occurred_at >= p_current_start and occurred_at < p_current_end),
      'polls_deleted', (select count(*) from public.telemetry_events where event_type = 'poll_deleted' and occurred_at >= p_current_start and occurred_at < p_current_end)
    ),
    'operations_previous', jsonb_build_object(
      'app_errors', (select count(*) from public.telemetry_events where event_type = 'app_error' and occurred_at >= p_previous_start and occurred_at < p_current_start),
      'email_send_failures', (select count(*) from public.telemetry_events where event_type = 'email_send_failed' and occurred_at >= p_previous_start and occurred_at < p_current_start),
      'email_delivery_failures', (select count(*) from public.telemetry_events where event_type in ('email_failed', 'email_bounced', 'email_suppressed') and occurred_at >= p_previous_start and occurred_at < p_current_start),
      'email_delivery_delays', (select count(*) from public.telemetry_events where event_type = 'email_delivery_delayed' and occurred_at >= p_previous_start and occurred_at < p_current_start),
      'polls_flagged', (select count(*) from public.telemetry_events where event_type = 'poll_flagged' and occurred_at >= p_previous_start and occurred_at < p_current_start),
      'polls_deleted', (select count(*) from public.telemetry_events where event_type = 'poll_deleted' and occurred_at >= p_previous_start and occurred_at < p_current_start)
    ),
    'totals', jsonb_build_object(
      'polls', count(*),
      'respondents', (select count(*) from public.responses),
      'with_selected_slot', count(*) filter (where confirmed_slot_index is not null),
      'without_selected_slot', count(*) filter (where confirmed_slot_index is null),
      'without_responses', count(*) filter (where respondent_count = 0),
      'deleted_since_telemetry', (select count(*) from public.telemetry_events where event_type = 'poll_deleted')
    ),
    'telemetry_started_at', (select min(occurred_at) from public.telemetry_events)
  )
  from poll_stats;
$$;

revoke execute on function public.get_admin_weekly_digest(timestamptz, timestamptz, timestamptz) from public;
grant execute on function public.get_admin_weekly_digest(timestamptz, timestamptz, timestamptz) to service_role;
