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
