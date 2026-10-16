import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { recordTelemetry, type TelemetryEventType } from "../../../../lib/telemetry";

export const runtime = "nodejs";

type ResendWebhookPayload = {
  type?: unknown;
  created_at?: unknown;
  data?: {
    email_id?: unknown;
    tags?: unknown;
  };
};

const EVENT_MAP: Record<string, TelemetryEventType> = {
  "email.delivered": "email_delivered",
  "email.delivery_delayed": "email_delivery_delayed",
  "email.failed": "email_failed",
  "email.bounced": "email_bounced",
  "email.suppressed": "email_suppressed",
};

function readEmailKind(tags: unknown) {
  if (Array.isArray(tags)) {
    const match = tags.find(
      (tag) => tag && typeof tag === "object" && "name" in tag && tag.name === "kind",
    );
    if (match && "value" in match && typeof match.value === "string") {
      return match.value;
    }
  }

  if (tags && typeof tags === "object" && "kind" in tags && typeof tags.kind === "string") {
    return tags.kind;
  }

  return "unknown";
}

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;

  if (!secret) {
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 500 });
  }

  const body = await request.text();
  let payload: ResendWebhookPayload;

  try {
    new Webhook(secret).verify(body, {
      "svix-id": request.headers.get("svix-id") ?? "",
      "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
      "svix-signature": request.headers.get("svix-signature") ?? "",
    });
    payload = JSON.parse(body) as ResendWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  const sourceType = typeof payload.type === "string" ? payload.type : "";
  const eventType = EVENT_MAP[sourceType];

  if (!eventType) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const emailId = typeof payload.data?.email_id === "string" ? payload.data.email_id : "unknown";
  const occurredAt = typeof payload.created_at === "string" ? payload.created_at : undefined;
  const webhookId = request.headers.get("svix-id") ?? `${sourceType}:${emailId}:${occurredAt ?? ""}`;

  await recordTelemetry(eventType, {
    externalId: `webhook:${webhookId}`,
    metadata: { kind: readEmailKind(payload.data?.tags) },
    occurredAt,
  });

  return NextResponse.json({ ok: true });
}
