import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DIGEST_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

type SupabaseAdmin = ReturnType<typeof getSupabaseAdmin>;

type AppStateRow = {
  last_digest_sent_at: string | null;
};

type OpenEventRow = {
  id: string;
  responses?: { id: string }[] | null;
};

type UsageDigest = {
  generatedAt: Date;
  previousDigestAt: Date | null;
  totalPolls: number;
  newPolls: number;
  totalResponses: number;
  newResponses: number;
  openPollsWithoutResponses: number;
  confirmedPolls: number;
  openPolls: number;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDigestDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Rome",
  }).format(value);
}

function parseDate(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isDigestDue(lastDigestSentAt: Date | null, now: Date) {
  if (!lastDigestSentAt) {
    return true;
  }

  return now.getTime() - lastDigestSentAt.getTime() >= DIGEST_INTERVAL_MS;
}

async function runKeepaliveQuery(supabase: SupabaseAdmin) {
  const { error } = await supabase.from("events").select("id").limit(1);

  if (error) {
    throw error;
  }
}

async function readLastDigestSentAt(supabase: SupabaseAdmin) {
  const { data, error } = await supabase
    .from("app_state")
    .select("last_digest_sent_at")
    .eq("id", true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return ((data as AppStateRow | null)?.last_digest_sent_at ?? null);
}

async function markDigestSent(supabase: SupabaseAdmin, sentAt: Date) {
  const { error } = await supabase.from("app_state").upsert(
    {
      id: true,
      last_digest_sent_at: sentAt.toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) {
    throw error;
  }
}

async function countRows(
  supabase: SupabaseAdmin,
  table: "events" | "responses",
  since: Date | null = null,
) {
  let query = supabase.from(table).select("id", { count: "exact", head: true });

  if (since) {
    query = query.gte("created_at", since.toISOString());
  }

  const { count, error } = await query;

  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function countEventsByConfirmation(supabase: SupabaseAdmin, confirmed: boolean) {
  let query = supabase.from("events").select("id", { count: "exact", head: true });

  query = confirmed
    ? query.not("confirmed_slot_index", "is", null)
    : query.is("confirmed_slot_index", null);

  const { count, error } = await query;

  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function countOpenPollsWithoutResponses(supabase: SupabaseAdmin) {
  const { data, error } = await supabase
    .from("events")
    .select("id,responses(id)")
    .is("confirmed_slot_index", null);

  if (error) {
    throw error;
  }

  const openEvents = (data ?? []) as OpenEventRow[];
  return openEvents.filter((event) => (event.responses ?? []).length === 0).length;
}

async function buildUsageDigest(
  supabase: SupabaseAdmin,
  previousDigestAt: Date | null,
  generatedAt: Date,
): Promise<UsageDigest> {
  const [
    totalPolls,
    totalResponses,
    newPolls,
    newResponses,
    openPollsWithoutResponses,
    confirmedPolls,
    openPolls,
  ] = await Promise.all([
    countRows(supabase, "events"),
    countRows(supabase, "responses"),
    countRows(supabase, "events", previousDigestAt),
    countRows(supabase, "responses", previousDigestAt),
    countOpenPollsWithoutResponses(supabase),
    countEventsByConfirmation(supabase, true),
    countEventsByConfirmation(supabase, false),
  ]);

  return {
    generatedAt,
    previousDigestAt,
    totalPolls,
    newPolls,
    totalResponses,
    newResponses,
    openPollsWithoutResponses,
    confirmedPolls,
    openPolls,
  };
}

function buildDigestEmail(digest: UsageDigest) {
  const previousDigestLabel = digest.previousDigestAt
    ? formatDigestDate(digest.previousDigestAt)
    : "first digest";
  const generatedLabel = formatDigestDate(digest.generatedAt);

  const rows = [
    ["Generated", generatedLabel],
    ["Previous digest", previousDigestLabel],
    ["Total polls", String(digest.totalPolls)],
    ["Polls since previous digest", String(digest.newPolls)],
    ["Total responses", String(digest.totalResponses)],
    ["Responses since previous digest", String(digest.newResponses)],
    ["Open polls with zero responses", String(digest.openPollsWithoutResponses)],
    ["Confirmed polls", String(digest.confirmedPolls)],
    ["Still-open polls", String(digest.openPolls)],
  ];

  const text = [
    "PoliPol weekly usage digest",
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
  ].join("\n");

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.5; color: #07182f;">
      <h1 style="font-size: 20px; margin: 0 0 14px;">PoliPol weekly usage digest</h1>
      <table style="border-collapse: collapse; min-width: 280px;">
        <tbody>
          ${rows
            .map(
              ([label, value]) => `
                <tr>
                  <th style="text-align: left; padding: 8px 14px 8px 0; color: #53677f; font-weight: 600;">${escapeHtml(
                    label,
                  )}</th>
                  <td style="padding: 8px 0;">${escapeHtml(value)}</td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  return { html, text };
}

async function sendUsageDigestEmail(digest: UsageDigest) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_EMAIL;
  const from = process.env.RESEND_FROM_EMAIL || "PoliPol <recovery@mail.polipol.it>";

  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY.");
  }

  if (!to) {
    throw new Error("Missing ADMIN_EMAIL.");
  }

  const email = buildDigestEmail(digest);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: "PoliPol weekly usage digest",
      html: email.html,
      text: email.text,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Resend failed with ${response.status}: ${detail}`);
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    await runKeepaliveQuery(supabase);

    const now = new Date();
    const previousDigestAt = parseDate(await readLastDigestSentAt(supabase));
    let digestSent = false;

    if (isDigestDue(previousDigestAt, now)) {
      const digest = await buildUsageDigest(supabase, previousDigestAt, now);
      await sendUsageDigestEmail(digest);
      await markDigestSent(supabase, now);
      digestSent = true;
    }

    return NextResponse.json({
      ok: true,
      keepalive: true,
      digest_sent: digestSent,
    });
  } catch (error) {
    console.error("Keepalive job failed", error);
    return NextResponse.json({ error: "Keepalive job failed." }, { status: 500 });
  }
}
