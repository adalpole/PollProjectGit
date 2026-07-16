import type { PublicEvent, PublicResponseSummary, Slot } from "./types";

export function createEmptyResponseSummary(slots: Slot[]): PublicResponseSummary {
  return {
    total_responses: 0,
    slots: slots.map((_, index) => ({
      slot_index: index,
      yes_count: 0,
      if_needed_count: 0,
      no_count: 0,
      answer_count: 0,
    })),
  };
}

export function normalizePublicEvent(event: PublicEvent): PublicEvent {
  return {
    ...event,
    response_summary: event.response_summary ?? createEmptyResponseSummary(event.slots),
  };
}
