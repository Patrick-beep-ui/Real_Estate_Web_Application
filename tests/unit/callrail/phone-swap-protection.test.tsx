/**
 * Regression tests for the CallRail phone-swap fix.
 *
 * Contract being locked in:
 *   1. The phone number a visitor READS never changes, no matter what CallRail
 *      assigns or how many times React re-renders.
 *   2. The `tel:`/`sms:` href a visitor CLICKS is still swappable, so call
 *      attribution keeps working.
 *   3. `freezeHref` opts a link out of (2) as well.
 *   4. No phone-shaped literal exists outside src/lib/phone.ts, so coverage
 *      cannot silently regress when someone adds a page.
 *   5. Phone data read from a variable (`market.phone`, `PHONE.call`, a
 *      destructured `phone`) may only reach a visible JSX TEXT NODE through a
 *      `PhoneLink` / `PhoneText` wrapper — the hole that let `{market.phone}`
 *      slip through on the /markets cards, because (4) only sees literals.
 *
 * These run CallRail's real traversal rules — see callrail-swap-vendor.ts.
 */

import fs from "fs";
import path from "path";
import ts from "typescript";
import React, { useState } from "react";
import { render, screen, act } from "@testing-library/react";
import PhoneLink from "@/components/shared/PhoneLink";
import PhoneText from "@/components/shared/PhoneText";
import { PHONE, buildTelLink, buildSmsLink } from "@/lib/shared/phone";
import { runSessionSwap, domTargets } from "./callrail-swap-vendor";
import MarketsHomePage from "@/app/markets/page";
import MarketsLocationPage from "@/app/markets/[location]/page";

// The markets pages use next/link and next/navigation. Keep Link a plain
// anchor and pin the [location] route to Tampa so the swap machinery can run
// against the real DOM.
jest.mock("next/link", () => ({
  __esModule: true,
  default: function Link({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return React.createElement("a", { href }, children);
  },
}));

jest.mock("next/navigation", () => ({
  useParams: jest.fn(() => ({ location: "tampa" })),
}));

// ── Variable-driven phone render guard ───────────────────────────────────────

type RenderOffender = { file: string; line: number; snippet: string };

/**
 * A phone value reaching a JSX **text node** is only safe inside a
 * `PhoneLink` / `PhoneText` wrapper. This catches interpolations that carry
 * phone data into visible text OUTSIDE those wrappers — the hole that let
 * `{market.phone}` ship on the /markets cards (no literal, so the Tier-1
 * literal scan below cannot see it).
 *
 * Implemented on the TypeScript AST (the real parser, so nesting, fragments,
 * ternaries-returning-JSX and `<script>` bodies are handled exactly):
 *  - A candidate is a `JsxExpression` sitting in the CHILDREN of a JSX
 *    element or fragment. Attribute positions (`href={telLink}`,
 *    `phone={PHONE.call}`, `aria-label`) are never inspected — CallRail
 *    rewrites text nodes and a fixed set of attrs, not arbitrary props.
 *  - An expression that EMBEDS further JSX (e.g.
 *    `{showCta ? <PhoneLink>{PHONE.call}</PhoneLink> : null}`) is not judged
 *    on its own text — the nested element's own child `JsxExpression` nodes
 *    are visited separately and judged at their real guard level.
 *  - Any spine of ancestors through a `PhoneLink` / `PhoneText` element (or
 *    `<script>` / `<noscript>`) means the text is guard/wrapper-protected and
 *    CallRail will not swap it — walk those children is skipped.
 *  - Member `.text` and bare `text` are NOT treated as phone data (too
 *    ambiguous); only `phone` / `phoneE164` / `textE164` are.
 *  - Function-parameter destructuring (`function X({ phone, text })`),
 *    object literals, and URL building in plain code produce no JSX
 *    expression node and are ignored by design — they never render a number.
 */
const PHONE_TEXT_ACCESSOR =
  /PHONE\.(call|callE164|text|textE164)|\.(phone|phoneE164|textE164)\b|\b(phone|phoneE164|textE164)\b/;

function detectUnguardedPhoneRenders(
  content: string,
  filePath: string
): RenderOffender[] {
  const offenders: RenderOffender[] = [];
  if (!filePath.endsWith(".tsx")) return offenders;

  const sf = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    ts.ScriptKind.TSX
  );

  const lineOf = (node: ts.Node): number =>
    ts.getLineAndCharacterOfPosition(sf, node.getStart(sf)).line + 1;

  const isTextExpression = (node: ts.JsxExpression): boolean =>
    node.parent.kind === ts.SyntaxKind.JsxElement ||
    node.parent.kind === ts.SyntaxKind.JsxFragment;

  const embedsJsx = (node: ts.Node): boolean => {
    let found = false;
    const scan = (n: ts.Node) => {
      if (
        ts.isJsxElement(n) ||
        ts.isJsxFragment(n) ||
        ts.isJsxSelfClosingElement(n)
      ) {
        found = true;
        return;
      }
      ts.forEachChild(n, scan);
    };
    ts.forEachChild(node, scan);
    return found;
  };

  const protectedByGuard = (node: ts.Node): boolean => {
    let p = node.parent;
    while (p) {
      if (ts.isJsxElement(p)) {
        const tag = p.openingElement.tagName.getText(sf).toLowerCase();
        if (
          tag === "phonelink" ||
          tag === "phonetext" ||
          tag === "script" ||
          tag === "noscript"
        ) {
          return true;
        }
      }
      if (p.kind === ts.SyntaxKind.SourceFile) break;
      p = p.parent;
    }
    return false;
  };

  const visit = (node: ts.Node) => {
    if (ts.isJsxExpression(node) && isTextExpression(node)) {
      const expr = node.expression;
      if (expr && !embedsJsx(expr)) {
        const text = expr.getText(sf);
        if (PHONE_TEXT_ACCESSOR.test(text) && !protectedByGuard(node)) {
          offenders.push({
            file: filePath,
            line: lineOf(node),
            snippet: text.slice(0, 80),
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sf);
  return offenders;
}

// Files permitted to contain phone data without rendering it through a guard:
// the single source of truth, the two guard components, and the internal
// admin UI (lead-submitted numbers from the database, never site numbers).
const EXEMPT = [
  path.join("lib", "shared", "phone.ts"),
  path.join("components", "shared", "PhoneLink.tsx"),
  path.join("components", "shared", "PhoneText.tsx"),
  path.join("components", "admin"),
];

function forEachSourceFile(
  root: string,
  onFile: (fullPath: string, relative: string, content: string) => void
) {
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!/\.tsx?$/.test(entry.name)) continue;
      if (EXEMPT.some((ex) => full.includes(ex))) continue;
      onFile(full, path.relative(root, full), fs.readFileSync(full, "utf8"));
    }
  };
  walk(root);
}

/** A tracking number CallRail might hand out for the call line. */
const TRACKING_CALL = "8005551234";
/** A tracking number CallRail might hand out for the text line. */
const TRACKING_TEXT = "8005559876";

const ASSIGNMENTS = {
  "8664073411": TRACKING_CALL,
  "9492952842": TRACKING_TEXT,
};

describe("PhoneLink", () => {
  it("keeps the displayed number canonical after a CallRail swap", () => {
    render(
      <PhoneLink href={buildTelLink()}>Call {PHONE.call}</PhoneLink>
    );

    runSessionSwap(ASSIGNMENTS);

    expect(document.body.textContent).toContain(PHONE.call);
    expect(document.body.textContent).not.toContain("800");
  });

  it("still lets CallRail swap the tel: href, so attribution survives", () => {
    const { container } = render(
      <PhoneLink href={buildTelLink()}>Call {PHONE.call}</PhoneLink>
    );
    const anchor = container.querySelector("a")!;

    expect(anchor.getAttribute("href")).toBe("tel:+18664073411");

    runSessionSwap(ASSIGNMENTS);

    expect(anchor.getAttribute("href")).toBe(`tel:+1${TRACKING_CALL}`);
    // ...while the label is untouched.
    expect(anchor.textContent).toContain(PHONE.call);
  });

  it("swaps the sms: href but not the sms label", () => {
    const { container } = render(
      <PhoneLink href={buildSmsLink()}>Text {PHONE.text}</PhoneLink>
    );
    const anchor = container.querySelector("a")!;

    runSessionSwap(ASSIGNMENTS);

    expect(anchor.getAttribute("href")).toContain(`sms:+1${TRACKING_TEXT}`);
    // The prefilled body must survive the swap intact.
    expect(anchor.getAttribute("href")).toContain("body=");
    expect(anchor.textContent).toContain(PHONE.text);
  });

  it("freezeHref also protects the href", () => {
    const { container } = render(
      <PhoneLink href={buildTelLink()} freezeHref>
        {PHONE.call}
      </PhoneLink>
    );
    const anchor = container.querySelector("a")!;

    runSessionSwap(ASSIGNMENTS);

    expect(anchor.getAttribute("href")).toBe("tel:+18664073411");
    expect(anchor.textContent).toContain(PHONE.call);
  });

  it("survives a swap followed by a parent re-render", () => {
    function Harness() {
      const [step, setStep] = useState(1);
      return (
        <div>
          <button onClick={() => setStep((s) => s + 1)}>next</button>
          <span>step {step}</span>
          <PhoneLink href={buildTelLink()}>Call {PHONE.call}</PhoneLink>
        </div>
      );
    }

    const { container } = render(<Harness />);
    runSessionSwap(ASSIGNMENTS);

    const anchor = container.querySelector("a")!;
    expect(anchor.getAttribute("href")).toBe(`tel:+1${TRACKING_CALL}`);

    // Step through the form the way a visitor would.
    act(() => {
      screen.getByText("next").click();
    });

    // Display still ours...
    expect(anchor.textContent).toContain(PHONE.call);
    // ...and React must not have clobbered CallRail's tracking href, because
    // the href prop it renders is identical to what it rendered before.
    expect(container.querySelector("a")!.getAttribute("href")).toBe(
      `tel:+1${TRACKING_CALL}`
    );
  });

  it("does not offer the display text to CallRail as a swap target", () => {
    const { container } = render(
      <PhoneLink href={buildTelLink()}>Call {PHONE.call}</PhoneLink>
    );

    const targets = domTargets(container);

    // The href digits are discoverable (that is how the tracking number gets
    // assigned)...
    expect(targets).toContain("8664073411");
    // ...but the visible text node was never traversed, so it is not reported
    // twice and never gets its own assignment.
    const textNodeOnly = domTargets(
      container.querySelector("[data-calltrk-noswap]")!
    );
    expect(textNodeOnly).toEqual([]);
  });

  it("passes through arbitrary anchor props (onClick, aria-label)", () => {
    const onClick = jest.fn();
    const { container } = render(
      <PhoneLink href={buildTelLink()} onClick={onClick} aria-label="Call us">
        Call
      </PhoneLink>
    );
    const anchor = container.querySelector("a")!;

    expect(anchor.getAttribute("aria-label")).toBe("Call us");
    act(() => {
      anchor.click();
    });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("keeps the wrapper out of layout so flex spacing is unchanged", () => {
    const { container } = render(
      <PhoneLink href={buildTelLink()} className="inline-flex gap-2">
        <svg />
        Call {PHONE.call}
      </PhoneLink>
    );
    const wrapper = container.querySelector("[data-calltrk-noswap]") as HTMLElement;
    expect(wrapper.style.display).toBe("contents");
  });
});

describe("PhoneText", () => {
  it("protects a number that has no surrounding link", () => {
    render(
      <p>
        Phone: <PhoneText>{PHONE.call}</PhoneText>
      </p>
    );

    runSessionSwap(ASSIGNMENTS);

    expect(document.body.textContent).toContain(PHONE.call);
    expect(document.body.textContent).not.toContain(TRACKING_CALL);
  });
});

describe("unprotected number regression guard", () => {
  it("has no phone-shaped literals outside src/lib/phone.ts", () => {
    const srcRoot = path.join(process.cwd(), "src");
    const PHONE_SHAPED = /\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}|\+1\d{10}/;

    const offenders: string[] = [];
    forEachSourceFile(srcRoot, (_full, relative, content) => {
      const lines = content.split(/\r?\n/);
      lines.forEach((line, i) => {
        // Input placeholders are attributes CallRail never swaps.
        if (/placeholder/.test(line)) return;
        if (PHONE_SHAPED.test(line)) {
          offenders.push(`${relative}:${i + 1}  ${line.trim()}`);
        }
      });
    });

    expect(offenders).toEqual([]);
  });
});

describe("variable-driven phone render guard", () => {
  describe("scanner", () => {
    const cases: {
      name: string;
      source: string;
      expected: "clean" | "flagged";
      line?: number;
    }[] = [
      {
        name: "flags a bare {market.phone} in a paragraph (the /markets bug)",
        source: '<p className="text-xs">{market.phone}</p>',
        expected: "flagged",
        line: 1,
      },
      {
        name: "flags a bare {PHONE.call} text node in a raw anchor",
        source: '<a href="tel:+19492952842">Call {PHONE.call}</a>',
        expected: "flagged",
        line: 1,
      },
      {
        name: "flags a member accessor outside a guard",
        source: "<p>{market.textE164}</p>",
        expected: "flagged",
        line: 1,
      },
      {
        name: "flags phone text inside a JSX fragment",
        source: "<>{PHONE.call}</>",
        expected: "flagged",
        line: 1,
      },
      {
        name: "respects line numbers across multiline text",
        source: ['<p className="x">', "  {market.phone}", "</p>"].join("\n"),
        expected: "flagged",
        line: 2,
      },
      {
        name: "accepts phone text wrapped in PhoneText",
        source: ["<PhoneText>", "  {market.phone}", "</PhoneText>"].join("\n"),
        expected: "clean",
      },
      {
        name: "accepts phone text inside PhoneLink children",
        source:
          '<PhoneLink href={buildTelLink()}><span className="x">Call {PHONE.call}</span></PhoneLink>',
        expected: "clean",
      },
      {
        name: "accepts phone data in attribute positions",
        source:
          '<a href={telLink} aria-label={`Call ${phone}`} title="Call us">Call</a>',
        expected: "clean",
      },
      {
        name: "accepts props flowing phone data down",
        source: '<HeroSection market={market} phone={PHONE.call} text={PHONE.text} />',
        expected: "clean",
      },
      {
        name: "ignores destructured props in plain code before the JSX",
        source:
          'export default function Foo({ market, phone, text }: Props) {\n  return <div />;\n}',
        expected: "clean",
      },
      {
        name: "ignores phone data built into a URL string",
        source:
          'const url = `sms:+19492952842?body=${encodeURIComponent(PHONE.textE164)}`;',
        expected: "clean",
      },
      {
        name: "ignores phone data inside a script/JSON-LD block",
        source: [
          '<script type="application/ld+json">',
          '  { "telephone": "+18664073411", "rating": 4.7 }',
          "</script>",
          "<p>fine</p>",
        ].join("\n"),
        expected: "clean",
      },
    ];

    it.each(cases)("$name", ({ source, expected, line }) => {
      const found = detectUnguardedPhoneRenders(source, "snippet.tsx");
      if (expected === "clean") {
        expect(found).toEqual([]);
      } else {
        expect(found.length).toBeGreaterThan(0);
        if (line !== undefined) expect(found[0].line).toBe(line);
      }
    });
  });

  it("finds no unguarded phone renders anywhere in src/", () => {
    const srcRoot = path.join(process.cwd(), "src");
    const offenders: RenderOffender[] = [];
    forEachSourceFile(srcRoot, (_full, relative, content) => {
      offenders.push(...detectUnguardedPhoneRenders(content, relative));
    });
    expect(offenders).toEqual([]);
  });
});

describe("markets pages stay swap-safe after a CallRail session swap", () => {
  it("/markets keeps the canonical number visible", () => {
    const { container } = render(<MarketsHomePage />);
    runSessionSwap(ASSIGNMENTS);

    expect(container.textContent).toContain(PHONE.call);
    expect(container.textContent).not.toContain("800");
  });

  it("/markets/[location] keeps the canonical number visible", () => {
    const { container } = render(<MarketsLocationPage />);
    runSessionSwap(ASSIGNMENTS);

    expect(container.textContent).toContain(PHONE.call);
    expect(container.textContent).not.toContain("800");
    // Every displayed number sits in a data-calltrk-noswap element.
    container.querySelectorAll("[data-calltrk-noswap]").forEach((el) => {
      expect(el.textContent).toBe(PHONE.call);
    });
  });
});
