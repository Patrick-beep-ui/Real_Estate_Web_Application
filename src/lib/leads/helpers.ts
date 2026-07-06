import { parseAddress } from "@/lib/address";

export function maskPhone(phone: string): string {
  return phone.length >= 4 ? `***${phone.slice(-4)}` : "****";
}

export function maskEmail(email: string): string {
  const at = email.indexOf("@");
  return at > 0 ? `***@${email.slice(at + 1)}` : "***";
}

export function splitName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  const firstSpace = trimmed.indexOf(" ");
  if (firstSpace === -1) return { firstName: trimmed, lastName: "" };
  return {
    firstName: trimmed.substring(0, firstSpace),
    lastName: trimmed.substring(firstSpace + 1).trim(),
  };
}

export function areAddressesDifferent(
  existing: { address1?: string; city?: string; state?: string; postalCode?: string },
  submitted: string | undefined | null
): boolean | null {
  if (!submitted || !submitted.trim()) return null;
  const parsed = parseAddress(submitted);
  const eStreet = (existing.address1 || "").toLowerCase().trim();
  const eCity = (existing.city || "").toLowerCase().trim();
  const eState = (existing.state || "").toLowerCase().trim();
  const eZip = (existing.postalCode || "").toLowerCase().trim();
  const pStreet = parsed.street.toLowerCase().trim();
  const pCity = parsed.city.toLowerCase().trim();
  const pState = parsed.state.toLowerCase().trim();
  const pZip = parsed.zip.toLowerCase().trim();
  if (!eStreet && !eCity && !eState && !eZip) return null;
  return eStreet !== pStreet || eCity !== pCity || eState !== pState || eZip !== pZip;
}

export function buildErrorData(
  leadData: any,
  code: string,
  message: string,
  details?: string,
  retryBatchId?: string,
  extra?: Record<string, any>
) {
  return {
    name: leadData.name || null,
    phone: leadData.phone || null,
    email: leadData.email || null,
    market_slug: leadData.market_slug || null,
    situation_slug: leadData.situation_slug || null,
    source: leadData.source || null,
    property_address: leadData.property_address || null,
    error_code: code,
    error_message: message,
    error_details: details || null,
    payload: leadData,
    retry_batch_id: retryBatchId,
    ...extra,
  };
}
