import { useState, useEffect } from "react";

/** Returns true when the sticky mobile CTA drawer is expanded */
export function useStickyCtaExpanded() {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      setExpanded((e as CustomEvent).detail?.expanded ?? false);
    };
    window.addEventListener("sticky_cta_state", handler);
    return () => window.removeEventListener("sticky_cta_state", handler);
  }, []);

  return expanded;
}
