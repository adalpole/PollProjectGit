import { NextResponse } from "next/server";
import { csvDownloadResponse, toCsv } from "../../../../../../lib/csv";
import { eventDownloadName } from "../../../../../../lib/download-filename";
import { loadOrganizerEvent } from "../../../../../../lib/organizer";
import { isUuid } from "../../../../../../lib/validation";
import { toXlsx, xlsxDownloadResponse } from "../../../../../../lib/xlsx";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const searchParams = new URL(request.url).searchParams;
  const token = searchParams.get("token") || "";
  const language = searchParams.get("lang") === "it" ? "it" : "en";
  const format = searchParams.get("format") === "xlsx" ? "xlsx" : "csv";

  if (!isUuid(id) || !isUuid(token)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const event = await loadOrganizerEvent(id, token);

  if (!event) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const headers = language === "it"
    ? ["nome", "organizzazione", "email"]
    : ["name", "organization", "email"];
  const rows = event.responses.map((response) => [
    response.participant_name || "",
    response.organization,
    response.email,
  ]);
  const selectedSlot = event.confirmed_slot_index === null
    ? undefined
    : event.slots[event.confirmed_slot_index];
  const filename = eventDownloadName(event.title, selectedSlot);

  if (format === "xlsx") {
    const workbook = await toXlsx(headers, rows, language === "it" ? "Tutti i rispondenti" : "All respondents");
    return xlsxDownloadResponse(`${filename}-all-respondents.xlsx`, workbook);
  }

  const csv = toCsv(headers, rows);
  return csvDownloadResponse(`${filename}-all-respondents.csv`, csv);
}
