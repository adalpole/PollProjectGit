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

grant select (time_zone) on public.events to anon, authenticated;

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

revoke execute on function public.create_event(text, jsonb, text, text) from public;
grant execute on function public.create_event(text, jsonb, text, text) to anon, authenticated;
