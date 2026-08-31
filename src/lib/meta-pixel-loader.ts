/**
 * Single place that loads and initialises the Meta Pixel in the browser.
 *
 * Both the <MetaPixel /> component and `trackMetaConversion` await the same
 * promise, so a conversion can never be dropped because the pixel script had
 * not finished loading yet.
 */
import { getMetaPixelId } from "./meta.functions";

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

/** Resolves with the pixel id once fbq exists and has been initialised. */
export async function ensureMetaPixel(): Promise<string | null> {
  if (typeof window === "undefined") return null;
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
        pixelInitPromise = null;
        return null;
      }
    })();
  }
  return pixelInitPromise;
}
