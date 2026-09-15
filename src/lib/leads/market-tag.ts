/**
 * Single shared source of truth for the human-facing market/location values
 * shown in GHL, Slack and the admin lead detail view — used by BOTH the GHL
 * payload builder and the Slack notifier so they can never again show two
 * different things for the same lead.
 *
 * Two independent concepts live here:
 *
 * 1. `resolveMarketDisplayTag` — the PROPERTY MARKET for a lead, derived
 *    STRICTLY from the property address (never the URL slug or the visitor's
 *    location). Falls back to the direct state from the address when the
 *    property is outside every market's service area.
 *
 * 2. `resolveSellerLocationTag` / `resolveSellerLocationLabel` — the SELLER's
 *    location (region/country/state), source-independent, based on the
 *    detected seller_country / seller_state.
 *
 * `market_slug` itself is intentionally left untouched everywhere else in the
 * app (landing pages, admin filters, analytics) — these helpers only affect
 * the human-facing tag/label shown in GHL, Slack, and the admin lead detail
 * view. `market_slug` remains the literal lander the visitor reached (`"home"`
 * for the homepage), `seller_location` the visitor's detected location, and
 * `market_location` the property's market.
 */

import { classifyCountryRegion, REGION_LABELS } from "@/lib/geo/region-data";
import { parseAddress, normalizeStateToCode } from "@/lib/shared/address";
import { lookupCityMarket } from "@/lib/geo/market-cities";
import { MARKETS } from "@/lib/data/markets";

function isNonUsCountryCode(countryCode: string | null | undefined): countryCode is string {
  return typeof countryCode === "string" && /^[A-Za-z]{2}$/.test(countryCode) && countryCode.toUpperCase() !== "US";
}

/** Full country name for a 2-letter ISO code, or null if it can't be resolved. */
function countryName(countryCode: string): string | null {
  try {
    const name = new Intl.DisplayNames(["en"], { type: "region" }).of(countryCode.toUpperCase());
    return name && name !== countryCode.toUpperCase() ? name : null;
  } catch {
    return null;
  }
}

/**
 * Resolve the "Property Market" value shown in GHL / Slack for a lead. The
 * market is detected STRICTLY from the property address — parsed locally with
 * `parseAddress`, matched against the available markets' service areas via
 * `lookupCityMarket` — NOT from the visited landing page's URL slug and NOT
 * from the visitor's location. The match is displayed as the market's human
 * label (e.g. "Tampa Bay", not the `tampa` slug). When the property falls
 * outside every market's service area (or no market can be resolved for the
 * parsed city), the value falls back to the direct state taken from the
 * address. Returns null only when no address is given or no city/state can be
 * parsed at all.
 */
export function resolveMarketDisplayTag(
  propertyAddress: string | null | undefined
): string | null {
  const address = (propertyAddress || "").trim();
  if (!address) return null;

  const parsed = parseAddress(address);
  const rawState = parsed.state.trim() || null;
  const stateCode = normalizeStateToCode(rawState);

  const marketSlug = lookupCityMarket(parsed.city || null, stateCode ?? rawState);
  if (marketSlug) {
    const config = MARKETS[marketSlug];
    return config ? config.name : marketSlug;
  }

  return rawState;
}

/**
 * The `seller_location` GHL tag for any lead, source-independent (homepage
 * AND landing pages). Uses the visitor's detected country/state (NOT the
 * property address): Central America / South America / Asia countries
 * collapse to the region label, everything else (Canada, Mexico, ...) uses
 * its full country name, and US (or unknown country) leads fall back to
 * `sellerState`. Never falls back to `market_slug`.
 */
export function resolveSellerLocationTag(
  sellerState: string | null | undefined,
  sellerCountry: string | null | undefined
): string {
  if (isNonUsCountryCode(sellerCountry)) {
    const region = classifyCountryRegion(sellerCountry);
    if (region) return REGION_LABELS[region];

    const country = countryName(sellerCountry);
    if (country) return country;
  }
  return sellerState?.trim() || "unknown";
}

/**
 * Resolve the human-readable "Seller Location" string. For US leads (or
 * when there's no country on file), this is just `sellerState` unchanged.
 * For homepage leads outside the US, combines state/department + country
 * as "Managua / Nicaragua" so the country isn't lost. The underlying
 * seller_state / seller_country columns are never modified — this is a
 * display-only combination, computed fresh wherever it's shown.
 */
export function resolveSellerLocationLabel(
  sellerState: string | null | undefined,
  sellerCountry: string | null | undefined,
  source: string | null | undefined
): string | null {
  const state = sellerState?.trim() || null;

  if (source !== "homepage" || !isNonUsCountryCode(sellerCountry)) {
    return state;
  }

  const country = countryName(sellerCountry);
  if (!country) return state;
  if (!state) return country;

  return `${state} / ${country}`;
}
