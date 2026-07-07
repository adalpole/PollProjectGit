import { getSupabase } from "./supabase";
import type { OrganizerEvent } from "./types";

export async function loadOrganizerEvent(id: string, token: string): Promise<OrganizerEvent | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("get_event_for_organizer", {
    p_event_id: id,
    p_token: token,
  });

  if (error) {
    throw error;
  }

  return (data as OrganizerEvent | null) ?? null;
}
