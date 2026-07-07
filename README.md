# Convene

Convene is a small, self-hosted group scheduling app built with Next.js App Router and Supabase. An organizer creates a poll, shares the public participant link, collects availability without guest accounts, and uses the private organizer URL to select a slot and export contacts. v2 adds optional organizer-link recovery by email without adding login.

## Stack

- Next.js 16, React 19, TypeScript (satisfies the Next.js 14+ requirement)
- Supabase Postgres with `@supabase/supabase-js`
- Resend transactional email for organizer-link recovery only
- Vercel Hobby compatible serverless route handlers
- Plain CSS using the POLIMI blue/light-blue visual system

## Set up Supabase

1. Create a free Supabase project at [supabase.com](https://supabase.com).
2. Open the SQL editor.
3. Run the full migration in `supabase/migration.sql`.
4. In Settings -> API, copy the project URL and anon public key.

The migration creates `events` and `responses`, enables RLS, prevents public `select` on `responses`, and exposes organizer-only operations through token-checking `security definer` functions. The participant-facing event queries select only `id`, `title`, `slots`, `confirmed_slot_index`, and `created_at`; they never return `organizer_token`, `organizer_email`, respondent emails, or respondent organizations.

## Configure locally

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=Convene <onboarding@resend.dev>
```

`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, and `RESEND_FROM_EMAIL` are server-only values. Never prefix them with `NEXT_PUBLIC_`. The service role key is used only by `/api/recover` so organizer emails and organizer tokens can be looked up without exposing a public recovery RPC.

Install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

Use either flow:

```bash
vercel --prod
```

Or push the project to GitHub and import it in Vercel. Add the environment variables from `.env.example` in Vercel Project Settings before deploying. For production email sending, set `RESEND_FROM_EMAIL` to an address allowed by your Resend account/domain.

## Security and data access notes

- Organizer identity is the UUID token in `/e/[id]/[organizer_token]`; there is no login system in v2.
- Participant submissions go through `POST /api/events/[id]/responses`, which validates organization, email, and availability server-side before writing.
- Organizer link recovery is optional. If an organizer enters an email when creating a poll, `/recover` can email the matching private organizer links.
- `/recover` always returns the same generic response for a valid email request, whether or not matching polls exist.
- `/recover` is rate-limited in memory to reduce abuse, and it uses the server-only Supabase service role key plus Resend API key.
- Both CSV exports are only served by organizer-token-gated routes:
  - `/api/events/[id]/export/all?token=...`
  - `/api/events/[id]/export/available?token=...`
- No public or participant-facing route selects from `responses`, and no participant-facing response includes `organizer_email`, `organizer_token`, or other respondents' `email` or `organization`.
- Anyone with the public poll UUID can submit or resubmit a response for an email address. That is the tradeoff for the requested no-auth participant flow.

## Versioning

- **v1** was the first lightweight release: no accounts, no login, and organizer access through the private organizer link.
- **v2** keeps the no-login model and adds optional organizer-link recovery by email.
- **Future candidate**: add a small organizer dashboard if link recovery is not enough, while keeping participant access account-free.

## Free tier fit

This app uses ordinary Vercel serverless route handlers, Supabase Postgres, and Resend transactional email. It has no cron jobs, background workers, long-running processes, file storage, calendar integrations, or paid Vercel features. Supabase's free project limits, including 500 MB database storage, are more than enough for typical scheduling polls.

## Data privacy

Convene stores organizer recovery emails, participant names, organizations, emails, and availability. The organizer is responsible for handling exported contact lists according to their institution's data protection policy, including GDPR obligations when respondents are in the EU.
