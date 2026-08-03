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
 *
 * These run CallRail's real traversal rules — see callrail-swap-vendor.ts.
 */

import fs from "fs";
import path from "path";
import React, { useState } from "react";
import { render, screen, act } from "@testing-library/react";
import PhoneLink from "@/components/shared/PhoneLink";
import PhoneText from "@/components/shared/PhoneText";
import { PHONE, buildTelLink, buildSmsLink } from "@/lib/phone";
import { runSessionSwap, domTargets } from "./callrail-swap-vendor";

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

    // Deliberately exempt:
    //  - lib/phone.ts        the single source of truth
    //  - components/shared/PhoneLink.tsx / PhoneText.tsx  numbers appear in the docs
    //  - components/admin/**  internal lead-management UI, shows lead phone
    //                         numbers from the database, never site numbers
    const EXEMPT = [
      path.join("lib", "phone.ts"),
      path.join("components", "shared", "PhoneLink.tsx"),
      path.join("components", "shared", "PhoneText.tsx"),
      path.join("components", "admin"),
    ];

    const offenders: string[] = [];

    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
          continue;
        }
        if (!/\.tsx?$/.test(entry.name)) continue;
        if (EXEMPT.some((ex) => full.includes(ex))) continue;

        const lines = fs.readFileSync(full, "utf8").split(/\r?\n/);
        lines.forEach((line, i) => {
          // Input placeholders are attributes CallRail never swaps.
          if (/placeholder/.test(line)) return;
          if (PHONE_SHAPED.test(line)) {
            offenders.push(
              `${path.relative(srcRoot, full)}:${i + 1}  ${line.trim()}`
            );
          }
        });
      }
    };

    walk(srcRoot);

    expect(offenders).toEqual([]);
  });
});
