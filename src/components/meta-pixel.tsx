import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

import { getMetaPixelId } from "@/lib/meta.functions";

let pixelInitPromise: Promise<string | null> | null = null;

function injectPixelBase(): void {
  if (typeof window === "undefined" || window.fbq) return;

  const stub = function (...args: unknown[]) {
    const self = stub as unknown as {
      callMethod?: (...a: unknown[]) => void;
      queue: unknown[];
    };
    if (self.callMethod) self.callMethod(...args);
    else self.queue.push(args);
  };
  Object.assign(stub, { push: stub, loaded: true, version: "2.0", queue: [] as unknown[] });

  window.fbq = stub as unknown as NonNullable<Window["fbq"]>;
  window._fbq = window.fbq;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);
}


async function ensurePixel(): Promise<string | null> {
  if (!pixelInitPromise) {
    pixelInitPromise = (async () => {
      try {
        const { pixelId } = await getMetaPixelId();
        if (!pixelId) return null;
        injectPixelBase();
        window.fbq?.("init", pixelId);
        return pixelId;
      } catch (error) {
        console.warn("[meta-pixel] init failed", error);
        return null;
      }
    })();
  }
  return pixelInitPromise;
}

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
    let cancelled = false;
    void ensurePixel().then((pixelId) => {
      if (!pixelId || cancelled) return;
      window.fbq?.("track", "PageView");
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return null;
}
