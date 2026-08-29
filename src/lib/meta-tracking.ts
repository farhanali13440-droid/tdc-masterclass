/**
 * Browser-side Meta Pixel helpers.
 *
 * Every conversion generates ONE event id that is sent to both the Pixel
 * (`eventID`) and the Conversions API (`event_id`) so Meta can deduplicate.
 * No access token ever exists in this file — CAPI calls go through the
 * `trackMetaEvent` server function.
 */
import { trackMetaEvent } from "./meta.functions";

export type MetaEventName =
  | "ViewContent"
  | "InitiateCheckout"
  | "Lead"
  | "Contact"
  | "SubmitApplication"
  | "AddPaymentInfo"
  | "CompleteRegistration"
  | "Purchase";

export type MetaCustomerData = {
  email?: string | undefined;
  phone?: string | undefined;
  firstName?: string | undefined;
  lastName?: string | undefined;
  city?: string | undefined;
  externalId?: string | undefined;
};

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

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
}

/** Meta browser id cookie. */
export function getFbp(): string | undefined {
  return readCookie("_fbp");
}

/**
 * Meta click id. Uses the existing _fbc cookie when present; otherwise builds
 * one from an fbclid in the URL (never overwriting a valid existing value).
 */
export function getFbc(): string | undefined {
  const existing = readCookie("_fbc");
  if (existing) return existing;
  if (typeof window === "undefined") return undefined;
  const fbclid = new URLSearchParams(window.location.search).get("fbclid");
  if (!fbclid) return undefined;
  const value = `fb.1.${Date.now()}.${fbclid}`;
  try {
    document.cookie = `_fbc=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 90}; SameSite=Lax`;
  } catch {
    /* cookie write is best-effort */
  }
  return value;
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
  customer?: MetaCustomerData;
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

  try {
    window.fbq?.("track", eventName, customData, { eventID: eventId });
  } catch (error) {
    console.warn("[meta-pixel] browser event failed", error);
  }

  // Mark before awaiting so a fast refresh can't double-fire.
  if (dedupeKey) markEventSent(dedupeKey, eventId);

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
          ...(options.customer?.email ? { email: options.customer.email } : {}),
          ...(options.customer?.phone ? { phone: options.customer.phone } : {}),
          ...(options.customer?.firstName ? { firstName: options.customer.firstName } : {}),
          ...(options.customer?.lastName ? { lastName: options.customer.lastName } : {}),
          ...(options.customer?.city ? { city: options.customer.city } : {}),
          ...(options.customer?.externalId ? { externalId: options.customer.externalId } : {}),
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

/** Splits a full name into first/last for Meta's fn/ln parameters. */
export function splitName(fullName: string): { firstName?: string; lastName?: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return {};
  if (parts.length === 1) return { firstName: parts[0] as string };
  return { firstName: parts[0] as string, lastName: parts.slice(1).join(" ") };
}

/** Stores the just-completed registration so the thank-you page can use it. */
const PENDING_KEY = "tdc_last_registration";

export type PendingRegistration = {
  id: string;
  email: string;
  phone: string;
  firstName?: string | undefined;
  lastName?: string | undefined;
  city?: string | undefined;
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
