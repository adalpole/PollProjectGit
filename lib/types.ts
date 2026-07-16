export type AvailabilityStatus = "yes" | "maybe" | "no";

export type Slot = {
  date: string;
  start: string;
  end: string;
};

export type PublicEvent = {
  id: string;
  title: string;
  slots: Slot[];
  confirmed_slot_index: number | null;
  created_at?: string;
  response_summary?: PublicResponseSummary;
};

export type PublicSlotPreference = {
  slot_index: number;
  yes_count: number;
  if_needed_count: number;
  no_count: number;
  answer_count: number;
};

export type PublicResponseSummary = {
  total_responses: number;
  slots: PublicSlotPreference[];
};

export type ResponseRow = {
  id?: string;
  participant_name: string | null;
  organization: string;
  email: string;
  availability: AvailabilityStatus[];
  created_at?: string;
};

export type OrganizerEvent = PublicEvent & {
  responses: ResponseRow[];
};
