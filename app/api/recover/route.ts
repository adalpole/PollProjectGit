import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/supabase";
import { isValidEmail, normalizeEmail } from "../../../lib/validation";

export const runtime = "nodejs";

const GENERIC_MESSAGE = "If we found any polls tied to that email, we've sent the links.";
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

function buildRecoveryEmail(origin: string, events: RecoveryEvent[]) {
  const links = events.map((event) => {
    const url = buildOrganizerUrl(origin, event);
    return {
      title: event.title,
      url,
    };
  });

  const text = [
    "Your Convene organizer links:",
    "",
    ...links.map((link) => `${link.title}: ${link.url}`),
    "",
    "If you did not request this email, you can ignore it.",
  ].join("\n");

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.5; color: #07182f;">
      <h1 style="font-size: 20px; margin: 0 0 14px;">Your Convene organizer links</h1>
      <p style="margin: 0 0 16px;">Here are the private organizer links tied to this email address.</p>
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
      <p style="margin: 0; color: #53677f; font-size: 13px;">If you did not request this email, you can ignore it.</p>
    </div>
  `;

  return { html, text };
}

async function sendRecoveryEmail(to: string, origin: string, events: RecoveryEvent[]) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "Convene <onboarding@resend.dev>";

  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY.");
  }

  const email = buildRecoveryEmail(origin, events);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: "Your Convene organizer links",
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
  const body = (await request.json().catch(() => null)) as { email?: unknown } | null;
  const email = typeof body?.email === "string" ? normalizeEmail(body.email) : "";

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
        await sendRecoveryEmail(email, origin, events);
      }
    } catch (error) {
      console.error("Recovery email failed", error);
    }
  }

  return NextResponse.json({ message: GENERIC_MESSAGE });
}
