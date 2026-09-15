import { NextResponse } from "next/server";
import { csvDownloadResponse, toCsv } from "../../../../../../lib/csv";
import { buildCalendarFile, icsDownloadResponse } from "../../../../../../lib/ics";
import { loadOrganizerEvent } from "../../../../../../lib/organizer";
import { isUuid } from "../../../../../../lib/validation";
import { toXlsx, xlsxDownloadResponse } from "../../../../../../lib/xlsx";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const searchParams = new URL(request.url).searchParams;
  const token = searchParams.get("token") || "";
  const rawFormat = searchParams.get("format");
  const format = rawFormat === "xlsx" || rawFormat === "ics" ? rawFormat : "csv";

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
  const selectedSlot = event.slots[slotIndex];

  if (!selectedSlot) {
    return NextResponse.json({ error: "Selected slot is not valid." }, { status: 400 });
  }

  if (format === "ics") {
    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const publicUrl = `${origin.replace(/\/$/, "")}/e/${event.id}`;
    const calendar = buildCalendarFile({
      id: event.id,
      title: event.title,
      slot: selectedSlot,
      publicUrl,
    });

    return icsDownloadResponse(`polipol-${event.id}-calendar.ics`, calendar);
  }

  const available = event.responses
    .map((response) => ({
      response,
      value: response.availability[slotIndex],
    }))
    .filter(({ value }) => value === "yes" || value === "maybe");

  const headers = ["name", "organization", "email", "status"];
  const rows = available.map(({ response, value }) => [
    response.participant_name || "",
    response.organization,
    response.email,
    value === "yes" ? "available" : "if needed",
  ]);

  if (format === "xlsx") {
    const workbook = await toXlsx(headers, rows, "Selected slot");
    return xlsxDownloadResponse(`polipol-${event.id}-selected-slot.xlsx`, workbook);
  }

  const csv = toCsv(headers, rows);
  return csvDownloadResponse(`polipol-${event.id}-selected-slot.csv`, csv);
}
