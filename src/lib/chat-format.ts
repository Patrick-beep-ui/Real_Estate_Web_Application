import { normalizePhone } from "@/lib/phone";

const PHONE_REGEX = /(?:\+1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}/g;

export function makePhoneLink(phoneNumber: string): string {
  const e164 = normalizePhone(phoneNumber);
  return `[${phoneNumber}](tel:${e164})`;
}

export function formatPhones(text: string): string {
  if (!text) return text;
  return text.replace(PHONE_REGEX, (match) => makePhoneLink(match.trim()));
}
