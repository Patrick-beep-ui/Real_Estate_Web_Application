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

/** Build an `sms:` href. Pass an empty body to omit the prefilled message. */
export function buildSmsLink(
  e164: string = PHONE.textE164,
  body: string = DEFAULT_SMS_BODY
): string {
  return body ? `sms:${e164}?body=${encodeURIComponent(body)}` : `sms:${e164}`;
}
