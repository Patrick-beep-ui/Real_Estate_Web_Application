/**
 * Single shared source of truth for how a non-US homepage lead's country
 * should be displayed — used by BOTH the GHL tag builder and the Slack
 * notifier so they can never again show two different things for the same
 * lead (GHL showing "Nicaragua" while Slack showed the Tampa fallback
 * market_slug was exactly this: two independent, disconnected computations
 * of "market" for the same lead).
 *
 * market_slug itself is intentionally left untouched everywhere else in the
 * app (landing pages, admin filters, analytics) — these helpers only affect
 * the human-facing tag/label shown in GHL, Slack, and the admin lead detail
 * view.
 */

import { classifyCountryRegion, REGION_LABELS } from "@/lib/geo/region-data";

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
 * Resolve the market tag to show in GHL/Slack for a lead. For US leads, or
 * any non-homepage source, this is just `marketSlug` — completely
 * unchanged from today. For homepage leads outside the US: Central
 * America / South America / Asia countries collapse to that region's
 * label; everything else (including Mexico and Canada) falls through to
 * its full country name, same as the original GHL-only behavior.
 */
export function resolveMarketDisplayTag(
  source: string | null | undefined,
  sellerCountry: string | null | undefined,
  marketSlug: string
): string {
  if (source !== "homepage" || !isNonUsCountryCode(sellerCountry)) {
    return marketSlug;
  }

  const region = classifyCountryRegion(sellerCountry);
  if (region) return REGION_LABELS[region];

  return countryName(sellerCountry) ?? marketSlug;
}

/**
 * The `seller_location` GHL tag for any lead, source-independent (homepage
 * AND landing pages). Takes the region/country detection that
 * `resolveMarketDisplayTag` does for the homepage and extends it to every
 * source: Central America / South America / Asia countries collapse to the
 * region label, everything else (Canada, Mexico, ...) uses its full country
 * name, and US (or unknown country) leads fall back to `sellerState`.
 * Never falls back to `market_slug`.
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
