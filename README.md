# Tarek Buys Houses

The production marketing, lead-capture, content, and internal operations application for Tarek Buys Houses. Homeowners can request a cash offer through the homepage, campaign landing pages, and market-specific situation pages; staff manage resulting leads and content through the Supabase-backed admin application.

This is a private production Next.js application. The repository contains the website and checked-in application code, but it is not currently a complete infrastructure bootstrap: the deployed Supabase projects, baseline database schema, dashboard configuration, schedules, secrets, and several externally deployed Edge Functions are required dependencies.

---

## Purpose and Environments

The site is the company's primary homeowner acquisition channel. Its core responsibilities are:

- Explain the cash-offer process through general, market, situation, and campaign content.
- Collect and validate seller and property information.
- Persist leads in Supabase and synchronize configured leads to GoHighLevel (GHL).
- Notify staff through Slack and send conversion events (GA4 gated by the site-analytics preference; advertising measurement ungated).
- Provide internal lead, content, testimonial, analytics, and creative-management tools.

| Environment | URL | Notes |
| --- | --- | --- |
| Production | [https://tarekbuyshouses.com](https://tarekbuyshouses.com) | Public customer-facing site; expected to use production service configuration. |
| Testing | [https://tarekbuyshouses-testing.vercel.app](https://tarekbuyshouses-testing.vercel.app) | Shared testing deployment on staging branch; its Vercel and Supabase mapping is managed outside this repository. |
| Local | [http://localhost:3000](http://localhost:3000) | Uses testing-prefixed variables when present, then falls back to unprefixed variables. |

---

## Production Feature Status

Status labels are intentional. Do not assume that code present in the repository is visible, connected, or independently deployable.

| Area | Status | Current behavior |
| --- | --- | --- |
| Public marketing site | Active | Homepage, company/contact/legal pages, market directory, 510 situation x market pages, and California campaign landing page. |
| Lead capture | Active | Multi-step forms submit through `/api/leads/submit` with server address verification, rate limiting, optional reCAPTCHA enforcement, Supabase persistence, GHL sync, and notifications. |
| Admin leads and errors | Active | Lead review, filtering, stage changes, export, error classification, and manual retry. |
| Blog | Active | Public Supabase-backed blog, admin editing, checked-in generation functions, and externally configured scheduling. |
| Testimonials | Mixed | Admin CRUD and media management are DB-backed; prominent public situation-page testimonial cards are static. Some DB-backed public sections are mounted but hidden. |
| Text chat | Active | `ChatWidget` invokes the Gemini-backed Supabase `chat` Edge Function. |
| Voice agent | Hidden | ElevenLabs voice code and token function exist, but the widget is rendered inside a hidden container. |
| Content Studio | External dependency | UI exists, but several invoked Edge Functions are not checked into this repository. |
| Ad creative generation | External dependency | Admin UI exists, but generation functions are not checked into this repository. |
| Attribution click ingestion | Disconnected | API and database table exist, but no checked-in UI currently emits the click beacon. |
| Legacy chat | Legacy | `chat-legacy` remains checked in but is not the current text-chat implementation. |

## Primary User Journeys

1. **Homepage lead**: a visitor enters property and contact details on `/`; successful submission shows an inline confirmation.
2. **Situation and market lead**: a visitor lands on `/<situation>/<market>`, reads localized content, and submits from the hero, final CTA, sticky mobile CTA, or exit-intent form.
3. **California campaign lead**: a visitor submits on `/landing/california` and is redirected to `/landing/thank-you`.
4. **Market discovery**: a visitor browses `/markets` or `/markets/[location]` and selects a supported situation.
5. **Blog discovery**: a visitor browses `/blog`, filters posts, and opens `/blog/[slug]`.
6. **Direct contact**: a visitor uses `/contact`, tracked phone/SMS links, or the text chat widget.
7. **Staff operations**: an authenticated admin reviews leads, handles errors, manages content and testimonials, and monitors reporting under `/admin`.

---

## Route Inventory

### Public and metadata routes

| Route | Rendering and purpose |
| --- | --- |
| `/` | Client-rendered homepage and primary lead form. |
| `/about` | Company information with a final lead CTA. |
| `/contact` | Three-step lead form plus phone, SMS, email, and address details. |
| `/markets` | Directory of supported markets and situation links. |
| `/markets/[location]` | Filtered market view. An unknown slug currently falls back to the directory instead of returning 404. |
| `/[situation]/[market]` | Statically generated localized landing page. Only configured combinations are valid. |
| `/landing/california` | Campaign-specific California landing page. |
| `/landing/thank-you` | Post-submission page driven by optional `market` and `phone` query parameters. |
| `/blog` | Client-fetched published blog index with category filtering and pagination. |
| `/blog/[slug]` | Published article route with server metadata and a client-fetched article body. |
| `/privacy` | Privacy policy. |
| `/terms` | Terms and conditions. |
| `/do-not-sell` | Consumer privacy request information. |
| `/sms-opt-in` | SMS/TCPA disclosure with CallRail-resistant contact details. |
| `/robots.txt` | Generated by `src/app/robots.ts`. |
| `/sitemap.xml` | Generated by `src/app/sitemap.ts`; includes static pages, supported landing combinations, and published blogs. |

### Admin routes

| Route | Access and purpose |
| --- | --- |
| `/admin/login` | Public Supabase Auth login. |
| `/admin/setup` | Publicly reachable bootstrap UI; depends on the external `assign-admin-role` function. |
| `/admin/forgot-password` | Password recovery request. |
| `/admin/reset-password` | Password reset completion. |
| `/admin` | Protected operational overview. |
| `/admin/leads` | Lead table/Kanban, filters, updates, details, and exports. |
| `/admin/lead-errors` | Error review, editing, retry, resolution, and deletion. |
| `/admin/blogs` | Blog administration and generation actions. |
| `/admin/blog/[slug]` | Protected draft/preview route. |
| `/admin/testimonials` | Testimonial CRUD, media, featured status, points, and section assignments. |
| `/admin/analytics` | Lead status, market, situation, trend, and conversion reporting. |
| `/admin/scaling` | Polling view of stored scoring and routing data. |
| `/admin/content` | Content Studio; several generation actions require external Edge Functions. |
| `/admin/ad-creatives` | Creative generation and approval UI; generation requires external Edge Functions. |
| `/admin/address-tester` | Authenticated address-shape and geocoding dry run. |

### API routes

| Method and route | Purpose | Current protection |
| --- | --- | --- |
| `POST /api/leads/submit` | Public lead ingestion and integrations. | IP rate limit and reCAPTCHA when configured; no user login required. |
| `POST /api/leads/retry` | Replays a stored/edited lead into Supabase and GHL. | No explicit server-side auth or rate limit; intended for the admin UI. |
| `POST /api/places/autocomplete` | Google Places autocomplete proxy. | Public, 30 requests/IP/minute. |
| `POST /api/places/details` | Google place-details proxy. | Public, 10 requests/IP/minute. |
| `POST /api/places/test` | Address/geocoding dry run. | Requires a valid bearer token and `admin` role; 30 requests/IP/minute. |
| `POST /api/attribution/click` | Fire-and-forget call/SMS click storage. | Public, 20 requests/IP/minute; currently has no checked-in UI caller. |
| `GET /api/video?file=...` | Finds the first Vercel Blob object matching a prefix. | Public; no route-specific authentication or allowlist. |

---

## Situation and Market Pages

The route model is `/<situation>/<market>`, not a standalone situation path. [`src/lib/data/situations.ts`](src/lib/data/situations.ts) defines 17 situations and [`src/lib/data/markets.ts`](src/lib/data/markets.ts) defines 30 markets, producing 510 statically generated combinations.

Supported situations:

`divorce`, `foreclosure`, `inherited`, `behind-on-payments`, `major-repairs`, `relocating`, `downsizing`, `vacant-property`, `tax-liens`, `bad-tenants`, `code-violations`, `fire-damage`, `hoarder-house`, `bankruptcy`, `job-loss`, `medical-bills`, `tired-landlord`

Supported markets:

`tampa`, `phoenix`, `atlanta`, `dallas`, `houston`, `charlotte`, `nashville`, `jacksonville`, `orlando`, `san-antonio`, `las-vegas`, `denver`, `raleigh`, `minneapolis`, `sacramento`, `salt-lake-city`, `tucson`, `indianapolis`, `columbus`, `san-bernardino`, `los-angeles`, `san-diego`, `orange-county`, `san-francisco`, `san-jose`, `fresno`, `bakersfield`, `mesa`, `scottsdale`, `flagstaff`

Generation and content rules:

- `generateStaticParams()` creates the full configured Cartesian product.
- `dynamicParams = false`; new slugs require a deployment/build before they resolve.
- Invalid combinations return the global 404 page.
- Pages revalidate hourly.
- The server loads the latest published `generated_content` row with `content_type = full_page`; the browser refreshes the same content after hydration.
- Non-empty generated fields override static situation copy one field at a time.
- Empty generated fields and failed server content queries leave static fields in the initial render. `SKIP_SERVER_CONTENT` skips only the server query; the browser can still query and apply generated content after hydration.
- Before/after mechanism fields intentionally remain static and are not replaced by generated content.

---

## Lead Submission Pipeline

All current public forms ultimately call `submitLead()` and `POST /api/leads/submit`. Form UIs require address and qualification fields, but the API's base required-field check is currently limited to `name` and `phone`; server address verification runs when `property_address` is present.

```text
Browser form
  -> normalize phone and enrich attribution, timezone, geo, consent, and idempotency
  -> POST /api/leads/submit
     -> IP rate limit
     -> parse and validate name, phone, optional email, and address shape
     -> Google server-side geocoding
     -> idempotency lookup
     -> reCAPTCHA verification when configured
     -> Supabase lead insert (duplicate phone is treated as a successful DB outcome)
     -> GHL contact/opportunity synchronization when configured
     -> Slack success, partial, or error notification when configured
     -> HTTP response
     -> Meta CAPI Lead event through Next.js after(), sharing the submit-generated event ID
```

### Outcome matrix

| Supabase | GHL | API result | Operational meaning |
| --- | --- | --- | --- |
| Success | Success | `200 { success: true }` | Fully synchronized. |
| Duplicate phone | Success | `200 { success: true, duplicate: true }` | Existing DB lead is accepted and GHL processing continues. |
| Success | Failure | `200 { success: true, warnings: [...] }` | Lead is retained in Supabase but CRM sync needs attention. |
| Failure | Success | `200 { success: true, warnings: [...] }` | Lead reached GHL but was not persisted in Supabase. |
| Success | Not configured | `200 { success: true, warnings: [...] }` | Lead is retained locally; CRM delivery was skipped. |
| Failure | Not configured | `200 { success: true, warnings: [...] }` | Neither destination retained the lead even though the current API reports partial success; treat as an operational failure. |
| Failure | Configured and failed | `500` | Neither configured destination completed successfully. |
| Invalid/geocoding/reCAPTCHA failure | Not attempted | `4xx` | Submission is blocked before persistence and CRM sync. |
| Rate limited | Not attempted | `429` | Submission is rejected; logging and Slack notification are attempted. |

Slack calls and GHL synchronization occur before the response. Meta CAPI is explicitly deferred. Idempotency response storage is currently invoked without awaiting it.

### GHL duplicate handling

- A newly created contact completes the GHL phase without explicitly creating an opportunity.
- Duplicate-contact handling requires both pipeline and stage IDs. Without either value, a duplicate response is treated as a GHL failure.
- With pipeline/stage configured, a duplicate contact with the same submitted address is treated as successful without creating another opportunity.
- With pipeline/stage configured, if neither side has an address, synchronization succeeds but emits a warning.
- With pipeline/stage configured, a duplicate contact with a different address creates an opportunity in that pipeline/stage.
- The GHL market tag preserves landing-page context, while `market_location` is derived from the submitted property address.
- Visitor-IP seller location and property market are separate concepts.

---

## Address Autocomplete and Verification

Address collection has three paths:

1. Browser Google Maps JavaScript Places using `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
2. Server proxy fallback through `/api/places/autocomplete` and `/api/places/details`.
3. Manual text entry when both autocomplete paths are unavailable.

The browser path times out after approximately three seconds before falling back to the proxy. Proxy requests are debounced, US-restricted, and use session tokens. Browser provenance (`google_selected`, `server_places_selected`, or `manual_confirmed`) is diagnostic only.

The lead endpoint is authoritative: a supplied address must pass the local full-address shape check and the Google Geocoding API. Browser selection never bypasses server geocoding. The admin address tester runs the same validation without inserting a lead or firing lead integrations.

---

## External Integrations

| Integration | Responsibility | Failure/degraded behavior |
| --- | --- | --- |
| Supabase | Postgres, Auth, RLS, Storage, Edge Functions, rate-limit RPC. | Public content can use static fallback in selected areas; lead behavior depends on which operation failed. |
| GoHighLevel | Contact synchronization and duplicate-address opportunity creation. | Missing config is skipped; configured failure can still yield partial lead success. |
| Slack | Success, partial, error, address-block, and rate-limit notifications. | Missing/disabled config skips delivery; network and retryable failures are retried, while HTTP 4xx responses stop immediately. |
| Google Maps JavaScript API | Primary browser address autocomplete. | Falls back to server Places or manual input. |
| Google Places API (New) | Server autocomplete/details proxy. | Missing key returns service errors; manual input remains available. |
| Google Geocoding API | Authoritative submitted-address verification. | A submitted address cannot proceed when geocoding fails. |
| Google reCAPTCHA v3 | Bot score for lead submission. | Server verification is skipped if `RECAPTCHA_SECRET_KEY` is absent. |
| Meta Pixel/CAPI | Browser and server Lead/PageView tracking with shared event-ID deduplication. | Browser Lead and CAPI fire regardless of cookie choice; CAPI is omitted only without server credentials. |
| GTM/GA4/Google Ads | Tag management, analytics, and conversion tracking. | Identifier and consent behavior differs by integration; see the analytics matrix. |
| CallRail | Dynamic phone destination swapping. | `PhoneLink` lets CallRail swap the visible number and the `tel:`/`sms:` destination together; `PhoneText` keeps unlinked numbers canonical; account behavior is configured externally. |
| IPInfo | Browser-side city/state/country/timezone enrichment and market personalization. | Cached failure/unknown locations fall back to Tampa behavior; submission is not blocked. |
| Gemini | Text chat, blog text, and image-generation modules in Supabase functions. | Requires `GEMINI_API_KEY` in the Edge Function environment. |
| ElevenLabs | Voice conversation token and WebRTC agent. | Current public widget is hidden. |
| Vercel Blob | Existing market video lookup through `/api/video`. | Missing token or object returns an API error; uploads are not handled by this route. |

See [`docs/callrail-phone-swap.md`](docs/callrail-phone-swap.md) for phone-link implementation and account caveats. CallRail swaps a `PhoneLink`'s displayed number and its `tel:`/`sms:` destination together, so the number shown is the number dialed; `freezeHref` keeps both canonical where compliance requires it.

---

## Authentication and Authorization

- Supabase Auth provides admin sessions, password recovery, and token refresh.
- Sessions persist in browser `localStorage`, not server cookies.
- Protected admin layouts check the browser session and query `user_roles` for the `admin` role after hydration.
- There is no Next.js middleware protecting the admin route tree at the request boundary.
- Browser admin queries and mutations depend on deployed Supabase RLS and storage policies for the actual data boundary.
- `/api/places/test` independently verifies the bearer token and admin role server-side.
- `NEXT_PUBLIC_TEST_MODE` does not bypass authentication or role checks.
- `/admin/setup` depends on externally deployed `assign-admin-role`; its production eligibility and bootstrap restrictions must be controlled by that function and operational process.
- `/api/leads/retry` is intended for admin use but currently lacks an explicit server-side auth check.

Because the complete deployed RLS baseline is not represented in tracked migrations, authorization changes must be verified against both testing and production Supabase projects.

---

## Content, Blog, and Testimonials

### Generated landing content

- Static market and situation data supply the initial server fallback when generated content is absent or the server query fails. The browser subsequently attempts its own generated-content query.
- Published `generated_content` can override eligible fields for a situation/market pair.
- Server fetches support metadata and initial rendering; TanStack Query refreshes content in the browser.

### Blog

- `/blog` uses TanStack Query to load published posts in the browser.
- `/blog/[slug]` generates metadata/static params server-side and fetches visible article data in the client.
- Article rendering supports Markdown/GFM, headings/table of contents, FAQ extraction/schema, internal links, related posts, and CTA content.
- Admin tools support editing, status/category changes, soft deletion, preview, and image generation.
- Checked-in functions support manual content/image generation and daily autopilot; scheduling is external.

### Testimonials

Two systems coexist:

- Supabase-backed testimonial records, assignments, media, featured status, and admin management.
- Static public testimonial cards in [`src/data/testimonials.ts`](src/data/testimonials.ts), currently used for prominent situation/market and California sections.

Some DB-backed testimonial components are mounted inside hidden containers on public pages. Supabase Storage holds admin-uploaded testimonial videos and thumbnails.

---

## Supabase Schema Ownership and Provisioning

Supabase is the operational source for Postgres, Auth, RLS, Storage, RPCs, and Edge Functions. Schema changes are expected to use reviewed Supabase SQL rather than ad hoc application startup logic.

The repository is **not currently a fresh-project bootstrap**:

- The complete baseline schema, all enums/functions/triggers, RLS policies, grants, storage buckets, and schedules are not represented by tracked migration files.
- `supabase/migrations/` is currently ignored by `.gitignore`; local workspace migration files are not guaranteed to exist in a fresh clone.
- Available local migrations are incremental and assume existing resources such as `lead_errors`, `testimonials`, and `has_role`.
- Runtime rate limiting also requires the deployed `increment_rate_limit` RPC.
- Environment setup therefore requires access to an existing approved Supabase project or a separately supplied baseline.

Operational schema workflow:

1. Review SQL for tables, constraints, indexes, RLS, grants, storage, and RPC effects.
2. Apply and verify it in the testing Supabase project first.
3. Test affected public and admin workflows.
4. Apply the reviewed change to production through the approved Supabase process.
5. Verify security and performance advisors plus the smoke tests in this README.
6. Record the change in tracked project documentation. Do not assume an ignored local migration is shared with other developers.

---

## Supabase Edge Functions

### Checked-in deployable functions

| Function | Purpose | Notes |
| --- | --- | --- |
| `chat` | Gemini-backed public text chat. | Current `ChatWidget` backend. |
| `chat-legacy` | Legacy direct chat implementation. | Retained but not current. |
| `daily-blog-autopilot` | Selects/generates/publishes a post and generates images. | Invocation schedule is configured outside this repository. |
| `generate-blog-content` | Generates and saves blog content. | Used by admin blog mutations. |
| `generate-blog-images` | Generates, uploads, and associates blog images. | Uses Gemini and `blog-images` storage. |
| `elevenlabs-conversation-token` | Returns a short-lived ElevenLabs conversation token. | Supports the hidden voice widget. |

`supabase/functions/ai/` is a shared module used by deployable functions; it has no request handler and is not an independently callable Edge Function.

### Invoked but not checked in

| Function | Caller |
| --- | --- |
| `assign-admin-role` | `/admin/setup` |
| `generate-content` | Content Studio landing-pages tab |
| `generate-email-sequences` | Content Studio email tab |
| `generate-sms-templates` | Content Studio SMS tab |
| `content-loop-nightly` | Content Studio performance loop |
| `generate-ad-creatives` | Ad Creatives admin page |
| `generate-ad-images` | Ad Creatives admin page |

These are external deployment dependencies or incomplete repository coverage. Their source, deployment configuration, JWT-verification settings, secrets, and schedules must be verified in the target Supabase project before relying on the corresponding UI.

---

## Storage

| Store/bucket | Current use | Access notes |
| --- | --- | --- |
| Supabase `blog-images` | AI-generated and admin-managed blog media. | Public rendering and privileged writes depend on deployed bucket policies. |
| Supabase `testimonial-videos` | Admin testimonial video uploads. | Upload hooks run from the authenticated admin browser. |
| Supabase `testimonial-thumbnails` | Admin testimonial poster/thumbnail uploads. | Current local policy SQL should be reviewed because write policies use the broad `public` role. |
| Vercel Blob | Lookup of existing market video assets. | `/api/video` lists by caller-supplied prefix using a server token and returns the first match. |
| `public/` | Versioned static site assets. | Served by Next.js with long-lived immutable cache headers for common image extensions. |

---

## Analytics, Attribution, and Consent

| System | Initialization | Consent behavior | Identifier source |
| --- | --- | --- | --- |
| Google Tag Manager | Root layout, before interactivity, all routes | Loads regardless of cookie choice. | Hard-coded in `src/app/layout.tsx`. |
| Meta Pixel | Root layout, after interactivity, all routes | Initializes and sends PageView regardless of cookie choice. Lead events with advanced matching also fire regardless of choice. | `NEXT_PUBLIC_META_PIXEL_ID`. |
| Meta CAPI | Post-response after a successful/partial lead | Sent for every lead on the submit-generated `meta_event_id`; shares event ID with Pixel for deduplication. Failures alert Slack unless Meta is unconfigured. | Pixel ID plus `META_CAPI_ACCESS_TOKEN`. |
| GA4 | Global `AnalyticsInit` on every route; shares the Google tag script with Google Ads | Opt-in only. Configured only when the site-analytics preference is `all`, and configured again on a later preference change. An unset preference does not start GA4. | `NEXT_PUBLIC_GA4_MEASUREMENT_ID`. |
| Google Ads | Global `AnalyticsInit` on every route; shares the Google tag script with GA4 | Never consent-gated. Configured whenever the conversion ID is present, including under `essential`, legacy `none`, and an unset preference. | Conversion ID and label variables. |
| CallRail | Root layout, all routes | Loads regardless of cookie choice. | Hard-coded script URL. |
| Vercel Analytics | Root layout, all routes | Mounted regardless of cookie choice. | Vercel project configuration. |
| Site analytics preference | Global banner in root layout, all routes | `Allow Site Analytics` stores `all` (GA4 enabled); `Essential Site Cookies Only` and the close button store `essential` (GA4 disabled). An unset preference and legacy `none` are treated as GA4-disabled. See `src/lib/tracking/consent.ts`. | `localStorage.cookie_consent`. |
| Session attribution | Global `AttributionCapture` stores meaningful UTM/click data for the active browser tab | Same-site navigation, reloads, and history restores preserve attribution; direct/external entries reset it. Not consent-gated (first-party operational data). | `sessionStorage.tbh_attribution_session`. |
| Call/SMS attribution | `PhoneLink` sends an attribution beacon on every `tel:`/`sms:` click | Uses live URL data plus active session attribution; not consent-gated. | `/api/attribution/click`. |
| UTM/click IDs | `submitLead()` merges live URL data with the active tab session | Captured with every lead payload; legacy `localStorage.tbh_attribution` is removed and never read. | URL parameters, linker/Meta cookies, active session. |

The banner is a site-analytics preference, not an advertising-consent switch. GA4 is the only consent-gated integration: it stays unconfigured until a visitor selects `Allow Site Analytics`, and it is configured without a reload when they do. Google Ads conversions, Meta browser Lead and custom events, shared-event-ID CAPI Lead events, GTM, the root Meta Pixel, CallRail, attribution beacons, and Vercel Analytics run regardless of the stored preference, so advertising measurement and Meta pixel/CAPI deduplication are unaffected by it. Google Consent Mode is intentionally not used, because its `ad_storage`/`analytics_storage` signals would re-apply consent behavior to Google Ads.

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
| AI | Gemini-backed text chat and content generation; ElevenLabs voice agent code (currently hidden) |
| Notifications | Slack webhooks |
| Analytics / ads | GA4, Meta Pixel + Conversions API, Google Ads, Google Tag Manager, Vercel Analytics, CallRail |
| File storage | Supabase Storage (blog and testimonial media); Vercel Blob lookup for market video assets |
| Testing | Jest + Testing Library |

---

## Getting Started

### Prerequisites

- Node.js 20.19+ or another release supported by the installed toolchain
- npm and the committed `package-lock.json`
- Authorized access to the testing Supabase project and required third-party services
- Environment variables obtained through the team's secure secret-sharing process

### Setup

```bash
npm ci
```

The repository does not currently ship a `.env.example`. Create `.env.local` from securely supplied values; never commit credentials or copy production secrets into an unapproved environment. See [Environment Variables](#environment-variables) for names and runtime ownership.

### Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Validate, build, and start

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

`npm run build` is not a substitute for `npm run typecheck`: the Next.js configuration currently allows production builds to continue when TypeScript errors exist.

---

## Environment Variables

Environment resolution is partly centralized in [`src/lib/shared/env.ts`](src/lib/shared/env.ts). Some integrations read `process.env` directly. Local development prefers the exact testing override listed below and otherwise falls back to the unprefixed value. Testing prefixes are not uniform; use the names exactly as documented.

Never expose server keys through `NEXT_PUBLIC_*`. Values marked optional enable or modify a feature; missing values can cause the fail-open or degraded behavior described below.

### Next.js browser variables

| Variable | Requirement | Purpose and behavior |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Required | Supabase project URL used by browser and selected server-side anon clients. |
| `NEXT_PUBLIC_TESTING_SUPABASE_URL` | Local override | Preferred Supabase URL when present locally. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Required | Browser-safe Supabase anon/publishable key; effective access depends on RLS. |
| `NEXT_PUBLIC_TESTING_SUPABASE_ANON_KEY` | Local override | Preferred anon key when present locally. |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Recommended | Browser Google Maps/Places autocomplete. Without it, address input falls back to the server proxy or manual entry. |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Recommended | Generates browser reCAPTCHA v3 tokens. |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | Optional | GA4 identifier. Only configured when the visitor allows site analytics. |
| `NEXT_PUBLIC_META_PIXEL_ID` | Optional | Production Meta Pixel identifier. The root layout currently initializes it globally. |
| `NEXT_PUBLIC_TESTING_META_PIXEL_ID` | Local override | Meta Pixel ID used by server CAPI resolution when present. |
| `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID` | Optional | Google Ads gtag identifier. Configured and used regardless of the cookie preference. |
| `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL` | Optional | Google Ads lead-conversion label. Conversions fire regardless of the cookie preference. |
| `NEXT_PUBLIC_TEST_MODE` | Legacy/limited | When `"true"`, changes admin sign-out behavior only. It does **not** bypass login or the admin-role check. |

### Next.js server variables

| Variable | Requirement | Purpose and behavior |
| --- | --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | Required for privileged routes | Server-only Supabase key that bypasses RLS. Never expose it to the browser. |
| `TESTING_SUPABASE_SERVICE_ROLE_KEY` | Local override | Preferred testing service-role key. |
| `GHL_API_KEY` | Optional | GHL credential. Lead persistence can still succeed when it is absent. |
| `TESTING_GHL_API_KEY` | Local override | Preferred testing GHL credential. |
| `GHL_LOCATION_ID` | Required with GHL key | GHL location identifier. |
| `TESTING_GHL_LOCATION_ID` | Local override | Preferred testing location identifier. |
| `GHL_API_BASE_URL` | Optional | Defaults to `https://services.leadconnectorhq.com`. |
| `TESTING_GHL_API_BASE_URL` | Local override | Preferred testing API base URL. |
| `GHL_PIPELINE_ID` | Required for duplicate handling | Pipeline used by all duplicate-contact handling, including same-address/no-address decisions. |
| `TEST_GHL_PIPELINE_ID` | Local override | Testing pipeline override. Note the `TEST_` prefix. |
| `GHL_PIPELINE_STAGE_ID` | Required for duplicate handling | Stage used by all duplicate-contact handling. |
| `TEST_GHL_PIPELINE_STAGE_ID` | Local override | Testing stage override. Note the `TEST_` prefix. |
| `SLACK_WEBHOOK_URL` | Optional | Error and general lead-alert destination. |
| `SLACK_WEBHOOK_URL_SUCCESS` | Optional | Successful and partial lead-alert destination. |
| `TEST_SLACK_WEBHOOK_URL` | Local override | Overrides both Slack destinations locally. |
| `SLACK_ALERTS_DISABLED` | Optional | Exact value `"true"` disables Slack delivery. |
| `RECAPTCHA_SECRET_KEY` | Recommended | Verifies reCAPTCHA server-side. Verification is skipped when absent. |
| `GOOGLE_MAPS_SERVER_KEY` | Required for submitted addresses | Google Geocoding API key used for authoritative address verification. |
| `TESTING_GOOGLE_MAPS_SERVER_KEY` | Local override | Preferred testing Geocoding key. |
| `GOOGLE_PLACES_SERVER_KEY` | Recommended | Places API (New) key for server autocomplete/details fallback. |
| `TESTING_GOOGLE_PLACES_SERVER_KEY` | Local override | Preferred testing Places key. |
| `META_CAPI_ACCESS_TOKEN` | Optional | Meta Conversions API credential. |
| `TESTING_META_CAPI_ACCESS_TOKEN` | Local override | Preferred testing Meta CAPI token. |
| `META_CAPI_TEST_EVENT_CODE` | Optional | Routes CAPI calls to Meta Test Events. |
| `BLOB_READ_WRITE_TOKEN` | Required by `/api/video` | Used server-side to list matching Vercel Blob video assets. The route does not upload files. |
| `SKIP_SERVER_CONTENT` | Build control | Skips only server generated-content queries; CI sets this to `1`. Browser queries can still run after hydration. |

### Supabase Edge Function secrets

These are configured in Supabase, not exposed to the Next.js browser bundle.

| Variable | Used by | Purpose |
| --- | --- | --- |
| `SUPABASE_URL` | Content/blog functions | Edge-runtime project URL, normally injected by Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | Content/blog functions | Privileged database and storage access. |
| `GEMINI_API_KEY` | Chat and generation modules | Gemini text and image generation. |
| `ELEVENLABS_API_KEY` | Voice token function/module | Server-side ElevenLabs credential. |
| `ELEVENLABS_AGENT_ID` | Voice token function/module | ElevenLabs conversational agent identifier. |

GTM and CallRail identifiers are currently hard-coded in [`src/app/layout.tsx`](src/app/layout.tsx), not environment variables.

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

## Architectural Directory Map

```text
.
|-- .github/workflows/       Pull-request CI
|-- docs/                    Tracked SOPs and operational notes
|-- public/                  Versioned public assets
|-- src/
|   |-- app/                 Next.js routes, layouts, metadata, and API handlers
|   |   |-- [situation]/[market]/
|   |   |-- admin/
|   |   |-- api/{attribution,leads,places,video}/
|   |   |-- blog/  landing/  markets/
|   |   `-- about/  contact/  legal routes
|   |-- components/          Domain UI, providers, shared controls, and widgets
|   |-- context/             Page-level market/situation context
|   |-- data/                Static testimonial and media data
|   |-- hooks/               Admin, blog, content, geo, lead, testimonial, and widget hooks
|   |-- lib/                 Domain and integration logic
|   |   |-- leads/           Persistence, GHL, notifications, geocoding, Meta CAPI
|   |   |-- supabase/        Browser/server clients and generated DB types
|   |   |-- tracking/        Analytics, reCAPTCHA, traffic-source attribution
|   |   `-- blog/  content/  data/  geo/  shared/
|   `-- types/               Shared application types
|-- supabase/functions/      Checked-in Edge Functions and shared AI modules
|-- tests/unit/              Component and domain tests
`-- tests/integration/       Route-handler and selected live-service tests
```

Prefer domain folders over adding unrelated logic to route files. Browser-safe and server-only credentials must remain separated; service-role access belongs only in server code or protected Edge Functions.

---

## Runtime Architecture

- The root layout mounts the public header, TanStack Query provider, tooltip/toast providers, global IP geolocation warm-up, tracking scripts, and Vercel Analytics.
- `Header` hides itself on `/admin` routes; the root geo warm-up still runs there.
- TanStack Query provides browser caching for public and admin data. Server components are used selectively for metadata, static parameters, and generated landing content.
- `PageContext` supplies market/situation content to localized page sections. Components rendered without a provider inherit the default Tampa/divorce context.
- The global error boundary reloads after stale-deployment `Failed to find Server Action` errors and otherwise presents a retry UI.
- Admin overview polling runs every minute; scaling data polls every 15 seconds. Lead-error retries are manual, not a scheduled worker.

---

## Admin Operations

- **Overview**: lead totals, statuses, error count, and recent drip health.
- **Leads**: table/Kanban views, filtering, stage updates, notes/offers, deletion, details, CSV, and Excel export.
- **Lead errors**: classification, editing, single/bulk retry, batch lineage, resolution, and deletion.
- **Blogs**: filtering, editing, status/category management, preview, soft deletion, and image regeneration.
- **Testimonials**: CRUD, featured state, points, video/thumbnail uploads, and ordered section assignments.
- **Analytics**: lead status, market, situation, 14-day trend, and closed/total conversion rate.
- **Scaling**: read-only/polling display of stored AI scoring and routing fields.
- **Content and ad creatives**: UI and database views exist, but generation depends on external functions listed above.
- **Address tester**: validates exact address shape and geocoding without creating leads or firing integrations.

---

## Deployment & CI

### Application deployment

- Vercel hosts the Next.js application.
- The documented convention is production from `main`, with testing/preview deployments for non-production work. Branch-to-environment mappings and environment variables are Vercel dashboard configuration and are not defined by a `vercel.json` file.
- Vercel environments should use the final unprefixed variable names. Testing-prefixed values are primarily a local-development override mechanism.
- Supabase SQL, Edge Functions, secrets, storage policies, and schedules deploy separately from Vercel.

### Pull-request CI

`.github/workflows/ci.yml` runs on every pull request:

1. Installs dependencies with `npm ci`.
2. Builds with dummy browser Supabase variables and `SKIP_SERVER_CONTENT=1`.
3. Runs Jest while excluding the Slack webhook file.
4. Runs the Slack webhook test separately with GitHub secrets.

CI does **not** currently run ESLint, standalone TypeScript checking, database migration validation, Edge Function checks, browser E2E tests, or deployment. Because Next.js build errors are configured to ignore TypeScript errors, run the full local validation sequence before merging.

### Required validation sequence

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

If an existing repository-wide failure prevents a clean command, document the exact failure and verify that the change introduces no new errors. Do not treat a successful `npm run build` as proof of TypeScript correctness.

### Release and smoke-test checklist

1. Confirm target Vercel and Supabase environments before changing configuration.
2. Apply reviewed database changes to testing and validate RLS, grants, RPCs, and storage policies.
3. Deploy required Edge Functions and secrets to testing; verify JWT settings for privileged functions.
4. Deploy the application preview and run the smoke tests below.
5. Promote the same reviewed application/database/function changes to production.
6. Re-run production smoke tests and inspect Vercel/Supabase logs plus lead alerts.

Smoke tests:

- Open `/`, one `/<situation>/<market>` page, `/markets`, `/blog`, and the legal pages.
- Submit an approved test lead and verify the API response, Supabase record, expected GHL result, and Slack notification.
- Verify browser and server address fallback paths with `/admin/address-tester`.
- Log into `/admin`, confirm role gating, and open leads, errors, blogs, testimonials, and analytics.
- Confirm images/video, chat, sitemap, and robots output.
- Verify analytics only in approved testing/debug modes; do not contaminate production reporting with arbitrary test events.

### Cron and rollback

- The daily blog autopilot schedule is external Supabase/Postgres configuration; no tracked migration currently installs it. Verify the deployed schedule directly before assuming automation is active.
- To roll back application code, redeploy the last known-good Vercel deployment or revert through the normal Git workflow.
- Database rollback requires a separately reviewed forward-fix or rollback SQL plan. Do not reset production or assume application rollback reverses schema changes.
- Edge Functions can be redeployed independently; restore the last known-good source/configuration and verify secrets/JWT behavior.

---

## Testing Scope and Limitations

```bash
npm test                 # all tests
npm run test:watch       # watch mode
npm run test:coverage    # coverage report
```

The current suite contains 28 unit files and 5 integration files.

- **Unit coverage**: multi-step forms, lead enrichment/helpers, address validation/autocomplete fallback, geo-to-market mapping, traffic sources (including session attribution and direct/external resets), site-analytics preference defaults and GA4/Ads event gating, attribution beacons and `PhoneLink` click wiring, GHL tags, Meta CAPI, notifications, exports, storage errors, testimonial video rendering, CallRail protections, GTM presence, and selected admin details.
- **Route-handler integration coverage**: lead submission, lead retry, and Places endpoints, generally with mocked Supabase and external requests.
- **Live integration coverage**: Slack webhook tests can make real network requests when secrets exist. The reCAPTCHA integration suite is currently disabled by an internal flag.

Important limitations:

- The default environment is jsdom; there is no Playwright/Cypress browser E2E suite.
- Supabase is globally mocked in most tests; the `supabase-connection` unit test does not prove a live connection.
- There is no automated verification of deployed RLS, storage uploads/policies, admin route security, cron, Edge Function gateway settings, or a complete deployed lead journey.
- Chat, voice, blog generation, Content Studio, ad generation, attribution click ingestion, consent interaction, and `/api/video` have limited or no end-to-end coverage.
- Test names such as "integration" do not necessarily mean a live deployed stack is involved.

---

## Troubleshooting

| Symptom | Checks |
| --- | --- |
| Supabase configuration error or blank admin data | Confirm the selected URL/key pair, testing override precedence, deployed RLS, and the user's `admin` role. |
| Address suggestions do not load | Check the browser Maps key, allowed referrers, then the server Places key and proxy response. Manual input should remain available. |
| Valid-looking address is rejected | Check `GOOGLE_MAPS_SERVER_KEY`, Geocoding API enablement/billing, full street/city/state/ZIP shape, and `/admin/address-tester`. |
| Leads are accepted without reCAPTCHA | `RECAPTCHA_SECRET_KEY` is missing; the current server implementation logs a warning and skips verification. |
| Rate limits appear ineffective | Verify the deployed `increment_rate_limit` RPC and permissions. Main lead/attribution limits can fail open on storage failure. |
| Lead returns success with warnings | Inspect `warnings`: Supabase and GHL are independent outcomes. Check `lead_errors`, GHL credentials, and Slack alerts. |
| GHL duplicate did not create an opportunity | Same-address duplicates intentionally do not create one; different-address duplicates require pipeline/stage configuration. |
| Slack message is missing | Check `SLACK_ALERTS_DISABLED`, both webhook variables, testing override precedence, and webhook response logs. |
| Content Studio or ad generation fails with function-not-found | Confirm the corresponding external Edge Function is deployed in the selected Supabase project. |
| `/admin/setup` creates a user but not an admin | Verify the external `assign-admin-role` function, its authorization rules, and `user_roles` insertion. |
| Generated landing copy is absent | Check `generated_content` status/type/version, Supabase configuration, and `SKIP_SERVER_CONTENT`; static content is the expected fallback. |
| Video lookup fails | Check `BLOB_READ_WRITE_TOKEN`, requested prefix, and whether a matching Vercel Blob object exists. |
| Type errors appear after a successful build | Run `npm run typecheck`; builds currently ignore TypeScript errors. |
| CallRail changes a phone link unexpectedly | Review `PhoneLink`, `freezeHref`, and [`docs/callrail-phone-swap.md`](docs/callrail-phone-swap.md). |

---

## Documentation Index

- [`AGENTS.md`](AGENTS.md) - repository instructions, including the requirement to read the installed Next.js 16 documentation before framework changes.
- [`CLAUDE.md`](CLAUDE.md) - pointer to the repository instructions.
- [`docs/TBH Research-First Process SOP.md`](docs/TBH%20Research-First%20Process%20SOP.md) - research, QA, and approval responsibilities.
- [`docs/callrail-phone-swap.md`](docs/callrail-phone-swap.md) - CallRail phone-link behavior and operational caveats. Some historical source paths may require reconciliation with `src/lib/shared/phone.ts`.
- [`docs/schema/attribution_clicks.sql`](docs/schema/attribution_clicks.sql) - historical/manual attribution table reference; it mentions a matching endpoint that is not currently checked in.
- [`SUBSTANTIATION.md`](SUBSTANTIATION.md) - evidence and unresolved support for marketing claims.
- `docs/TBH Testimonial Tracker.xlsx` - testimonial operations artifact.
- `design-system/` - design-system presentations and reference assets.

Local files ignored by Git, including `tbh-main-audit.md` and `blogs-generation.md`, are not repository documentation and are intentionally not linked as shared operational sources.

---

## Known Security and Operational Risks

This section describes current implementation constraints, not desired policy. Resolve and remove entries as fixes are deployed and verified.

1. `/api/leads/retry` lacks an explicit server-side authentication, admin-role, reCAPTCHA, and rate-limit check.
2. Admin route gating occurs in client layouts; there is no request-boundary middleware. Deployed RLS is therefore critical.
3. `/admin/setup` is publicly reachable and depends on an external function whose source and bootstrap restrictions are not checked in.
4. Local testimonial thumbnail policy SQL grants writes to `public`, and testimonial assignment policy SQL permits any authenticated user rather than explicitly checking `admin`.
5. The complete deployed RLS/storage baseline is not reproducible from tracked repository migrations.
6. Lead reCAPTCHA verification is skipped when its secret is absent, and selected rate limits fail open when the Supabase RPC/storage path fails.
7. The cookie preference gates GA4 only. GTM, root Meta Pixel, Meta browser/CAPI Lead events, Google Ads conversions, CallRail, attribution beacons, and Vercel Analytics operate independently of the cookie choice.
8. `/api/video` is public and uses a privileged Blob token to list by caller-provided prefix.
9. Several privileged/admin Edge Functions are externally deployed or missing from the repository, so their auth and deployment configuration cannot be audited here.
10. Application, Edge Function, and Slack diagnostics can contain lead PII. Logs and webhook access must be restricted and retention reviewed.
11. CI omits lint, standalone typecheck, deployed RLS/storage checks, and browser E2E coverage; the production build ignores TypeScript errors.
12. Database schedules, Vercel environment mappings, Edge Function JWT settings, and parts of the schema baseline live outside version control.
13. If Supabase persistence fails while GHL is unconfigured, the lead endpoint currently returns HTTP 200 with warnings even though neither destination retained the lead.

---

## License

Private repository owned by the Tarek Buys Houses company. All rights reserved. No external contributions or redistribution are permitted.
