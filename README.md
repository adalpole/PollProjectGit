# Convene

Convene is a small, self-hosted group scheduling app built with Next.js App Router and Supabase. An organizer creates a poll, shares the public participant link, collects availability without guest accounts, and uses the private organizer URL to select a slot and export contacts.

## Stack

- Next.js 16, React 19, TypeScript (satisfies the Next.js 14+ requirement)
- Supabase Postgres with `@supabase/supabase-js`
- Vercel Hobby compatible serverless route handlers
- Plain CSS using the ledger-style prototype visual system

## Set up Supabase

1. Create a free Supabase project at [supabase.com](https://supabase.com).
2. Open the SQL editor.
3. Run the full migration in `supabase/migration.sql`.
4. In Settings -> API, copy the project URL and anon public key.

The migration creates `events` and `responses`, enables RLS, prevents public `select` on `responses`, and exposes organizer-only operations through token-checking `security definer` functions. The participant-facing event queries select only `id`, `title`, `slots`, `confirmed_slot_index`, and `created_at`; they never return `organizer_token`, respondent emails, or respondent organizations.

## Configure locally

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

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

Or push the project to GitHub and import it in Vercel. Add the same two environment variables in Vercel Project Settings before deploying.

## Security and data access notes

- Organizer identity is the UUID token in `/e/[id]/[organizer_token]`; there is no login system in v1.
- Participant submissions go through `POST /api/events/[id]/responses`, which validates organization, email, and availability server-side before writing.
- Both CSV exports are only served by organizer-token-gated routes:
  - `/api/events/[id]/export/all?token=...`
  - `/api/events/[id]/export/available?token=...`
- No public or participant-facing route selects from `responses`, and no participant-facing response includes other respondents' `email` or `organization`.
- Anyone with the public poll UUID can submit or resubmit a response for an email address. That is the tradeoff for the requested no-auth participant flow.

## Free tier fit

This app uses ordinary Vercel serverless route handlers and Supabase Postgres. It has no cron jobs, background workers, long-running processes, file storage, calendar integrations, or paid Vercel features. Supabase's free project limits, including 500 MB database storage, are more than enough for typical scheduling polls.

## Data privacy

Convene stores names, organizations, emails, and availability. The organizer is responsible for handling exported contact lists according to their institution's data protection policy, including GDPR obligations when respondents are in the EU.
