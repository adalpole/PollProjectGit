import type { Slot } from "./types";

type CalendarEventInput = {
  id: string;
  title: string;
  slot: Slot;
  publicUrl: string;
  language?: "en" | "it";
};

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function foldIcsLine(line: string) {
  const chunks: string[] = [];
  let remaining = line;

  while (remaining.length > 73) {
    chunks.push(remaining.slice(0, 73));
    remaining = ` ${remaining.slice(73)}`;
  }

  chunks.push(remaining);
  return chunks.join("\r\n");
}

function toIcsUtcDateTime(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function toIcsLocalDateTime(date: string, time: string) {
  return `${date.replace(/-/g, "")}T${time.replace(":", "")}00`;
}

export function buildCalendarFile({ id, title, slot, publicUrl, language = "en" }: CalendarEventInput) {
  const description = [
    language === "it" ? "Fascia confermata da PoliPol." : "Confirmed slot from PoliPol.",
    "",
    `${language === "it" ? "Link partecipanti" : "Participant link"}: ${publicUrl}`,
  ].join("\n");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PoliPol//Scheduling Poll//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escapeIcsText(`${id}-${slot.date}-${slot.start}@polipol.it`)}`,
    `DTSTAMP:${toIcsUtcDateTime(new Date())}`,
    `DTSTART:${toIcsLocalDateTime(slot.date, slot.start)}`,
    `DTEND:${toIcsLocalDateTime(slot.date, slot.end)}`,
    `SUMMARY:${escapeIcsText(title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `URL:${escapeIcsText(publicUrl)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.map(foldIcsLine).join("\r\n") + "\r\n";
}

export function icsDownloadResponse(filename: string, calendar: string) {
  return new Response(calendar, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
