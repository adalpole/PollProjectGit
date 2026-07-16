import { NextResponse } from "next/server";
import { loadPublicEvent } from "../../../../lib/public-event";
import { getSupabase } from "../../../../lib/supabase";
import { isUuid } from "../../../../lib/validation";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  if (!isUuid(id)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  let data: Awaited<ReturnType<typeof loadPublicEvent>>;

  try {
    data = await loadPublicEvent(id);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: "Could not load event." }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as { token?: unknown } | null;
  const token = typeof body?.token === "string" ? body.token : "";

  if (!isUuid(id) || !isUuid(token)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("delete_event", {
    p_event_id: id,
    p_token: token,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (data !== true) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
