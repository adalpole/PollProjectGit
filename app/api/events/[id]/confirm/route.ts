import { NextResponse } from "next/server";
import { getSupabase } from "../../../../../lib/supabase";
import { isUuid } from "../../../../../lib/validation";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as
    | { token?: unknown; slot_index?: unknown }
    | null;
  const token = typeof body?.token === "string" ? body.token : "";
  const slotIndex = typeof body?.slot_index === "number" ? body.slot_index : -1;

  if (!isUuid(id) || !isUuid(token)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  if (!Number.isInteger(slotIndex) || slotIndex < 0) {
    return NextResponse.json({ error: "Choose a valid slot." }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("confirm_event_slot", {
    p_event_id: id,
    p_token: token,
    p_slot_index: slotIndex,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (data !== true) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
