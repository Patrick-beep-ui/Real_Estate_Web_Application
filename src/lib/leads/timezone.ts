import { readGeoCache } from "@/lib/geo/ipinfo";

const IANA_TZ_REGEX = /^(?:[A-Za-z_+.-]+\/[A-Za-z_+.-]+|UTC|GMT)$/;

export function isValidIanaTz(tz: string | null | undefined): tz is string {
  return typeof tz === "string" && tz.length <= 64 && IANA_TZ_REGEX.test(tz) && !/\s/.test(tz);
}

export function captureBrowserTimezone(): { tz_browser: string | null } {
  try {
    const resolved = Intl.DateTimeFormat().resolvedOptions();
    return { tz_browser: resolved.timeZone && isValidIanaTz(resolved.timeZone) ? resolved.timeZone : null };
  } catch {
    return { tz_browser: null };
  }
}

export function readIpTimezoneFallback(): string | null {
  const cached = readGeoCache();
  return isValidIanaTz(cached?.timezone) ? cached!.timezone : null;
}
