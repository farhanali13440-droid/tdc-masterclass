import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

import { createEventId } from "@/lib/meta-tracking";
import { ensureMetaPixel } from "@/lib/meta-pixel-loader";


/**
 * Loads the Meta Pixel once for the whole app and fires exactly one PageView
 * per page view (including client-side route changes).
 */
export function MetaPixel() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    // One deduplication key per actual page view, generated before the async
    // pixel load so React re-renders can never produce a second id.
    const eventId = createEventId("PageView");
    let cancelled = false;
    void ensurePixel().then((pixelId) => {
      if (!pixelId || cancelled) return;
      window.fbq?.("track", "PageView", {}, { eventID: eventId });
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return null;
}
