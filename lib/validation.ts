import type { AvailabilityStatus, Slot } from "./types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidEmail(email: string) {
  return EMAIL_RE.test(email.trim());
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isUuid(value: string) {
  return UUID_RE.test(value);
}

export function parseSlots(input: unknown): Slot[] | null {
  if (!Array.isArray(input) || input.length === 0 || input.length > 40) {
    return null;
  }

  const slots: Slot[] = [];

  for (const raw of input) {
    if (!raw || typeof raw !== "object") return null;

    const item = raw as Record<string, unknown>;
    const date = typeof item.date === "string" ? item.date : "";
    const start = typeof item.start === "string" ? item.start : "";
    const end = typeof item.end === "string" ? item.end : "";

    if (!DATE_RE.test(date) || !TIME_RE.test(start) || !TIME_RE.test(end)) {
      return null;
    }

    if (start >= end) {
      return null;
    }

    slots.push({ date, start, end });
  }

  return slots;
}

export function parseAvailability(input: unknown, expectedLength: number): AvailabilityStatus[] | null {
  if (!Array.isArray(input) || input.length !== expectedLength) {
    return null;
  }

  const allowed = new Set(["yes", "maybe", "no"]);
  const values: AvailabilityStatus[] = [];

  for (const value of input) {
    if (typeof value !== "string" || !allowed.has(value)) {
      return null;
    }
    values.push(value as AvailabilityStatus);
  }

  return values;
}
