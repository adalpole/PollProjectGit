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

revoke execute on function public.get_public_event(uuid) from public;
grant execute on function public.get_public_event(uuid) to anon, authenticated;
