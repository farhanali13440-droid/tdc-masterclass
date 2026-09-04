/**
 * Browser-side Meta Pixel helpers.
 *
 * Every conversion generates ONE event id that is sent to both the Pixel
 * (`eventID`) and the Conversions API (`event_id`) so Meta can deduplicate.
 * No access token ever exists in this file — CAPI calls go through the
 * `trackMetaEvent` server function.
 */
import { ensureMetaPixel } from "./meta-pixel-loader";
import { trackMetaEvent } from "./meta.functions";


export type MetaEventName =
  | "PageView"
  | "ViewContent"
  | "InitiateCheckout"
  | "Lead"
  | "Contact"
  | "SubmitApplication"
  | "AddPaymentInfo"
  | "CompleteRegistration"
  | "Purchase";

/**
 * Meta health-data compliance: this site is about a medical condition, so no
 * personal identifiers (email, phone, name, city, external id) are ever sent
 * to Meta. Only the Meta-owned browser identifiers (_fbp/_fbc) are forwarded.
 */
type Fbq = ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean };

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

const DEDUPE_PREFIX = "tdc_meta_evt:";

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  }
  return Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
}

export function createEventId(eventName: MetaEventName, suffix?: string): string {
  const base = eventName.toLowerCase();
  return `${base}_${suffix ? `${suffix}_` : ""}${randomId()}`;
}

/**
 * Reads a cookie WITHOUT decoding it. Meta writes `_fbp`/`_fbc` as raw values
 * and requires them to be forwarded byte-for-byte, so any decode/encode round
 * trip here would count as "modifying the Meta ClickID".
 */
function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match?.[1] ? match[1] : undefined;
}

/** Meta browser id cookie. */
export function getFbp(): string | undefined {
  return readCookie("_fbp");
}

/**
 * Reads a query parameter exactly as it appears in the URL.
 * URLSearchParams percent-decodes and turns `+` into a space, which mutates
 * the fbclid — so the raw substring is used instead.
 */
function readRawQueryParam(name: string): string | undefined {
  if (typeof window === "undefined") return undefined;
  const query = window.location.search.replace(/^\?/, "");
  for (const pair of query.split("&")) {
    if (!pair) continue;
    const eq = pair.indexOf("=");
    const key = eq === -1 ? pair : pair.slice(0, eq);
    if (key !== name) continue;
    const raw = eq === -1 ? "" : pair.slice(eq + 1);
    return raw || undefined;
  }
  return undefined;
}

/**
 * fbevents.js writes _fbp a tick after it loads. Waiting for it means the
 * server event carries the same browser identifier as the pixel event, which
 * is what Meta uses for match quality and deduplication.
 */
async function waitForFbp(maxMs = 1500): Promise<void> {
  const started = Date.now();
  while (!getFbp() && Date.now() - started < maxMs) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

/**
 * Captures the click id on the very first page of the visit and persists it as
 * a first-party `_fbc` cookie in Meta's official format
 * `fb.<subdomainIndex>.<creationTime>.<fbclid>` — the fbclid is copied
 * verbatim, never decoded, lowercased or truncated. An existing valid `_fbc`
 * cookie is left untouched.
 */
export function captureFbc(): string | undefined {
  const existing = readCookie("_fbc");
  if (existing) return existing;
  const fbclid = readRawQueryParam("fbclid");
  if (!fbclid) return undefined;
  const value = `fb.1.${Date.now()}.${fbclid}`;
  try {
    // Written raw: encoding it would alter the value Meta expects back.
    document.cookie = `_fbc=${value}; path=/; max-age=${60 * 60 * 24 * 90}; SameSite=Lax`;
  } catch {
    /* cookie write is best-effort */
  }
  return value;
}

/**
 * Meta click id. Prefers the existing `_fbc` cookie (written by fbevents.js or
 * by `captureFbc` on the landing page) and otherwise builds one from an
 * fbclid still present in the current URL.
 */
export function getFbc(): string | undefined {
  return readCookie("_fbc") ?? captureFbc();
}


/** Persistent, cross-refresh guard so the same conversion is never sent twice. */
export function hasSentEvent(key: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(DEDUPE_PREFIX + key) !== null;
  } catch {
    return false;
  }
}

export function markEventSent(key: string, eventId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DEDUPE_PREFIX + key, eventId);
  } catch {
    /* storage unavailable — ignore */
  }
}

/** Session-scoped guard: one send per browsing session (page-view style events). */
export function hasSentSessionEvent(key: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.sessionStorage.getItem(DEDUPE_PREFIX + key) !== null;
  } catch {
    return false;
  }
}

export function markSessionEventSent(key: string, eventId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(DEDUPE_PREFIX + key, eventId);
  } catch {
    /* storage unavailable — ignore */
  }
}

export type TrackOptions = {
  /** Idempotency key, e.g. `purchase:<registrationId>`. Prevents repeat sends. */
  dedupeKey?: string;
  /** Session-scoped idempotency key (sessionStorage) for ViewContent-style events. */
  sessionKey?: string;
  /** Suffix used inside the generated event id (usually the registration id). */
  eventIdSuffix?: string;
  registrationId?: string;
  value?: number;
  currency?: string;
};

/**
 * Fires one conversion through both the Pixel and the Conversions API using a
 * single shared event id. Never throws — tracking must not break the funnel.
 */
export async function trackMetaConversion(
  eventName: MetaEventName,
  options: TrackOptions = {},
): Promise<{ sent: boolean; eventId?: string }> {
  if (typeof window === "undefined") return { sent: false };

  const dedupeKey = options.dedupeKey;
  if (dedupeKey && hasSentEvent(dedupeKey)) return { sent: false };
  const sessionKey = options.sessionKey;
  if (sessionKey && hasSentSessionEvent(sessionKey)) return { sent: false };

  // With a dedupe key the id is deterministic, so even a different browser or
  // cleared storage cannot produce a second countable conversion in Meta.
  const eventId = options.registrationId
    ? `${eventName.toLowerCase()}_${options.registrationId}`
    : createEventId(eventName, options.eventIdSuffix);

  const eventTime = Math.floor(Date.now() / 1000);
  const eventSourceUrl = window.location.href;

  const customData: Record<string, unknown> = {};
  if (options.value !== undefined) {
    customData['value'] = options.value;
    customData['currency'] = options.currency ?? "PKR";
  }

  // Mark before awaiting so a fast refresh can't double-fire.
  if (dedupeKey) markEventSent(dedupeKey, eventId);
  if (sessionKey) markSessionEventSent(sessionKey, eventId);

  // The pixel script loads asynchronously. Awaiting it here is what guarantees
  // the BROWSER copy of the event actually reaches Meta (previously a fast
  // submit could call window.fbq before it existed, leaving CAPI-only events).
  try {
    await ensureMetaPixel();
    window.fbq?.("track", eventName, customData, { eventID: eventId });
  } catch (error) {
    console.warn("[meta-pixel] browser event failed", error);
  }
  await waitForFbp();

  try {

    await trackMetaEvent({
      data: {
        eventName,
        eventId,
        eventSourceUrl,
        eventTime,
        ...(options.value !== undefined ? { value: options.value } : {}),
        ...(options.value !== undefined ? { currency: options.currency ?? "PKR" } : {}),
        ...(options.registrationId ? { registrationId: options.registrationId } : {}),
        userData: {
          ...(getFbp() ? { fbp: getFbp() } : {}),
          ...(getFbc() ? { fbc: getFbc() } : {}),
        },
      },
    });
  } catch (error) {
    // CAPI problems must never surface to the visitor.
    console.warn("[meta-capi] client dispatch failed", error);
  }

  return { sent: true, eventId };
}

/** Stores the just-completed registration so the thank-you page can use it. */
const PENDING_KEY = "tdc_last_registration";

export type PendingRegistration = {
  id: string;
  /** True only when this browser actually completed a successful submission. */
  submitted?: boolean;
};

export function storePendingRegistration(value: PendingRegistration): void {
  try {
    window.sessionStorage.setItem(PENDING_KEY, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function readPendingRegistration(): PendingRegistration | null {
  try {
    const raw = window.sessionStorage.getItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as PendingRegistration) : null;
  } catch {
    return null;
  }
}
