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

  const csv = toCsv(
    ["name", "organization", "email"],
    event.responses.map((response) => [
      response.participant_name || "",
      response.organization,
      response.email,
    ]),
  );

  return csvDownloadResponse(`convene-${event.id}-all-respondents.csv`, csv);
}
