import type { Slot } from "./types";

const MAX_TIME_ZONE_LENGTH = 64;

export function normalizeTimeZone(value: unknown) {
  if (typeof value !== "string") return null;

  const candidate = value.trim();
  if (!candidate || candidate.length > MAX_TIME_ZONE_LENGTH) return null;

  try {
    return new Intl.DateTimeFormat("en", { timeZone: candidate }).resolvedOptions().timeZone;
  } catch {
    return null;
  }
}

export function detectTimeZone() {
  return normalizeTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
}

export function supportedTimeZones() {
  const intl = Intl as typeof Intl & {
    supportedValuesOf?: (key: "timeZone") => string[];
  };
  const values = intl.supportedValuesOf?.("timeZone") ?? [];
  return Array.from(new Set(["UTC", ...values]));
}

export function summarizeTimeZoneOffsets(timeZone: string, slots: Pick<Slot, "date">[]) {
  const normalized = normalizeTimeZone(timeZone);
  if (!normalized) return "";

  const dates = Array.from(new Set(slots.map((slot) => slot.date).filter(Boolean)));
  if (dates.length === 0) dates.push(dateInTimeZone(normalized));

  const offsets = Array.from(new Set(dates.map((date) => utcOffsetMinutes(normalized, date))))
    .sort((left, right) => left - right);

  return offsets.map(formatUtcOffset).join(" / ");
}

function dateInTimeZone(timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function utcOffsetMinutes(timeZone: string, date: string) {
  const reference = new Date(`${date}T12:00:00Z`);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(reference);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const representedAsUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  );
  return Math.round((representedAsUtc - reference.getTime()) / 60_000);
}

function formatUtcOffset(minutes: number) {
  if (minutes === 0) return "UTC";

  const sign = minutes < 0 ? "-" : "+";
  const absolute = Math.abs(minutes);
  const hours = Math.floor(absolute / 60);
  const remainingMinutes = absolute % 60;
  return `UTC${sign}${hours}${remainingMinutes ? `:${String(remainingMinutes).padStart(2, "0")}` : ""}`;
}
