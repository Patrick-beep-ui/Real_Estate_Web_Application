export const CONTACT_EMAIL = "subscriptions@tarekbuyshouses.com" as const;

export function buildMailtoLink(email: string = CONTACT_EMAIL): string {
  return `mailto:${email}`;
}
