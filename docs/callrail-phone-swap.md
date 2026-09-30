# CallRail phone swapping

## The rule

**A phone link shows the number it dials. Numbers outside a link are frozen.**

On a `PhoneLink`, CallRail swaps the visible number and the `tel:`/`sms:` href
together, so a visitor reads and dials the same tracking number. A tap and a
hand-dialed call are both attributed. Plain-text numbers (`PhoneText`: legal
copy, contact blocks, confirmations) always read `(866) 407-3411` /
`(949) 295-2842`.

Until 2026-09-30 `PhoneLink` froze the label and swapped only the href. The
button then showed one number and dialed another, and a visitor who typed the
shown number by hand reached an untracked line.

## Why `React.memo` did not work

An earlier attempt wrapped phone links in `React.memo(..., () => true)`. That
could never work. CallRail's `swap.js` does not go through React — it walks the
real DOM and writes directly to `Text.nodeValue` and via `setAttribute`.
Memoisation only stops *React* from re-rendering, which if anything makes
CallRail's swap permanent. There is no React-side trick that wins here, because
CallRail re-swaps continuously: `mutation_observer: true`, `session_observer:
true`, plus session polling every 60s re-triggered on `mousemove`, `keypress` and
`focus`.

## What actually swaps our numbers

Two independent mechanisms in `swap.js`:

**Source swap** matches the account's configured `swap_targets`:
`8442893700`, `8883563547`, `7145007734`, `7149146681`, `7144775834`. None of
those appear on this site, so these trackers never touch us. They are dead
weight and someone with CallRail access should retire them.

**Session swap** is the one that hits us. The account has
`session_number_target_exists: true` and `session_exact_targets: []`, which means
`Dom.domTargets()` scans every text node and attribute against a generic regex:

```js
NUM_REGEX = /(\(?)\d{3}(\))?([-. ]?)\d{3}([-. ]?)\d{4}\b/g
```

It has no target list — it grabs anything phone-shaped, POSTs it to
`swap_session.json`, and writes back whatever CallRail assigns.

## The mechanism we use

`swap.js` honours exactly one opt-out. From the traversal callback:

```js
case 1:  // element node
  if (["SCRIPT","NOSCRIPT"].includes(e.tagName)
      || e.hasAttribute("data-calltrk-noswap")) return false;
  s(a, e);   // swaps src / srcset / title / phone attributes
  c(e);      // swaps href, if it matches tel: / sms: / imessage:
  break;
case 3:  // text node
  ...swap the number in nodeValue...
```

`recurseDOM` only descends into an element's children when the callback did not
return `false`, so the attribute on an element protects its own attributes and
everything inside it:

```html
<a href="tel:+18664073411">                    <!-- PhoneLink: label and href swap -->
  Call (866) 407-3411
</a>
<a href="tel:+18664073411" data-calltrk-noswap> <!-- PhoneLink freezeHref: nothing swaps -->
  (866) 407-3411
</a>
<span data-calltrk-noswap>(866) 407-3411</span> <!-- PhoneText: nothing swaps -->
```

## How to use it

| Situation | Use |
| --- | --- |
| Clickable number (CTA, contact card) | `<PhoneLink href={buildTelLink()}>Call {PHONE.call}</PhoneLink>` |
| Number as plain text (legal copy, confirmation) | `<PhoneText>{PHONE.call}</PhoneText>` |
| Clickable number that must not swap at all | `<PhoneLink href={...} freezeHref>` |

All numbers come from `src/lib/phone.ts`. Never hardcode one — a test fails if
you do (`tests/unit/callrail/phone-swap-protection.test.tsx`).

### Placement rule

The attribute must sit **on, or inside, the element React mounts**. CallRail's
MutationObserver passes the newly added node as the traversal root:

```js
Dom.mutationCallback -> CallTrkSwap.startSourceSwap(addedNode)
```

so `data-calltrk-noswap` on a distant ancestor like `<body>` or `<main>` is
bypassed entirely for anything rendered after hydration — form step changes, the
sticky CTA, the exit-intent popup. Never rely on ancestor placement.

## Known limitations

- **Phone links show a per-session number.** A visitor may see a different
  number from one session to the next. Numbers in `PhoneText` never change.
- **A number typed from a `PhoneText` block is unattributed.** Only numbers
  inside a `PhoneLink` carry a tracking number.
- **If an assigned tracking number is not SMS-capable, texting breaks.** Only two
  of the account's source trackers have `sms_enabled: true`; session-assigned
  numbers are an unknown. `freezeHref` on SMS links is the fix.
- **`document.title` cannot be protected.** It is swapped separately in both
  `startSourceSwap` and `startSessionSwap`. Keep phone numbers out of page titles
  and metadata.
- **`/sms-opt-in` deliberately uses `freezeHref`.** It is a TCPA disclosure; the
  number a carrier or auditor sees there must be the real business line.

## Verifying in production

Load any page with `?crdbg=1` (the check is `/crl?dbg/`), then in the console:

- `CallTrk.knownSwapAssignments()` — what CallRail assigned this session

Manual pass: load with `?utm_source=facebook` and `?gclid=test`, step through the
3-step form, wait 60s and move the mouse to force a poll, then confirm every
`PhoneLink` shows the same number its `tel:` href dials, and every `PhoneText`
number is unchanged. From the console:

```js
[...document.querySelectorAll('a[href^="tel:"]')].map(a => [a.textContent, a.getAttribute("href")])
```

## The durable fix we did not do

The root cause is a CallRail account setting: the session tracker is scoped to
"swap all numbers on page" rather than an explicit target list. Until someone
with CallRail access narrows that scope, every new page is exposed by default and
is only protected if the author remembers to use `PhoneLink` / `PhoneText`. The
regression test is what keeps that honest.
