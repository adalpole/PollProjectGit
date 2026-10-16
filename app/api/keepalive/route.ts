import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/supabase";
import { recordAppError, recordTelemetry } from "../../../lib/telemetry";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
type SupabaseAdmin = ReturnType<typeof getSupabaseAdmin>;

type PeriodStats = {
  pollsCreated: number;
  pollsWithResponses: number;
  participantsForNewPolls: number;
  votesSubmitted: number;
};

type OperationsStats = {
  appErrors: number;
  emailSendFailures: number;
  emailDeliveryFailures: number;
  emailDeliveryDelays: number;
  pollsFlagged: number;
  pollsDeleted: number;
};

type Digest = {
  current: PeriodStats;
  previous: PeriodStats;
  operationsCurrent: OperationsStats;
  operationsPrevious: OperationsStats;
  totals: {
    polls: number;
    respondents: number;
    withSelectedSlot: number;
    withoutSelectedSlot: number;
    withoutResponses: number;
    deletedSinceTelemetry: number;
  };
  telemetryStartedAt: Date | null;
  currentStart: Date;
  currentEnd: Date;
  previousStart: Date;
};

type EmailRow = { label: string; value: string; change?: string };

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parseDate(value: unknown) {
  if (typeof value !== "string") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function parsePeriod(value: unknown): PeriodStats {
  const row = objectValue(value);
  return {
    pollsCreated: numberValue(row.polls_created),
    pollsWithResponses: numberValue(row.polls_with_responses),
    participantsForNewPolls: numberValue(row.participants_for_new_polls),
    votesSubmitted: numberValue(row.votes_submitted),
  };
}

function parseOperations(value: unknown): OperationsStats {
  const row = objectValue(value);
  return {
    appErrors: numberValue(row.app_errors),
    emailSendFailures: numberValue(row.email_send_failures),
    emailDeliveryFailures: numberValue(row.email_delivery_failures),
    emailDeliveryDelays: numberValue(row.email_delivery_delays),
    pollsFlagged: numberValue(row.polls_flagged),
    pollsDeleted: numberValue(row.polls_deleted),
  };
}

function parseDigestStats(value: unknown) {
  const data = objectValue(value);
  const totals = objectValue(data.totals);
  return {
    current: parsePeriod(data.current),
    previous: parsePeriod(data.previous),
    operationsCurrent: parseOperations(data.operations_current),
    operationsPrevious: parseOperations(data.operations_previous),
    totals: {
      polls: numberValue(totals.polls),
      respondents: numberValue(totals.respondents),
      withSelectedSlot: numberValue(totals.with_selected_slot),
      withoutSelectedSlot: numberValue(totals.without_selected_slot),
      withoutResponses: numberValue(totals.without_responses),
      deletedSinceTelemetry: numberValue(totals.deleted_since_telemetry),
    },
    telemetryStartedAt: parseDate(data.telemetry_started_at),
  };
}

function formatDate(value: Date, includeYear = true) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "long",
    ...(includeYear ? { year: "numeric" } : {}),
    timeZone: "Europe/Rome",
  }).format(value);
}

function formatPeriod(start: Date, end: Date) {
  return `${formatDate(start, false)} - ${formatDate(new Date(end.getTime() - 1), true)}`;
}

function rate(part: number, total: number) {
  return total === 0 ? 0 : (part / total) * 100;
}

function average(part: number, total: number) {
  return total === 0 ? 0 : part / total;
}

function signed(value: number, digits = 0) {
  const formatted = value.toFixed(digits).replace(".", ",");
  return `${value > 0 ? "+" : ""}${formatted}`;
}

function buildDigestEmail(digest: Digest) {
  const currentRate = rate(digest.current.pollsWithResponses, digest.current.pollsCreated);
  const previousRate = rate(digest.previous.pollsWithResponses, digest.previous.pollsCreated);
  const currentAverage = average(digest.current.participantsForNewPolls, digest.current.pollsCreated);
  const previousAverage = average(digest.previous.participantsForNewPolls, digest.previous.pollsCreated);
  const hasBaseline = Boolean(
    digest.telemetryStartedAt && digest.telemetryStartedAt.getTime() <= digest.previousStart.getTime(),
  );
  const telemetryChange = (current: number, previous: number) =>
    hasBaseline ? signed(current - previous) : "baseline in corso";

  const usageRows: EmailRow[] = [
    { label: "Sondaggi creati", value: String(digest.current.pollsCreated), change: signed(digest.current.pollsCreated - digest.previous.pollsCreated) },
    { label: "Voti inviati", value: String(digest.current.votesSubmitted), change: telemetryChange(digest.current.votesSubmitted, digest.previous.votesSubmitted) },
    { label: "Sondaggi con almeno un voto", value: `${currentRate.toFixed(1).replace(".", ",")}%`, change: `${signed(currentRate - previousRate, 1)} pp` },
    { label: "Partecipanti medi per nuovo sondaggio", value: currentAverage.toFixed(1).replace(".", ","), change: signed(currentAverage - previousAverage, 1) },
  ];

  const operationsRows: EmailRow[] = [
    ["Errori applicativi", digest.operationsCurrent.appErrors, digest.operationsPrevious.appErrors],
    ["Email non inviate", digest.operationsCurrent.emailSendFailures, digest.operationsPrevious.emailSendFailures],
    ["Email non consegnate", digest.operationsCurrent.emailDeliveryFailures, digest.operationsPrevious.emailDeliveryFailures],
    ["Email in ritardo", digest.operationsCurrent.emailDeliveryDelays, digest.operationsPrevious.emailDeliveryDelays],
    ["Sondaggi sospetti", digest.operationsCurrent.pollsFlagged, digest.operationsPrevious.pollsFlagged],
    ["Sondaggi eliminati", digest.operationsCurrent.pollsDeleted, digest.operationsPrevious.pollsDeleted],
  ].map(([label, current, previous]) => ({
    label: String(label),
    value: String(current),
    change: telemetryChange(Number(current), Number(previous)),
  }));

  const totalRows: EmailRow[] = [
    { label: "Sondaggi esistenti", value: String(digest.totals.polls) },
    { label: "Rispondenti unici", value: String(digest.totals.respondents) },
    { label: "Con fascia selezionata", value: String(digest.totals.withSelectedSlot) },
    { label: "Senza fascia selezionata", value: String(digest.totals.withoutSelectedSlot) },
    { label: "Senza risposte", value: String(digest.totals.withoutResponses) },
    { label: "Eliminati dalla v5.0", value: String(digest.totals.deletedSinceTelemetry) },
  ];

  const textRows = (rows: EmailRow[]) => rows.map((row) =>
    `${row.label}: ${row.value}${row.change ? ` (${row.change} rispetto alla settimana precedente)` : ""}`,
  );
  const text = [
    "PoliPol - riepilogo settimanale",
    formatPeriod(digest.currentStart, digest.currentEnd),
    "", "SETTIMANA IN SINTESI", ...textRows(usageRows),
    "", "QUALITA E OPERATIVITA", ...textRows(operationsRows),
    "", "PANORAMICA COMPLESSIVA", ...textRows(totalRows),
    "", "I voti inviati e i dati operativi sono disponibili solo dalla v5.0. I rispondenti unici rappresentano invece le risposte attualmente conservate.",
  ].join("\n");

  const table = (rows: EmailRow[]) => `<table style="width:100%;border-collapse:collapse"><tbody>${rows.map((row) => `
    <tr style="border-bottom:1px solid #dce6f2">
      <th style="text-align:left;padding:10px 12px 10px 0;color:#53677f;font-size:14px;font-weight:600">${escapeHtml(row.label)}</th>
      <td style="padding:10px 0;text-align:right;color:#07182f;font-size:16px;font-weight:700">${escapeHtml(row.value)}</td>
      <td style="padding:10px 0 10px 14px;text-align:right;color:#53677f;font-size:12px;white-space:nowrap">${escapeHtml(row.change ?? "")}</td>
    </tr>`).join("")}</tbody></table>`;

  const html = `<div lang="it" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.5;color:#07182f;max-width:680px;margin:0 auto">
    <div style="border-top:5px solid #006cb7;padding-top:20px">
      <p style="margin:0 0 4px;color:#006cb7;font-size:13px;font-weight:700;text-transform:uppercase">PoliPol</p>
      <h1 style="font-size:24px;margin:0 0 4px">Riepilogo settimanale</h1>
      <p style="margin:0 0 24px;color:#53677f">${escapeHtml(formatPeriod(digest.currentStart, digest.currentEnd))}</p>
    </div>
    <h2 style="font-size:17px;margin:24px 0 8px">Settimana in sintesi</h2>${table(usageRows)}
    <h2 style="font-size:17px;margin:28px 0 8px">Qualit&agrave; e operativit&agrave;</h2>${table(operationsRows)}
    <h2 style="font-size:17px;margin:28px 0 8px">Panoramica complessiva</h2>${table(totalRows)}
    <p style="margin:24px 0 0;color:#53677f;font-size:12px">I voti inviati e i dati operativi sono disponibili solo dalla v5.0. I rispondenti unici rappresentano invece le risposte attualmente conservate.</p>
  </div>`;

  return { html, text };
}

async function runKeepaliveQuery(supabase: SupabaseAdmin) {
  const { error } = await supabase.from("events").select("id").limit(1);
  if (error) throw error;
}

async function readLastDigestSentAt(supabase: SupabaseAdmin) {
  const { data, error } = await supabase.from("app_state").select("last_digest_sent_at").eq("id", true).maybeSingle();
  if (error) throw error;
  return parseDate((data as { last_digest_sent_at?: unknown } | null)?.last_digest_sent_at);
}

async function markDigestSent(supabase: SupabaseAdmin, sentAt: Date) {
  const { error } = await supabase.from("app_state").upsert(
    { id: true, last_digest_sent_at: sentAt.toISOString() },
    { onConflict: "id" },
  );
  if (error) throw error;
}

async function buildUsageDigest(supabase: SupabaseAdmin, now: Date): Promise<Digest> {
  const currentEnd = now;
  const currentStart = new Date(now.getTime() - WEEK_MS);
  const previousStart = new Date(now.getTime() - 2 * WEEK_MS);
  const { data, error } = await supabase.rpc("get_admin_weekly_digest", {
    p_current_start: currentStart.toISOString(),
    p_current_end: currentEnd.toISOString(),
    p_previous_start: previousStart.toISOString(),
  });
  if (error) throw error;
  return { ...parseDigestStats(data), currentStart, currentEnd, previousStart };
}

async function sendUsageDigestEmail(digest: Digest) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_EMAIL;
  const from = process.env.RESEND_FROM_EMAIL || "PoliPol <recovery@mail.polipol.it>";
  if (!apiKey) throw new Error("Missing RESEND_API_KEY.");
  if (!to) throw new Error("Missing ADMIN_EMAIL.");

  const email = buildDigestEmail(digest);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      from, to,
      subject: `PoliPol - riepilogo settimanale ${formatPeriod(digest.currentStart, digest.currentEnd)}`,
      html: email.html,
      text: email.text,
      tags: [{ name: "kind", value: "weekly_digest" }],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    await recordTelemetry("email_send_failed", { metadata: { kind: "weekly_digest", status: response.status } });
    throw new Error(`Resend failed with ${response.status}: ${detail}`);
  }

  const result = (await response.json().catch(() => null)) as { id?: unknown } | null;
  const emailId = typeof result?.id === "string" ? result.id : undefined;
  await recordTelemetry("email_send_succeeded", {
    externalId: emailId ? `send:${emailId}` : undefined,
    metadata: { kind: "weekly_digest" },
  });
}

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    await runKeepaliveQuery(supabase);
    const now = new Date();
    const previousDigestAt = await readLastDigestSentAt(supabase);
    let digestSent = false;

    if (!previousDigestAt || now.getTime() - previousDigestAt.getTime() >= WEEK_MS) {
      await sendUsageDigestEmail(await buildUsageDigest(supabase, now));
      await markDigestSent(supabase, now);
      digestSent = true;
    }

    return NextResponse.json({ ok: true, keepalive: true, digest_sent: digestSent });
  } catch (error) {
    console.error("Keepalive job failed", error);
    await recordAppError("/api/keepalive", "weekly_digest");
    return NextResponse.json({ error: "Keepalive job failed." }, { status: 500 });
  }
}
