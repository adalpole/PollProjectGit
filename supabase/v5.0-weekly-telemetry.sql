create table if not exists public.telemetry_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  poll_id uuid,
  external_id text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  constraint telemetry_events_type_check check (
    event_type in (
      'response_submitted',
      'poll_deleted',
      'poll_flagged',
      'app_error',
      'email_send_succeeded',
      'email_send_failed',
      'email_delivered',
      'email_delivery_delayed',
      'email_failed',
      'email_bounced',
      'email_suppressed'
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

alter table public.telemetry_events enable row level security;

revoke all on table public.telemetry_events from public;
revoke all on table public.telemetry_events from anon, authenticated;
grant select, insert on table public.telemetry_events to service_role;

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
