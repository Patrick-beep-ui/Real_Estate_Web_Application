export function getTrafficSourceLabel(data: {
  utm_source?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
  msclkid?: string | null;
}): string {
  if (data.gclid || data.utm_source === "adwords") return "Google Ads";
  if (data.fbclid || data.utm_source === "facebook" || data.utm_source === "meta") return "Meta Ads";
  if (data.msclkid) return "Microsoft Ads";
  return "Direct / Organic";
}
