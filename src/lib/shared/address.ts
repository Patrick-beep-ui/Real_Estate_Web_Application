export function parseAddress(addr: string) {
  const parts = addr.split(",").map((s) => s.trim());
  const street = parts[0] || addr;
  const city = parts[1] || "";
  let state = "";
  let zip = "";
  if (parts[2]) {
    const stateZip = parts[2].split(" ");
    zip = stateZip.pop() || "";
    state = stateZip.join(" ");
  }
  return { street, city, state, zip };
}

export type AddressSource =
  | "google_selected"
  | "server_places_selected"
  | "manual_confirmed"
  | "api_fallback"
  | "geocode_unavailable"
  | "user_override"
  | "server_geocoded";

export interface AddressMeta {
  source?: AddressSource;
  override?: boolean;
  canAdvance: boolean;
}

const US_STATES = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID",
  "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS",
  "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK",
  "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV",
  "WI", "WY", "DC", "AS", "GU", "MP", "PR", "VI",
]);

// USPS Publication 28 standard street-suffix vocabulary (full words and their
// standard abbreviations). A short hand-picked list here is a whack-a-mole
// problem: it silently rejects any real, complete address whose street type
// isn't on it (e.g. "Common", used by many CA master-planned communities —
// "43126 Lancashire Common, Temecula, CA 92592" was rejected for exactly
// this reason even though it's a real, Google-verifiable address).
const SUFFIX_WORDS = [
  "alley", "aly", "anex", "annex", "anx", "arcade", "arc", "avenue", "ave", "av",
  "bayoo", "bayou", "byu", "beach", "bch", "bend", "bnd", "bluff", "blf", "bluffs", "blfs",
  "bottom", "btm", "boulevard", "boul", "blvd", "branch", "brnch", "br", "bridge", "brdge", "brg",
  "brook", "brk", "brooks", "brks", "burg", "bg", "burgs", "bgs", "bypass", "bypa", "byp",
  "camp", "cp", "canyon", "cnyn", "cyn", "cape", "cpe", "causeway", "cswy",
  "center", "cent", "ctr", "centers", "ctrs", "circle", "circ", "cir", "circles", "cirs",
  "cliff", "clf", "cliffs", "clfs", "club", "clb", "common", "cmn", "commons", "cmns",
  "corner", "cor", "corners", "cors", "course", "crse", "court", "crt", "ct", "courts", "cts",
  "cove", "cv", "coves", "cvs", "creek", "crk", "crescent", "cres", "crsent", "crsnt",
  "crest", "crst", "crossing", "crssng", "xing", "crossroad", "xrd", "crossroads", "xrds", "curve", "curv",
  "dale", "dl", "dam", "dm", "divide", "div", "dv", "drive", "driv", "drv", "dr", "drives", "drs",
  "estate", "est", "estates", "ests", "expressway", "expr", "expw", "expy",
  "extension", "extn", "extnsn", "ext", "extensions", "exts", "fall", "falls", "fls",
  "ferry", "frry", "fry", "field", "fld", "fields", "flds", "flat", "flt", "flats", "flts",
  "ford", "frd", "fords", "frds", "forest", "frst", "forge", "forg", "frg", "forges", "frgs",
  "fork", "frk", "forks", "frks", "fort", "frt", "ft", "freeway", "freewy", "frwy", "fwy",
  "garden", "gdn", "gardens", "gdns", "gateway", "gatway", "gtwy", "glen", "gln", "glens", "glns",
  "green", "grn", "greens", "grns", "grove", "grov", "grv", "groves", "grvs",
  "harbor", "harbr", "hbr", "harbors", "hbrs", "haven", "hvn",
  "heights", "ht", "hts", "highway", "highwy", "hway", "hwy", "hill", "hl", "hills", "hls",
  "hollow", "hollows", "holw", "holws", "inlet", "inlt",
  "island", "is", "islnd", "islands", "islnds", "iss", "isle", "isles",
  "jction", "jctn", "junction", "jct", "junctions", "jcts",
  "key", "ky", "keys", "kys", "knoll", "knl", "knolls", "knls",
  "lake", "lk", "lakes", "lks", "land", "landing", "lndg", "lane", "ln",
  "light", "lgt", "lights", "lgts", "loaf", "lf", "lock", "lck", "locks", "lcks",
  "lodge", "ldge", "lodg", "ldg", "loop", "loops",
  "mall", "manor", "mnr", "manors", "mnrs", "meadow", "mdw", "meadows", "mdws", "mews",
  "mill", "ml", "mills", "mls", "mission", "missn", "msn", "motorway", "mtwy",
  "mount", "mt", "mnt", "mountain", "mntain", "mtin", "mtn", "mountains", "mtns",
  "neck", "nck", "orchard", "orchrd", "orch", "oval", "ovl", "overpass", "opas",
  "park", "prk", "parks", "parkway", "parkwy", "pkway", "pky", "pkwy", "parkways", "pkwys",
  "pass", "passage", "psge", "path", "paths", "pike", "pikes", "pine", "pne", "pines", "pnes",
  "place", "pl", "plain", "pln", "plains", "plns", "plaza", "plza", "plz",
  "point", "pt", "points", "pts", "port", "prt", "ports", "prts", "prairie", "prr",
  "radial", "radiel", "radl", "ramp", "ranch", "ranches", "rnch",
  "rapid", "rpd", "rapids", "rpds", "rest", "rst", "ridge", "rdge", "rdg", "ridges", "rdgs",
  "river", "rivr", "riv", "road", "rd", "roads", "rds", "route", "rte", "row", "rue", "run",
  "shoal", "shl", "shoals", "shls", "shore", "shr", "shores", "shrs", "skyway", "skwy",
  "spring", "spng", "spg", "springs", "spngs", "spgs", "spur", "spurs",
  "square", "sqr", "sqre", "squ", "sq", "squares", "sqrs", "sqs",
  "station", "statn", "stn", "sta", "stravenue", "strav", "straven", "strvn", "strvnue", "stra",
  "stream", "streme", "strm", "street", "strt", "st", "str", "streets", "sts",
  "summit", "sumit", "sumitt", "smt", "terrace", "terr", "ter",
  "throughway", "trwy", "trace", "traces", "trce", "track", "tracks", "trak", "trk", "trks",
  "trafficway", "trfy", "trail", "trails", "trl", "trls", "trailer", "trlr", "trlrs",
  "tunnel", "tunel", "tunl", "tunls", "tunnels", "tunnl", "turnpike", "turnpk", "tpke",
  "underpass", "upas", "union", "un", "unions", "uns",
  "valley", "vally", "vlly", "vly", "valleys", "vlys", "viaduct", "vdct", "viadct", "via",
  "view", "vw", "views", "vws", "village", "villag", "villg", "villiage", "vlg", "villages", "vlgs",
  "ville", "vl", "vista", "vist", "vst", "vsta", "vis", "walk", "walks", "wall", "way", "wy", "ways",
  "well", "wl", "wells", "wls",
];
const STREET_SUFFIX = new RegExp(`^(?:${SUFFIX_WORDS.join("|")})$`, "i");

/**
 * Full US-address format check — no network. This is the strict gate for
 * typed (non-Google) input: it requires a street number, street name, street
 * suffix, city, 2-letter state and ZIP so incomplete submissions ("street,
 * Tampa, FL 33612", "123 Main St") fail here. The server additionally runs a
 * Google Geocoding API call as the authority (rescues legitimate format-edge
 * cases like ZIP-less or PO Box addresses); the client uses this when Maps is
 * unavailable to block clearly-incomplete typed input. Google-selected
 * addresses bypass this on the server — they come from a real Google place.
 */
export function validateAddressShape(addr: string): boolean {
  const trimmed = (addr || "").trim();
  if (trimmed.length < 6) return false;

  const tokens = trimmed.split(/[\s,]+/).filter(Boolean);
  if (tokens.length < 3) return false;

  // 1) Leading street number (e.g. "1234B Main St…")
  if (!/^\d{1,6}[A-Za-z]?$/.test(tokens[0])) return false;

  // 2) A street-suffix token
  const streetSuffixIndex = tokens.findIndex((t) => STREET_SUFFIX.test(t.replace(/\.+$/, "")));
  if (streetSuffixIndex === -1) return false;

  // 3) ZIP must be the LAST token (5 digits, optional +4). Searching the raw
  //    string/tokens for the first 5-digit run is wrong: it matches a 5-digit
  //    house number before it ever reaches the real ZIP — very common in CA
  //    ("19075 Oceanport Ln...", "73951 White Sands Dr..."), which was
  //    silently rejecting valid, complete addresses.
  const zipTokenIndex = tokens.length - 1;
  const zipToken = tokens[zipTokenIndex].replace(/\.+$/, "");
  if (!/^\d{5}(?:-\d{4})?$/.test(zipToken)) return false;

  // 4) A valid 2-letter US state directly before the ZIP
  const stateTokenIndex = zipTokenIndex - 1;
  if (stateTokenIndex <= streetSuffixIndex) return false;
  const stateToken = tokens[stateTokenIndex];
  if (!/^[A-Za-z]{2}$/.test(stateToken) || !US_STATES.has(stateToken.toUpperCase())) return false;

  // 5) A city token must appear after the street suffix and before the state.
  //    This prevents a street name from satisfying the city requirement.
  return tokens
    .slice(streetSuffixIndex + 1, stateTokenIndex)
    .some((t) => /^[A-Za-z]{2,}$/.test(t));
}
