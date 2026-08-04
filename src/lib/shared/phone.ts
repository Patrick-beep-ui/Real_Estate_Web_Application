/**
 * Single source of truth for the phone numbers displayed on the site.
 */

export const PHONE = {
  call: "(866) 407-3411",
  callE164: "+18664073411",
  text: "(949) 295-2842",
  textE164: "+19492952842",
} as const;

export const DEFAULT_SMS_BODY = "Hi Tarek, I need to sell my house";

/** Build a `tel:` href. */
export function buildTelLink(e164: string = PHONE.callE164): string {
  return `tel:${e164}`;
}

/** Normalize a US phone number to E.164 (+1XXXXXXXXXX) */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (phone.startsWith("+")) return phone;
  return `+${digits}`;
}

/** Build an `sms:` href. Pass an empty body to omit the prefilled message. */
export function buildSmsLink(
  e164: string = PHONE.textE164,
  body: string = DEFAULT_SMS_BODY
): string {
  return body ? `sms:${e164}?body=${encodeURIComponent(body)}` : `sms:${e164}`;
}

const OUTDATED_PATTERNS: [RegExp, string][] = [
  [/(\(949\)\s*678-2174)/g, PHONE.call],
]

export function sanitizeContactInfo(content: string): string {
  let result = content
  for (const [pattern, replacement] of OUTDATED_PATTERNS) {
    result = result.replace(pattern, replacement)
  }
  return result
}
