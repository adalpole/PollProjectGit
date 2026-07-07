import { notFound } from "next/navigation";
import { getSupabase } from "../../../lib/supabase";
import type { PublicEvent } from "../../../lib/types";
import { isUuid } from "../../../lib/validation";
import ParticipantForm from "./participant-form";

export const dynamic = "force-dynamic";

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!isUuid(id)) {
    notFound();
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("events")
    .select("id,title,slots,confirmed_slot_index,created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    notFound();
  }

  return <ParticipantForm event={data as PublicEvent} />;
}
