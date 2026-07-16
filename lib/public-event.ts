import { getSupabase } from "./supabase";
import { normalizePublicEvent } from "./response-summary";
import type { PublicEvent } from "./types";

type SupabaseErrorLike = {
  code?: string;
  message?: string;
};

function isMissingPublicEventFunction(error: SupabaseErrorLike) {
  return error.code === "PGRST202" || error.message?.includes("get_public_event");
}

export async function loadPublicEvent(id: string): Promise<PublicEvent | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("get_public_event", {
    p_event_id: id,
  });

  if (!error) {
    return data ? normalizePublicEvent(data as PublicEvent) : null;
  }

  if (!isMissingPublicEventFunction(error)) {
    throw error;
  }

  const { data: fallbackData, error: fallbackError } = await supabase
    .from("events")
    .select("id,title,slots,confirmed_slot_index,created_at")
    .eq("id", id)
    .maybeSingle();

  if (fallbackError) {
    throw fallbackError;
  }

  return fallbackData ? normalizePublicEvent(fallbackData as PublicEvent) : null;
}
