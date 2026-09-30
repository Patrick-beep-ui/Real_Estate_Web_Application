import React from "react";

/**
 * A phone number rendered as plain text, protected from CallRail's swap.
 *
 * Use this anywhere a number is displayed WITHOUT a surrounding `tel:`/`sms:`
 * anchor — legal copy, contact blocks, confirmation screens. Those numbers have
 * no href for CallRail to attribute a call through, so there is nothing to gain
 * by letting them swap and plenty to lose (a legal page that quotes a rotating
 * tracking number is worse than useless).
 *
 * For clickable numbers use `PhoneLink` instead, which lets CallRail swap the
 * label and the href together.
 *
 * Deliberately not a client component, so it works inside server-rendered
 * pages such as /privacy, /terms and /sms-opt-in.
 *
 * See docs/callrail-phone-swap.md for how `data-calltrk-noswap` works.
 */
export default function PhoneText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span data-calltrk-noswap="" className={className}>
      {children}
    </span>
  );
}
