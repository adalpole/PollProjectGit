import { NextResponse } from "next/server";
import { getSupabase } from "../../../../../lib/supabase";
import {
  isUuid,
  isValidEmail,
  normalizeEmail,
  parseAvailability,
} from "../../../../../lib/validation";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as
    | {
        participant_name?: unknown;
        organization?: unknown;
        email?: unknown;
        availability?: unknown;
      }
    | null;

  if (!isUuid(id)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const participantName =
    typeof body?.participant_name === "string" && body.participant_name.trim()
      ? body.participant_name.trim()
      : null;
  const organization = typeof body?.organization === "string" ? body.organization.trim() : "";
  const email = typeof body?.email === "string" ? normalizeEmail(body.email) : "";

  if (!organization) {
    return NextResponse.json({ error: "Organization is required." }, { status: 400 });
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("slots")
    .eq("id", id)
    .maybeSingle();

  if (eventError) {
    return NextResponse.json({ error: eventError.message }, { status: 500 });
  }

  if (!event) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const slotCount = Array.isArray(event.slots) ? event.slots.length : 0;
  const availability = parseAvailability(body?.availability, slotCount);

  if (!availability) {
    return NextResponse.json({ error: "Availability must match the event slots." }, { status: 400 });
  }

  const { error } = await supabase.rpc("submit_response", {
    p_event_id: id,
    p_participant_name: participantName,
    p_organization: organization,
    p_email: email,
    p_availability: availability,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
