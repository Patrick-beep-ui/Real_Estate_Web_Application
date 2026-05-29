type GhlErrorMeta = {
  matchingField?: string;
  contactName?: string;
  contactId?: string;
};

const KNOWN_PATTERNS: Array<{
  match: string;
  build: (meta: GhlErrorMeta | undefined) => string;
}> = [
  {
    match: "does not allow duplicated contacts",
    build: (meta) =>
      `Duplicate contact detected — A contact with this ${meta?.matchingField || "field"} already exists in GHL`,
  },
];

export function describeGhlError(data: Record<string, unknown>): string {
  const message = typeof data.message === "string" ? data.message : "";
  const meta = data.meta as GhlErrorMeta | undefined;
  for (const p of KNOWN_PATTERNS) {
    if (message.includes(p.match)) return p.build(meta);
  }
  return message || "Unknown error";
}
