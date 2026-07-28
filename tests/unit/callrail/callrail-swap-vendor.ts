/* eslint-disable */
/**
 * VERBATIM excerpts from CallRail's swap.js (the minified production bundle
 * served from cdn.callrail.com/companies/618641779/.../12/swap.js), expanded for
 * readability but with NO behavioural changes.
 *
 * Only the pieces that decide whether a number gets rewritten are reproduced:
 * `Dom.recurseDOM`, `Dom.traverseDOM`, `Dom.domEach`, `Dom.domTargets` and
 * `Replacer.standardReplace` / `Replacer.NUM_REGEX`.
 *
 * The point of copying rather than hand-rolling an approximation is that the
 * tests then assert against the vendor's real traversal rules — including the
 * `data-calltrk-noswap` early return and the fact that the href branch runs
 * BEFORE recursion descends into children. If CallRail ever changes those
 * semantics, this file is the thing to re-sync.
 */

type SwapFn = (value: string, attrName?: string) => string | undefined | null;

// ── Replacer ────────────────────────────────────────────────────────────────

export const CHAR_SEP = "([-. " + String.fromCharCode(160) + "]?)";

export const NUM_REGEX = new RegExp(
  "(\\(?)\\d{3}(\\))?" + CHAR_SEP + "\\d{3}" + CHAR_SEP + "\\d{4}\\b",
  "g"
);

let _numberRegexCache: Record<string, [string, RegExp, string]> = {};

export function resetRegexCache() {
  _numberRegexCache = {};
}

/** Replacer.standardReplace — swaps `target` (10 digits) for `replacement`. */
export function standardReplace(
  str: string,
  target: string,
  replacement: string
): string {
  if (!_numberRegexCache[target]) {
    const first = target.substring(0, 3);
    const mid = target.substring(3, 6);
    const last = target.substring(6, 10);
    const pattern =
      "(\\(?)" + first + "(\\))?" + CHAR_SEP + mid + CHAR_SEP + last;
    const sub =
      "$1" +
      replacement.substring(0, 3) +
      "$2$3" +
      replacement.substring(3, 6) +
      "$4" +
      replacement.substring(6, 10);
    _numberRegexCache[target] = [last, new RegExp(pattern, "g"), sub];
  }

  const cached = _numberRegexCache[target];
  if (str.indexOf(cached[0]) > -1) {
    str = str.replace(cached[1], cached[2]);
  }
  return str;
}

/** ScanString.stringTargets */
export function stringTargets(str: string): string[] {
  return (str && str.match(NUM_REGEX)) || [];
}

// ── Dom ─────────────────────────────────────────────────────────────────────

/** Dom.domEach */
function domEach(selector: string, fn: (el: Element) => void) {
  const nodes = document.querySelectorAll(selector);
  for (let i = 0; i < nodes.length; i++) fn(nodes[i]);
}

/**
 * Dom.recurseDOM
 *
 * Note the control flow: `s` (the node to descend into) is only assigned when
 * the callback did NOT return false. That single line is what makes
 * `data-calltrk-noswap` protect an entire subtree.
 */
function recurseDOM(
  root: Node,
  fn: (node: Node) => boolean | void,
  start?: Node
) {
  let node: Node | null | undefined = start || root;
  const ELEMENT_NODE = 1;

  while (node) {
    let next: Node | null | undefined = null;

    if (
      !(
        false === fn(node) ||
        (node.nodeType !== ELEMENT_NODE && !(node as Element).shadowRoot)
      )
    ) {
      next = (node as Element).shadowRoot
        ? (node as Element).shadowRoot?.firstChild
        : node.firstChild;
    }

    if (node.nextSibling && node !== root) {
      recurseDOM(root, fn, node.nextSibling);
    }

    node = next;
  }
}

/** Dom.traverseDOM */
export function traverseDOM(swap: SwapFn, root: Node) {
  const SWAPPED_ATTRS = ["src", "srcset", "title", "phone"];
  const HREF_SCHEMES =
    /(\bclk[ng]\/(sms|tel|imessage))|(^(sms|tel|imessage))/i;

  const swapAttr = (el: Element, name: string) => {
    const current = el.getAttribute(name);
    if (current) {
      const next = swap(current, name);
      if (next != null) el.setAttribute(name, next);
    }
  };

  const swapAttrs = (names: string[], el: Element) => {
    for (let i = 0; i < names.length; i++) swapAttr(el, names[i]);
  };

  const swapHref = (el: Element) => {
    const href = el.getAttribute("href");
    if (href && href.match(HREF_SCHEMES)) swapAttr(el, "href");
  };

  domEach(".cr_image, .cr_image *", () => {
    /* background-image swapping — not exercised by these tests */
  });

  recurseDOM(root, (node) => {
    switch (node.nodeType) {
      case 1: {
        const el = node as Element;
        if (
          ["SCRIPT", "NOSCRIPT"].includes(el.tagName) ||
          el.hasAttribute("data-calltrk-noswap")
        ) {
          return false;
        }
        swapAttrs(SWAPPED_ATTRS, el);
        swapHref(el);
        break;
      }
      case 3: {
        const next = swap(node.nodeValue || "");
        if (next != null) node.nodeValue = next;
        break;
      }
    }
  });
}

/** Dom.domTargets — the numbers CallRail would ask its server to assign. */
export function domTargets(root: Node): string[] {
  const found: string[] = [];
  const nonDigits = /\D/g;

  traverseDOM((value) => {
    const matches = stringTargets(value);
    for (let i = 0; i < matches.length; i++) {
      let digits = matches[i].replace(nonDigits, "");
      if (digits.length > 10) digits = digits.slice(digits.length - 10);
      if (found.indexOf(digits) === -1) found.push(digits);
    }
    return undefined;
  }, root);

  return found;
}

// ── Test helper ─────────────────────────────────────────────────────────────

/**
 * Equivalent of `CallTrkSwap.startSessionSwap(assignments, root)` for the
 * "simple" (non-exact-format) target case, which is what this account uses
 * (`session_exact_targets: []`, `session_number_target_exists: true`).
 */
export function runSessionSwap(
  assignments: Record<string, string>,
  root: Node = document.body
) {
  resetRegexCache();
  traverseDOM((value) => {
    let out = value;
    for (const target of Object.keys(assignments)) {
      out = standardReplace(out, target, assignments[target]);
    }
    return out !== value ? out : undefined;
  }, root);
}
