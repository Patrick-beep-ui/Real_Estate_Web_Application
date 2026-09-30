"use client";

import React from "react";
import { sendAttributionBeacon } from "@/lib/tracking/attribution-beacon";
import type { AttributionClickContext } from "@/lib/tracking/attribution-beacon";

/**
 * A phone/SMS link that CallRail swaps as a whole: the visible number and the
 * href change together, so the number a visitor reads is the number they dial.
 * See docs/callrail-phone-swap.md.
 */

interface PhoneLinkProps
  extends Omit<React.ComponentPropsWithoutRef<"a">, "href"> {
  href: string;
  /**
   * Block CallRail from swapping this link (label and href) with
   * `data-calltrk-noswap`, at the cost of attribution for it.
   */
  freezeHref?: boolean;
  attributionContext?: AttributionClickContext;
  children: React.ReactNode;
}

export default function PhoneLink({
  href,
  freezeHref = false,
  attributionContext,
  children,
  ...rest
}: PhoneLinkProps) {
  const { onClick, ...anchorRest } = rest;
  const channel = href.startsWith("sms:") ? "sms" : "call";
  const targetPhone = href.split("?")[0].replace(/\D/g, "");
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    sendAttributionBeacon(channel, targetPhone, attributionContext);
    onClick?.(e);
  };

  return (
    <a
      href={href}
      data-calltrk-noswap={freezeHref ? "" : undefined}
      onClick={handleClick}
      {...anchorRest}
    >
      {children}
    </a>
  );
}
