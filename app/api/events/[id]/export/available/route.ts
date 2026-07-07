import { NextResponse } from "next/server";
import { csvDownloadResponse, toCsv } from "../../../../../../lib/csv";
import { loadOrganizerEvent } from "../../../../../../lib/organizer";
import { isUuid } from "../../../../../../lib/validation";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const token = new URL(request.url).searchParams.get("token") || "";

  if (!isUuid(id) || !isUuid(token)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const event = await loadOrganizerEvent(id, token);

  if (!event) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  if (event.confirmed_slot_index === null) {
    return NextResponse.json({ error: "Select a slot before exporting availability." }, { status: 400 });
  }

  const slotIndex = event.confirmed_slot_index;
  const available = event.responses
    .map((response) => ({
      response,
      value: response.availability[slotIndex],
    }))
    .filter(({ value }) => value === "yes" || value === "maybe");

  const csv = toCsv(
    ["name", "organization", "email", "status"],
    available.map(({ response, value }) => [
      response.participant_name || "",
      response.organization,
      response.email,
      value === "yes" ? "available" : "maybe",
    ]),
  );

  return csvDownloadResponse(`convene-${event.id}-selected-slot.csv`, csv);
}
