import { NextResponse } from "next/server";
import { getSupabase } from "../../../lib/supabase";
import { parseSlots } from "../../../lib/validation";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { title?: unknown; slots?: unknown }
    | null;
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const slots = parseSlots(body?.slots);

  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  if (!slots) {
    return NextResponse.json({ error: "Add at least one valid slot." }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("create_event", {
    p_title: title,
    p_slots: slots,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const created = Array.isArray(data) ? data[0] : data;

  return NextResponse.json({
    id: created.id,
    organizer_token: created.organizer_token,
  });
}
