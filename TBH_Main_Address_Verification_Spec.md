# Address Verification — Fix Spec

**Repo:** `Divorce_Site_Perfect_Lovable_Project` (tarekbuyshouses.com) · Next.js App Router
**Trigger:** lead `Marc Tahler`, 30 Aug 19:19 GMT-6, `property_address: "21031n"`, submitted from `/landing/california`, returned 200 and synced to GHL
**Decision:** verify server-side; allow a deliberate override; flag the lead when overridden

---

## 1 · Root cause

Three things combined. Only the third makes it possible; the first two make it likely.

**The client rule is not "did the user select a suggestion."** It is "are prediction rows on screen right now."

`src/components/leads/AddressAutocomplete.tsx:134–138`

```ts
const pacContainer = document.querySelector(".pac-container");
const items = pacContainer.querySelectorAll(".pac-item");
setSuggestionsVisible(items.length > 0);
```

At line 287, `suggestionsVisible === false` renders a **"Confirm this address"** button instead of the "Please select from the suggestions above" hint. `handleManualConfirm` (line 245) then pushes the raw input string to the parent with no check of any kind.

`21031n` matches no US street address under `types: ["address"]` + `componentRestrictions: { country: "us" }`, so Google returned nothing, the container emptied, and the form offered to accept it. **The service was working. The code treats "no matches" and "service is down" identically.**

**There is also a race.** `checkForSuggestionsDebounced` (line 146) waits 350 ms after the last keystroke while Google's prediction fetch runs independently. In that gap the confirm button is on screen even for an address that would have matched.

**And nothing downstream checks.** `/api/leads/submit` validates phone (line 99) and email (line 103); `property_address` is written through at line 42. Whatever the client sends is stored and synced. `src/lib/leads/ghl.ts:62,128` then runs it through `parseAddress`, so `21031n` reached GHL as `street: "21031n"` with empty city, state and ZIP.

---

## 2 · Principle

**Client-side rules cannot deliver "never again."** Six components already mount `AddressAutocomplete` — `contact/page.tsx`, `FinalCTA`, `HomeLeadForm`, `StickyMobileCTA`, `market/HeroSection`, `ExitIntentPopup` — and a seventh can be added without the guard. Everything funnels through `/api/leads/submit`, so that is where enforcement belongs. The client changes below are for user experience; the server change is the one that makes the guarantee.

---

## 3 · Changes

### 3.1 · Address validation module — `src/lib/shared/addressValidation.ts` (new)

Do **not** extend `parseAddress` in `src/lib/shared/address.ts`. It is a comma-splitter, not a validator, and `ghl.ts` and `helpers.ts` both depend on its current behaviour.

Two exports:

**`validateAddressShape(addr: string): boolean`** — structural, no network. Requires a leading street number, at least one alphabetic street token, and a city or a state/ZIP. `"21031n"` fails all three.

**`verifyAddress(addr: string): Promise<VerifyResult>`** — server-only. Calls Google Geocoding and returns:

```ts
type VerifyResult =
  | { status: 'verified'; normalized: string; components: {...} }
  | { status: 'unverifiable' }           // geocoded, but not to street level
  | { status: 'service_unavailable' }    // quota, denied, network, timeout
```

Accept only results carrying both `street_number` and `route` at `ROOFTOP` or `RANGE_INTERPOLATED` precision. A ZIP or locality centroid is `unverifiable`.

> **New environment variable required.** The existing key is `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — browser-exposed and referrer-restricted, so it cannot be used server-side. Provision a separate server-only key, IP-restricted, Geocoding API only. There is no geocoding anywhere in the codebase today.

### 3.2 · Verification endpoint — `src/app/api/address/verify/route.ts` (new)

`POST { address: string }` → the `VerifyResult` above. Used by the client before it will accept a manually typed address. Rate-limit it and reuse the existing reCAPTCHA gate if practical — it is a public endpoint that spends money per call.

### 3.3 · Server enforcement — `src/app/api/leads/submit/route.ts`

Insert after the email check (~line 103), matching the existing guard pattern:

1. Empty address → **400**, as today.
2. `address_override !== true` → run `validateAddressShape`, then `verifyAddress`.
   - `verified` → **replace** `property_address` with the normalized string; set `address_verified: true`, `address_source` from the client.
   - `unverifiable` → **422** with `{ error: 'ADDRESS_UNVERIFIED' }`. The client turns this into the override prompt.
   - `service_unavailable` → **accept**, set `address_verified: false`, `address_source: 'geocode_unavailable'`. Never lose a lead to our own outage.
3. `address_override === true` → accept, `address_verified: false`, `address_source: 'user_override'`.

A direct `POST` with `{ property_address: "x" }` and no override flag must return 422. That is the test that proves the guarantee holds.

### 3.4 · Client — `AddressAutocomplete.tsx`

**Carry the provenance.** The component already tracks `addressWasSelected`, `addressManuallyConfirmed` and `apiFailed`, then discards all three. Change the callback to `onChange(value, { source })` where source is `google_selected | manual_confirmed | api_fallback`. Thread it through each of the six call sites into the submit payload.

**Verify before confirming.** `handleManualConfirm` (line 245) currently accepts whatever is in the box. Point it at `/api/address/verify`:

- `verified` → accept the **normalized** address, show the confirmed state.
- `unverifiable` → do not accept. Show *"We couldn't find that address."*, then a second, separate control: *"Use it anyway — I confirm this is correct."* Only that second click sets `address_override: true` on the payload.
- `service_unavailable` → accept, mark `api_fallback`.

The two-step override is the whole point. `21031n` happened because someone clicked the obvious next button. Nobody fat-fingers through an explicit "this address couldn't be verified."

**Close the accidental door.** Replace the `.pac-container` DOM scrape with a real predictions call whose response you can read — status and count, not scraped nodes. That distinguishes the three cases the current code collapses into one: zero results, service failure, and request-in-flight. It also removes the 350 ms race, because you gate on request state rather than a timer.

Check what Google currently recommends before choosing an approach — the legacy `Autocomplete` widget is being phased out.

**While in the file:** move `cachedConfirmedAddress`, `cachedWasSelected` and `cachedManuallyConfirmed` off module scope (lines 7–9). They are singletons shared by all six components and will stomp each other if two ever mount together.

### 3.5 · Data and notification

Add to the leads table and `LeadData`:

| Column | Type | Values |
|---|---|---|
| `address_verified` | boolean | |
| `address_source` | text | `google_selected`, `manual_confirmed`, `api_fallback`, `geocode_unavailable`, `user_override` |

Slack (`notifySlack`) should render an explicit warning line when `address_verified` is false, naming the source. Diane should see it in the alert, not discover it in a Vercel log two days later.

---

## 4 · Acceptance tests

The fix is done when all eight pass.

1. `21031n` typed, no suggestions → confirm blocked, override prompt shown, nothing submitted on first click.
2. Override clicked → lead accepted, `address_verified: false`, `address_source: user_override`, Slack shows the warning.
3. `123 Fake St, Springfield, CA 90210` → passes shape, fails geocoding → override path.
4. Real address typed but never selected from the dropdown → geocodes → accepted, **stored normalized**, `manual_confirmed`.
5. Real address selected from the dropdown → accepted, `google_selected`, `address_verified: true`.
6. Maps script blocked at the network level → manual entry still possible → server still verifies → lead still lands.
7. **`curl -X POST /api/leads/submit` with `property_address: "x"` and no override → 422.**
8. Two forms mounted on one page (hero + exit-intent) → confirming one does not alter the other's state.

Test 7 is the one that matters. If it passes, no client regression can reintroduce this.

---

## 5 · Rollout

**Ship first:** 3.1 shape check + 3.3 server enforcement + 3.5 columns. This blocks the class of failure immediately and needs no new API key.

**Then:** 3.1 geocoding + 3.2 endpoint + 3.4 client override flow, once the server-only key is provisioned.

**Then:** the predictions rewrite and the module-scope cache. These are correctness cleanups, not prevention, and they touch the component every lead on the site flows through — worth scheduling rather than rushing.

---

## 6 · Backfill

Run once against Supabase to size the existing problem:

```sql
select id, created_at, property_address, market, source
from leads
where property_address is not null
  and property_address !~ '^[0-9]+[A-Za-z]?\s+[A-Za-z]'
order by created_at desc;
```

If this returns one row in four months, the predictions rewrite can wait. If it returns thirty, it cannot.

---

## 7 · Still to decide

- Whether the override should notify anyone beyond Slack — it is the deliberate hole in an otherwise closed system.
- Whether to re-verify and normalize the backfilled rows, or leave them and only enforce going forward.
- Whether `/api/address/verify` gets its own reCAPTCHA or rides the existing token.

---

*Read-only: nothing in either repository was modified. Line references are against `dev` as of 31 Aug 2026.*
