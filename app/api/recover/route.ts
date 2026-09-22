import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/supabase";
import { isValidEmail, normalizeEmail } from "../../../lib/validation";

export const runtime = "nodejs";

const RECOVERY_LIMIT = 3;
const RECOVERY_WINDOW_MS = 60 * 60 * 1000;

type RecoveryEvent = {
  id: string;
  title: string;
  organizer_token: string;
  created_at: string;
};

type LimitEntry = {
  count: number;
  resetAt: number;
};

type RecoveryLanguage = "en" | "it";

const recoveryAttempts = new Map<string, LimitEntry>();

function checkRateLimit(email: string) {
  const now = Date.now();
  const current = recoveryAttempts.get(email);

  if (!current || current.resetAt <= now) {
    recoveryAttempts.set(email, { count: 1, resetAt: now + RECOVERY_WINDOW_MS });
    return true;
  }

  if (current.count >= RECOVERY_LIMIT) {
    return false;
  }

  current.count += 1;
  return true;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildOrganizerUrl(origin: string, event: RecoveryEvent) {
  return `${origin.replace(/\/$/, "")}/e/${event.id}/${event.organizer_token}`;
}

function buildRecoveryEmail(origin: string, events: RecoveryEvent[], language: RecoveryLanguage) {
  const links = events.map((event) => {
    const url = buildOrganizerUrl(origin, event);
    return {
      title: event.title,
      url,
    };
  });

  const copy = language === "it"
    ? {
        heading: "Recupero dei link organizzatore PoliPol",
        intro: "Di seguito trovi i link privati dell'organizzatore associati al tuo indirizzo email.",
        ignore: "Se non hai richiesto questa email, puoi ignorarla.",
      }
    : {
        heading: "Your PoliPol organizer links",
        intro: "Here are the private organizer links tied to this email address.",
        ignore: "If you did not request this email, you can ignore it.",
      };

  const text = [
    `${copy.heading}:`,
    "",
    ...links.map((link) => `${link.title}: ${link.url}`),
    "",
    copy.ignore,
  ].join("\n");

  const html = `
    <div lang="${language}" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.5; color: #07182f;">
      <h1 style="font-size: 20px; margin: 0 0 14px;">${copy.heading}</h1>
      <p style="margin: 0 0 16px;">${copy.intro}</p>
      <ul style="padding-left: 20px; margin: 0 0 16px;">
        ${links
          .map(
            (link) => `
              <li style="margin-bottom: 10px;">
                <strong>${escapeHtml(link.title)}</strong><br />
                <a href="${escapeHtml(link.url)}">${escapeHtml(link.url)}</a>
              </li>
            `,
          )
          .join("")}
      </ul>
      <p style="margin: 0; color: #53677f; font-size: 13px;">${copy.ignore}</p>
    </div>
  `;

  return { html, text };
}

async function sendRecoveryEmail(to: string, origin: string, events: RecoveryEvent[], language: RecoveryLanguage) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "PoliPol <recovery@mail.polipol.it>";

  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY.");
  }

  const email = buildRecoveryEmail(origin, events, language);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: language === "it"
        ? "Recupero link organizzatore PoliPol"
        : "Your PoliPol organizer links",
      html: email.html,
      text: email.text,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Resend failed with ${response.status}: ${detail}`);
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: unknown; language?: unknown } | null;
  const email = typeof body?.email === "string" ? normalizeEmail(body.email) : "";
  const language = resolveRecoveryLanguage(body?.language, request.headers.get("accept-language"));
  const genericMessage = language === "it"
    ? "Se questo indirizzo è associato a uno o più sondaggi, riceverai a breve un'email con i relativi link."
    : "If we found any polls tied to that email, we've sent the links.";

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Recovery email is not configured." }, { status: 500 });
  }

  const allowed = checkRateLimit(email);

  if (allowed) {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from("events")
        .select("id,title,organizer_token,created_at")
        .eq("organizer_email", email)
        .order("created_at", { ascending: false })
        .limit(25);

      if (error) {
        throw error;
      }

      const events = (data || []) as RecoveryEvent[];
      if (events.length > 0) {
        const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
        await sendRecoveryEmail(email, origin, events, language);
      }
    } catch (error) {
      console.error("Recovery email failed", error);
    }
  }

  return NextResponse.json({ message: genericMessage });
}

function resolveRecoveryLanguage(value: unknown, acceptLanguage: string | null): RecoveryLanguage {
  if (value === "en" || value === "it") {
    return value;
  }

  if (acceptLanguage?.toLowerCase().startsWith("en")) {
    return "en";
  }

  return "it";
}
