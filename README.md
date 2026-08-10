# Tarek Buys Houses

**Sell your house fast for cash.** Tarek El Moussa's team buys homes in any condition, close in as little as 7 days, with no repairs, no fees, and no obligation.

Live site: [https://tarekbuyshouses.com](https://tarekbuyshouses.com)
Testing site: [https://tarekbuyshouses-testing.vercel.app](https://tarekbuyshouses-testing.vercel.app)

This repository contains the full marketing and lead-generation website for the Tarek Buys Houses company. It is a private, production Next.js application.

---

## Overview

The site is the company's primary acquisition channel. Homeowners land on situation- and market-specific pages, learn how the process works, and submit their property for a cash offer. Every submission flows through a protected backend pipeline (validation, spam protection, CRM sync, analytics, and staff notifications) and is managed afterward in a full admin panel.

Two audiences use this repo:

- **Stakeholders** — read [Key Features](#key-features) to understand what the product does.
- **Developers** — read [Getting Started](#getting-started) onward to run and extend the code.

---

## Key Features

### Lead capture

- Property lead form with Google Maps address autocomplete
- reCAPTCHA (v3) spam protection on both client and server
- Timezone captured automatically from the browser (`tz_browser`) and IP geolocation (`tz_ip`)
- Browser + IP geolocation, traffic-source attribution, and phone-number normalization on every lead
- Rate limiting and structured error classification with a retryable-errors admin view

### Lead routing & analytics

- Every lead is written to Supabase and pushed to the **GoHighLevel (GHL)** CRM pipeline
- **Slack** notifications to the team, including a success-channel webhook
- **Meta Conversions API** server events, plus Meta Pixel, GA4, Google Ads (with conversion label), and Google Tag Manager client-side tracking
- **CallRail** phone-swap script for call attribution
- IP geolocation via ipinfo.io, cached to avoid blocking submissions

### Admin panel (`/admin`)

- **Leads**: review, filter, export to CSV/Excel, and inspect full lead details (contact, property, timezone, errors, retries)
- **Lead errors**: monitor failed submissions and retry them
- **Testimonials**: curate a DB-backed testimonials engine, manage per-section assignments with a live site preview, and upload videos + thumbnails
- **Blogs**: publish and manage posts
- **Analytics**, **Ad creatives**, and **Scaling** dashboards

### Content

- **Blog** with AI-assisted generation backed by Supabase edge functions
- Situation pages (`/divorce`, `/foreclosure`, …) and market pages (`/markets`) built as dynamic routes
- Testimonial content stored in Supabase with static fallback data when the database is unreachable

### Engagement

- AI chat widget powered by **ElevenLabs**
- SMS opt-in flow, contact page, and a full set of legal pages (privacy, terms, do-not-sell)

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | [Next.js](https://nextjs.org) 16 (App Router), React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com/) (Radix primitives) |
| Backend / data | [Supabase](https://supabase.com) — Postgres, Auth, Storage, Edge Functions |
| Data fetching | TanStack Query |
| CRM | GoHighLevel (GHL) |
| AI | ElevenLabs (conversational chat) + Supabase edge functions (blog generation) |
| Notifications | Slack webhooks |
| Analytics / ads | GA4, Meta Pixel + Conversions API, Google Ads, Google Tag Manager, CallRail |
| File storage | Vercel Blob (videos), Supabase Storage (blog images, testimonial media) |
| Testing | Jest + Testing Library |

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- Access to the project's Supabase projects (prod + testing) and the environment variables in `.env` / `.env.local`

### Setup

```bash
npm install
```

The repo does not ship a `.env.example`. Copy the required variables from an existing `.env` / `.env.local` (see [Environment Variables](#environment-variables) for the full list).

### Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build & start (production mode)

```bash
npm run build
npm start
```

---

## Environment Variables

Environment resolution is centralized in [`src/lib/shared/env.ts`](src/lib/shared/env.ts). Local development can override production values using `TESTING_` / `TEST_` prefixes — the prefixed variable takes priority when present, then falls back to the unprefixed one. On Vercel only the unprefixed names are set.

### Client-side (`NEXT_PUBLIC_*`)

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (fallback for client queries) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (client queries; RLS-protected) |
| `NEXT_PUBLIC_TESTING_SUPABASE_URL` | Local-dev override of the Supabase URL |
| `NEXT_PUBLIC_TESTING_SUPABASE_ANON_KEY` | Local-dev override of the anon key |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Address autocomplete on the lead form |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | reCAPTCHA v3 site key (client) |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | Google Analytics 4 measurement ID |
| `NEXT_PUBLIC_META_PIXEL_ID` | Meta Pixel ID |
| `NEXT_PUBLIC_TESTING_META_PIXEL_ID` | Local-dev override of the Meta Pixel ID |
| `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID` | Google Ads conversion tracking ID |
| `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL` | Google Ads conversion label |
| `NEXT_PUBLIC_TEST_MODE` | `"true"` enables admin test-mode auth bypass |

### Server-side

| Variable | Purpose |
| --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side Supabase admin access (bypasses RLS) |
| `TESTING_SUPABASE_SERVICE_ROLE_KEY` | Local-dev override of the service role key |
| `GHL_API_KEY` | GoHighLevel API key for CRM lead sync |
| `TESTING_GHL_API_KEY` | Local-dev override of the GHL API key |
| `GHL_LOCATION_ID` | GoHighLevel location/agency ID |
| `TESTING_GHL_LOCATION_ID` | Local-dev override of the GHL location ID |
| `GHL_API_BASE_URL` | GoHighLevel API base URL (defaults to `https://services.leadconnectorhq.com`) |
| `TESTING_GHL_API_BASE_URL` | Local-dev override of the GHL API base URL |
| `GHL_PIPELINE_ID` | GHL pipeline for inbound leads |
| `TEST_GHL_PIPELINE_ID` | Local-dev override of the pipeline ID |
| `GHL_PIPELINE_STAGE_ID` | GHL pipeline stage for inbound leads |
| `TEST_GHL_PIPELINE_STAGE_ID` | Local-dev override of the stage ID |
| `SLACK_WEBHOOK_URL` | Slack webhook for lead alerts |
| `SLACK_WEBHOOK_URL_SUCCESS` | Slack webhook for the success/alerts channel |
| `TEST_SLACK_WEBHOOK_URL` | Local-dev override of the Slack webhook |
| `SLACK_ALERTS_DISABLED` | `"true"` disables Slack alerts entirely |
| `RECAPTCHA_SECRET_KEY` | reCAPTCHA v3 secret key (server-side verification) |
| `META_CAPI_ACCESS_TOKEN` | Meta Conversions API access token |
| `TESTING_META_CAPI_ACCESS_TOKEN` | Local-dev override of the Meta CAPI token |
| `META_CAPI_TEST_EVENT_CODE` | Optional Meta CAPI test event code |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token for video uploads |

---

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm run lint` | ESLint over the project |
| `npm run typecheck` | TypeScript check (`tsc --noEmit`) |
| `npm test` | Run Jest unit + integration tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |

---

## Project Structure

```
.
├── .github/workflows/     # CI (build + tests on pull requests)
├── docs/                  # SOPs, schema, research & operational notes
├── public/                # Static assets
├── src/
│   ├── app/               # App Router routes
│   │   ├── [situation]/[market]/   # Dynamic situation × market pages
│   │   ├── admin/                  # Admin panel (login, setup, protected sections)
│   │   ├── api/                    # attribution, leads, video API routes
│   │   ├── blog/                   # Blog index + [slug]
│   │   ├── about/  contact/  markets/  landing/
│   │   ├── privacy/  terms/  do-not-sell/  sms-opt-in/
│   │   ├── layout.tsx              # Root layout (GTM, Meta Pixel, reCAPTCHA, CallRail)
│   │   └── page.tsx                # Homepage
│   ├── assets/           # Fonts / static assets
│   ├── components/       # Domain-foldered UI components
│   │   ├── admin/  blog/  leads/  layout/  sections/  testimonials/  widgets/  ui/
│   ├── context/          # React context providers
│   ├── data/             # Static fallback data
│   ├── hooks/            # Domain-foldered hooks (admin, testimonials, …)
│   ├── lib/              # Business logic
│   │   ├── leads/        # GHL, notifications, Meta CAPI, error classification, exports
│   │   ├── shared/       # env resolution, phone helpers
│   │   ├── supabase/     # client/server clients + types
│   │   ├── tracking/     # analytics, reCAPTCHA, traffic source
│   │   ├── geo/  errors/  blog/  data/
│   │   └── notify.ts     # Slack alerts
│   └── types/            # Shared TypeScript types
├── supabase/
│   ├── migrations/       # SQL migrations
│   └── functions/        # Edge functions
│       ├── ai/  chat/  chat-legacy/  daily-blog-autopilot/
│       ├── elevenlabs-conversation-token/
│       ├── generate-blog-content/  generate-blog-images/
└── tests/
    ├── unit/             # Unit tests (forms, api, captcha, callrail, …)
    └── integration/      # Integration tests (captcha service, Slack webhook)
```

---

## Architecture & Data Flow

### Lead funnel

```
Lead form (address autocomplete, reCAPTCHA, timezone)
        │
        ▼
POST /api/leads/submit  (validation, rate limiting, reCAPTCHA verify)
        │
        ├──► Supabase  leads  table (persistent record, error tracking)
        ├──► GoHighLevel CRM  (pipeline + stage)
        ├──► Slack alert (webhook)
        ├──► Meta Conversions API (server event)
        └──► Client-side tracking: GA4, Meta Pixel, Google Ads, GTM, CallRail
```

### Content

- **Blog** and **testimonials** are DB-backed via Supabase, queried with TanStack Query on the client.
- Static fallback content lives in `src/data/` and renders automatically when the database is unreachable, so public pages never blank out.
- The testimonials engine supports per-section assignment, video/thumbnail uploads to Supabase Storage, and live preview in the admin panel.

---

## Supabase

### Migrations

`supabase/migrations/` — applied in order to the project database:

- `20260701_add_lead_errors_retry_columns.sql`
- `20260731_add_testimonial_section_assignments.sql`
- `20260805_add_testimonial_thumbnail_url.sql`

### Edge functions

`supabase/functions/`:

| Function | Purpose |
| --- | --- |
| `ai` | AI-driven assistance / chat backend |
| `chat` | Chat widget backend |
| `chat-legacy` | Legacy chat backend (retained for compatibility) |
| `daily-blog-autopilot` | Scheduled blog content generation |
| `generate-blog-content` | Blog post content generation |
| `generate-blog-images` | Blog post image generation |
| `elevenlabs-conversation-token` | ElevenLabs conversation auth tokens |

### Storage buckets

- Blog images
- Testimonial videos + thumbnails

All tables and buckets are protected by **Row Level Security (RLS)**: anonymous users get read-only access where needed; writes are restricted to authenticated admin users.

---

## Admin Panel

- **Access**: `/admin` (login), first-run setup at `/admin/setup`, password reset at `/admin/forgot-password` / `/admin/reset-password`.
- **Auth**: Supabase Auth with admin-only protected routes. Setting `NEXT_PUBLIC_TEST_MODE=true` enables a local test-mode bypass.
- **Sections**: leads, lead-errors, blogs, testimonials, analytics, ad-creatives, scaling, content.

---

## Deployment & CI

- **Hosting**: Vercel.
- **Production**: `https://tarekbuyshouses.com` — deployed from `main`.
- **Environment split**: `main` (production), `dev`, `staging`, plus `feat/*` / `preview/*` branches. Environment variables are configured per Vercel environment; only unprefixed variable names exist in Vercel.
- **CI**: `.github/workflows/ci.yml` runs on every pull request — installs dependencies, builds the app, runs the unit/integration suite, and runs the Slack webhook integration tests (requires the `SLACK_WEBHOOK_URL` / `SLACK_WEBHOOK_URL_SUCCESS` secrets).

---

## Testing

```bash
npm test                 # all tests
npm run test:watch       # watch mode
npm run test:coverage    # coverage report
```

Tests live in `tests/`:

- **Unit** (`tests/unit/`) — lead submission, form components, captcha service, phone helpers, notifications, storage error handling, root-layout GTM, URL health.
- **Integration** (`tests/integration/`) — captcha service and Slack webhook delivery (Slack tests require real webhook secrets and are run separately in CI).

---

## Documentation

- [`AGENTS.md`](AGENTS.md) — agent/LLM instructions for working in this repo (read before writing code)
- [`CLAUDE.md`](CLAUDE.md) — pointer file importing `AGENTS.md`
- [`docs/`](docs/) — SOPs and operational notes (research-first process SOP, CallRail phone swap, DB schema)
- [`SUBSTANTIATION.md`](SUBSTANTIATION.md) — claims/substantiation references for marketing copy
- [`tbh-main-audit.md`](tbh-main-audit.md) — site audit notes
- [`blogs-generation.md`](blogs-generation.md) — blog generation workflow notes

---

## License

Private repository owned by the Tarek Buys Houses company. All rights reserved. No external contributions or redistribution are permitted.
