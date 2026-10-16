import { getSupabaseAdmin } from "./supabase";

export const TELEMETRY_EVENT_TYPES = [
  "response_submitted",
  "poll_deleted",
  "poll_flagged",
  "app_error",
  "email_send_succeeded",
  "email_send_failed",
  "email_delivered",
  "email_delivery_delayed",
  "email_failed",
  "email_bounced",
  "email_suppressed",
] as const;

export type TelemetryEventType = (typeof TELEMETRY_EVENT_TYPES)[number];
type MetadataValue = string | number | boolean | null;

type TelemetryInput = {
  pollId?: string;
  externalId?: string;
  metadata?: Record<string, MetadataValue>;
  occurredAt?: string;
};

export async function recordTelemetry(eventType: TelemetryEventType, input: TelemetryInput = {}) {
  try {
    const { error } = await getSupabaseAdmin().from("telemetry_events").upsert(
      {
        event_type: eventType,
        poll_id: input.pollId ?? null,
        external_id: input.externalId ?? null,
        metadata: input.metadata ?? {},
        occurred_at: input.occurredAt ?? new Date().toISOString(),
      },
      input.externalId ? { onConflict: "external_id", ignoreDuplicates: true } : undefined,
    );

    if (error) {
      console.error("Could not record telemetry", eventType, error.message);
    }
  } catch (error) {
    console.error("Could not record telemetry", eventType, error);
  }
}

export function recordAppError(route: string, operation: string, pollId?: string) {
  return recordTelemetry("app_error", {
    pollId,
    metadata: { route, operation },
  });
}

export function suspiciousPollReasons(title: string) {
  const reasons: string[] = [];

  if (/https?:\/\/|www\./i.test(title)) {
    reasons.push("title_contains_url");
  }

  if (/(.)\1{9,}/i.test(title)) {
    reasons.push("repeated_characters");
  }

  if (title.length > 160) {
    reasons.push("very_long_title");
  }

  return reasons;
}
