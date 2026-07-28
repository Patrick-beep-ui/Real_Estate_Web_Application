# CallRail phone swapping

## The rule

**Displayed numbers are frozen. `tel:`/`sms:` hrefs are swappable.**

A visitor always reads `(866) 407-3411` / `(949) 295-2842`. When they tap a call
button, they dial whatever tracking number CallRail assigned to their session, so
attribution still works.

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
return `false`. Because the check runs on element nodes only, putting the
attribute on an inner wrapper rather than the anchor gives us both behaviours at
once:

```html
<a href="tel:+18664073411">        <!-- visited: href IS swapped -->
  <span data-calltrk-noswap>       <!-- returns false: recursion stops here -->
    (866) 407-3411                 <!-- text node never reached: stays ours -->
  </span>
</a>
```

That is exactly what `<PhoneLink>` renders.

## How to use it

| Situation | Use |
| --- | --- |
| Clickable number (CTA, contact card) | `<PhoneLink href={buildTelLink()}>Call {PHONE.call}</PhoneLink>` |
| Number as plain text (legal copy, confirmation) | `<PhoneText>{PHONE.call}</PhoneText>` |
| Number that must not swap at all | `<PhoneLink href={...} freezeHref>` |

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

- **Desktop / manual dialers are unattributed.** Someone who reads the number off
  the screen and types it into a phone reaches our canonical line. Only
  clicks and taps are tracked.
- **SMS shows a mismatch.** The visitor sees `(949) 295-2842`, their messaging app
  opens a thread to the tracking number, and replies come from that number. Calls
  hide this well; texts do not, because the number stays in their thread history.
  If this becomes a problem, add `freezeHref` to the SMS links — that trades text
  attribution for a consistent number.
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

- `CallTrkSwap.foundTargets` — should **not** contain our display numbers
- `CallTrkSwap.doneSwaps` — should show only href swaps
- `CallTrk.knownSwapAssignments()` — cross-check what CallRail assigned
- No `.calltrk-swap-occurred` class should appear on phone containers

Manual pass: load with `?utm_source=facebook` and `?gclid=test`, step through the
3-step form, wait 60s and move the mouse to force a poll, then confirm every
visible number is unchanged and the `tel:` href is a tracking number.

## The durable fix we did not do

The root cause is a CallRail account setting: the session tracker is scoped to
"swap all numbers on page" rather than an explicit target list. Until someone
with CallRail access narrows that scope, every new page is exposed by default and
is only protected if the author remembers to use `PhoneLink` / `PhoneText`. The
regression test is what keeps that honest.
