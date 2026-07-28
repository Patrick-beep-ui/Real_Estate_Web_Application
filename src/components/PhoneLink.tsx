"use client";

import React from "react";

/**
 * A phone/SMS link whose VISIBLE NUMBER never changes, but whose href CallRail
 * is still allowed to swap — so call attribution keeps working.
 *
 * ── Why this works ──────────────────────────────────────────────────────────
 *
 * CallRail's swap.js does not go through React. It walks the real DOM
 * (`Dom.traverseDOM`) and writes directly to `Text.nodeValue` and via
 * `setAttribute`. That is why the previous `React.memo(..., () => true)`
 * approach could never work: memoisation only stops *React* from re-rendering,
 * which if anything makes CallRail's swap permanent.
 *
 * swap.js honours exactly one opt-out. From the traversal callback:
 *
 *   case 1:  // element node
 *     if (["SCRIPT","NOSCRIPT"].includes(e.tagName)
 *         || e.hasAttribute("data-calltrk-noswap")) return false;
 *     s(a, e);   // swaps src / srcset / title / phone attributes
 *     c(e);      // swaps href, if it matches tel: / sms: / imessage:
 *     break;
 *   case 3:  // text node
 *     ...swap the number in nodeValue...
 *
 * `recurseDOM` only descends into an element's children when the callback did
 * not return `false`. Because the check runs on ELEMENT nodes only, putting the
 * attribute on an inner wrapper instead of the anchor gives us both behaviours
 * at once:
 *
 *   <a href="tel:+18664073411">        <- visited: href IS swapped
 *     <span data-calltrk-noswap>       <- returns false: recursion stops here
 *       (866) 407-3411                 <- text node never reached: stays ours
 *     </span>
 *   </a>
 *
 * Net effect: the number the visitor READS is always ours; the number they
 * DIAL is CallRail's tracking number.
 *
 * The same traversal powers `Dom.domTargets`, so the display text is never even
 * offered to CallRail as a swap target — only the href's digits are, which is
 * what gets a session number assigned.
 *
 * ── Placement rule (important) ──────────────────────────────────────────────
 *
 * The attribute MUST sit on, or inside, the element React mounts. CallRail's
 * MutationObserver passes the newly added node as the traversal root:
 *
 *   Dom.mutationCallback -> CallTrkSwap.startSourceSwap(addedNode)
 *
 * so a `data-calltrk-noswap` on a distant ancestor such as <body> or <main> is
 * bypassed entirely for anything rendered after hydration (form step changes,
 * sticky CTA, exit-intent popup). Never rely on ancestor placement.
 *
 * ── Layout ──────────────────────────────────────────────────────────────────
 *
 * `display: contents` keeps the wrapper out of layout, so flex/grid anchors
 * (`inline-flex items-center gap-2`) still treat the icon and the text as
 * direct children and spacing is unchanged.
 */

const NOSWAP_STYLE: React.CSSProperties = { display: "contents" };

interface PhoneLinkProps
  extends Omit<React.ComponentPropsWithoutRef<"a">, "href"> {
  href: string;
  /**
   * Also block CallRail from swapping the href, by hoisting the attribute onto
   * the anchor itself. Reach for this if an assigned tracking number is not
   * SMS-capable and breaks texting — at the cost of attribution for that link.
   */
  freezeHref?: boolean;
  children: React.ReactNode;
}

export default function PhoneLink({
  href,
  freezeHref = false,
  children,
  ...rest
}: PhoneLinkProps) {
  if (freezeHref) {
    return (
      <a href={href} data-calltrk-noswap="" {...rest}>
        {children}
      </a>
    );
  }

  return (
    <a href={href} {...rest}>
      <span data-calltrk-noswap="" style={NOSWAP_STYLE}>
        {children}
      </span>
    </a>
  );
}