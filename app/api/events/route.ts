import { NextResponse } from "next/server";
import { getSupabase } from "../../../lib/supabase";
import { recordAppError, recordTelemetry, suspiciousPollReasons } from "../../../lib/telemetry";
import { isValidEmail, normalizeEmail, parseSlots } from "../../../lib/validation";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { title?: unknown; slots?: unknown; organizer_email?: unknown }
    | null;
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const slots = parseSlots(body?.slots);
  const organizerEmail =
    typeof body?.organizer_email === "string" && body.organizer_email.trim()
      ? normalizeEmail(body.organizer_email)
      : null;

  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  if (!slots) {
    return NextResponse.json({ error: "Add at least one valid slot." }, { status: 400 });
  }

  if (organizerEmail && !isValidEmail(organizerEmail)) {
    return NextResponse.json({ error: "Enter a valid organizer email." }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("create_event", {
    p_title: title,
    p_slots: slots,
    p_organizer_email: organizerEmail,
  });

  if (error) {
    await recordAppError("/api/events", "create_poll");
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const created = Array.isArray(data) ? data[0] : data;
  const suspiciousReasons = suspiciousPollReasons(title);

  if (suspiciousReasons.length > 0) {
    await recordTelemetry("poll_flagged", {
      pollId: created.id,
      metadata: { reasons: suspiciousReasons.join(",") },
    });
  }

  return NextResponse.json({
    id: created.id,
    organizer_token: created.organizer_token,
  });
}
