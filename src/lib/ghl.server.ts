/**
 * Server-only GoHighLevel (LeadConnector API v2) integration.
 *
 * SECURITY: GHL_PRIVATE_INTEGRATION_TOKEN is read here from server env only and
 * is never returned to, or bundled for, the browser. Load this module inside
 * server handlers with `await import("./ghl.server")`.
 *
 * Flow (Supabase is the source of truth):
 *   Supabase write succeeds -> ledger row claimed (registration id + event) ->
 *   contact upserted by email/phone -> audit note -> trigger tag added ->
 *   ledger marked sent. GHL workflows listen for the trigger tags and send the
 *   internal notification emails.
 *
 * Duplicate protection:
 *   - ghl_sync_events has UNIQUE (registration_id, event_type); a row marked
 *     "sent" is never delivered again (refreshes, repeated requests, retries).
 *   - Contacts are upserted, so the same email/phone updates one contact.
 *   - Trigger tags are re-applied only for a NEW registration id, so a returning
 *     person still produces exactly one notification per registration.
 */
import type { Database } from "@/integrations/supabase/types";

type RegistrationRow = Database["public"]["Tables"]["masterclass_registrations"]["Row"];

export type GhlRegistration = Pick<
  RegistrationRow,
  | "id"
  | "full_name"
  | "whatsapp"
  | "email"
  | "city"
  | "learning_goal"
  | "amount_pkr"
  | "original_amount_pkr"
  | "discount_amount_pkr"
  | "coupon_code"
  | "lead_status"
  | "payment_status"
  | "registration_status"
  | "created_at"
  | "payment_submitted_at"
>;

export const REGISTRATION_COLUMNS =
  "id, full_name, whatsapp, email, city, learning_goal, amount_pkr, original_amount_pkr, discount_amount_pkr, coupon_code, lead_status, payment_status, registration_status, created_at, payment_submitted_at";

export const GHL_API_BASE = "https://services.leadconnectorhq.com";
export const GHL_API_VERSION = "2021-07-28";
export const GHL_PRODUCT_NAME = "Diabetes Control Masterclass";
export const GHL_SOURCE = "TDC Masterclass Website";
export const GHL_CURRENCY = "PKR";

export const GHL_TAGS = {
  lead: "TDC Masterclass Lead",
  paymentSubmitted: "TDC Masterclass Payment Submitted",
  /** Reserved for manual bank verification by the TDC team. Never auto-applied. */
  paid: "TDC Masterclass Paid",
} as const;

export type GhlEventType = "lead" | "payment_submitted";

export const GHL_EVENT_TAG: Record<GhlEventType, string> = {
  lead: GHL_TAGS.lead,
  payment_submitted: GHL_TAGS.paymentSubmitted,
};

/** Status values written by createCheckoutLead at opt-in time. */
export const LEAD_EVENT_STATUSES = {
  registrationStatus: "Opted In",
  leadStatus: "Checkout Started",
  paymentStatus: "Payment Pending",
} as const;

export const GHL_CUSTOM_FIELDS = [
  { key: "product", name: "TDC Product", dataType: "TEXT" },
  { key: "registrationId", name: "TDC Registration ID", dataType: "TEXT" },
  { key: "registrationStatus", name: "TDC Registration Status", dataType: "TEXT" },
  { key: "leadStatus", name: "TDC Lead Status", dataType: "TEXT" },
  { key: "paymentStatus", name: "TDC Payment Status", dataType: "TEXT" },
  { key: "amount", name: "TDC Amount", dataType: "NUMERICAL" },
  { key: "originalAmount", name: "TDC Original Amount", dataType: "NUMERICAL" },
  { key: "discountAmount", name: "TDC Discount Amount", dataType: "NUMERICAL" },
  { key: "couponCode", name: "TDC Coupon Code", dataType: "TEXT" },
  { key: "source", name: "TDC Source", dataType: "TEXT" },
  { key: "sourceUrl", name: "TDC Source URL", dataType: "TEXT" },
  { key: "eventDate", name: "TDC Event Date", dataType: "TEXT" },
  { key: "learningGoal", name: "TDC Learning Goal", dataType: "LARGE_TEXT" },
  { key: "whatsapp", name: "TDC WhatsApp", dataType: "TEXT" },
  { key: "optedInAt", name: "TDC Opted In At", dataType: "TEXT" },
  { key: "paymentSubmittedAt", name: "TDC Payment Submitted At", dataType: "TEXT" },
  { key: "lastEvent", name: "TDC Last Event", dataType: "TEXT" },
] as const;

export type GhlFieldKey = (typeof GHL_CUSTOM_FIELDS)[number]["key"];
export type GhlFieldIds = Partial<Record<GhlFieldKey, string>>;

export type GhlConfig = { token: string; locationId: string; baseUrl: string };

export function readGhlConfig(
  env: Record<string, string | undefined> = process.env,
): GhlConfig | null {
  const token = (env["GHL_PRIVATE_INTEGRATION_TOKEN"] ?? env["GHL_API_KEY"] ?? "").trim();
  const locationId = (env["GHL_LOCATION_ID"] ?? "").trim();
  if (!token || !locationId) return null;
  return { token, locationId, baseUrl: resolveGhlBaseUrl(env["GHL_API_BASE_URL"]) };
}

/**
 * GHL_API_BASE_URL is optional (sandbox / local testing). Plain http is only
 * accepted for localhost so the token can never travel unencrypted.
 */
export function resolveGhlBaseUrl(value: string | undefined): string {
  const candidate = (value ?? "").trim().replace(/\/+$/, "");
  if (!candidate) return GHL_API_BASE;
  try {
    const url = new URL(candidate);
    const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    if (url.protocol === "https:" || (url.protocol === "http:" && local)) return candidate;
  } catch {
    /* fall through */
  }
  return GHL_API_BASE;
}

// ---------------------------------------------------------------------------
// Pure helpers (unit-tested)
// ---------------------------------------------------------------------------

/** Same slug GHL generates for a custom field key: "TDC Amount" -> "tdc_amount". */
export function ghlFieldSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

/** E.164 for Pakistani numbers (03xx..., 92..., 0092...). Unknown formats pass through. */
export function normalizePhoneForGhl(raw: string): string | null {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;
  if (trimmed.startsWith("+")) return `+${digits}`;
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  if (digits.startsWith("92") && digits.length === 12) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 11) return `+92${digits.slice(1)}`;
  if (digits.startsWith("3") && digits.length === 10) return `+92${digits}`;
  return trimmed;
}

export function formatPkt(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
  return `${formatted} PKT`;
}

export function sanitizeSourceUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    url.hash = "";
    return url.toString().slice(0, 500);
  } catch {
    return null;
  }
}

export type GhlEventValues = Record<GhlFieldKey, string | number>;

export function buildGhlEventValues(
  reg: GhlRegistration,
  eventType: GhlEventType,
  opts: { eventDate: string; sourceUrl: string | null },
): GhlEventValues {
  const isLead = eventType === "lead";
  const isFree = reg.amount_pkr === 0;
  return {
    product: GHL_PRODUCT_NAME,
    registrationId: reg.id,
    registrationStatus: isLead ? LEAD_EVENT_STATUSES.registrationStatus : reg.registration_status,
    leadStatus: isLead ? LEAD_EVENT_STATUSES.leadStatus : reg.lead_status,
    paymentStatus: isLead ? LEAD_EVENT_STATUSES.paymentStatus : reg.payment_status,
    amount: reg.amount_pkr,
    originalAmount: reg.original_amount_pkr,
    discountAmount: reg.discount_amount_pkr,
    couponCode: reg.coupon_code ?? "",
    source: GHL_SOURCE,
    sourceUrl: opts.sourceUrl ?? "",
    eventDate: opts.eventDate,
    learningGoal: reg.learning_goal ?? "",
    whatsapp: reg.whatsapp,
    optedInAt: formatPkt(reg.created_at),
    paymentSubmittedAt: isLead ? "" : formatPkt(reg.payment_submitted_at),
    lastEvent: isLead
      ? "Lead (Checkout Started)"
      : isFree
        ? "Free Registration Submitted (100% Coupon)"
        : "Payment Proof Submitted (Awaiting Verification)",
  };
}

export type GhlUpsertPayload = {
  locationId: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  city: string;
  source: string;
  customFields: Array<{ id: string; field_value: string | number }>;
};

export function buildGhlContactPayload(
  reg: GhlRegistration,
  eventType: GhlEventType,
  opts: { locationId: string; eventDate: string; sourceUrl: string | null; fieldIds: GhlFieldIds },
): GhlUpsertPayload {
  const values = buildGhlEventValues(reg, eventType, opts);
  const { firstName, lastName } = splitName(reg.full_name);
  const phone = normalizePhoneForGhl(reg.whatsapp);
  const customFields = GHL_CUSTOM_FIELDS.flatMap((field) => {
    const id = opts.fieldIds[field.key];
    return id ? [{ id, field_value: values[field.key] }] : [];
  });
  return {
    locationId: opts.locationId,
    name: reg.full_name.trim(),
    firstName,
    lastName,
    email: reg.email.trim().toLowerCase(),
    ...(phone ? { phone } : {}),
    city: reg.city.trim(),
    source: GHL_SOURCE,
    customFields,
  };
}

export function buildGhlNote(
  reg: GhlRegistration,
  eventType: GhlEventType,
  opts: { eventDate: string; sourceUrl: string | null },
): string {
  const v = buildGhlEventValues(reg, eventType, opts);
  const heading =
    eventType === "lead"
      ? "TDC Masterclass: New Lead (Checkout Started)"
      : `TDC Masterclass: ${v.lastEvent}`;
  const lines = [
    heading,
    "",
    `Product: ${GHL_PRODUCT_NAME} (${opts.eventDate})`,
    `Registration ID: ${reg.id}`,
    `Name: ${reg.full_name}`,
    `WhatsApp: ${reg.whatsapp}`,
    `Email: ${reg.email}`,
    `City: ${reg.city}`,
    `Learning Goal: ${reg.learning_goal || "Not provided"}`,
    `Amount Payable: ${GHL_CURRENCY} ${reg.amount_pkr} (original ${GHL_CURRENCY} ${reg.original_amount_pkr}, discount ${GHL_CURRENCY} ${reg.discount_amount_pkr})`,
    `Coupon: ${reg.coupon_code || "None"}`,
    `Registration Status: ${v.registrationStatus}`,
    `Lead Status: ${v.leadStatus}`,
    `Payment Status: ${v.paymentStatus}`,
    `Opted In At: ${v.optedInAt}`,
    ...(eventType === "payment_submitted" ? [`Payment Submitted At: ${v.paymentSubmittedAt}`] : []),
    `Source: ${GHL_SOURCE}`,
    ...(opts.sourceUrl ? [`Page URL: ${opts.sourceUrl}`] : []),
  ];
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// HTTP client
// ---------------------------------------------------------------------------

export class GhlApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "GhlApiError";
  }
}

/** Short, PII-free summary of a GHL error body for logs and the ledger. */
function summarizeError(text: string): string {
  let message = text;
  try {
    const parsed = JSON.parse(text) as { message?: unknown; error?: unknown };
    const raw = parsed.message ?? parsed.error;
    if (Array.isArray(raw)) message = raw.join("; ");
    else if (typeof raw === "string") message = raw;
  } catch {
    /* not JSON */
  }
  return message
    .replace(/[^\s@]+@[^\s@]+/g, "[email]")
    .replace(/\+?\d[\d\s-]{7,}\d/g, "[number]")
    .slice(0, 200);
}

type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

export type GhlClientOptions = {
  fetch?: FetchLike;
  timeoutMs?: number;
  sleep?: (ms: number) => Promise<void>;
};

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function createGhlClient(config: GhlConfig, options: GhlClientOptions = {}) {
  const doFetch: FetchLike = options.fetch ?? ((input, init) => fetch(input, init));
  const timeoutMs = options.timeoutMs ?? 6000;
  const sleep = options.sleep ?? defaultSleep;

  async function request<T>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    path: string,
    body?: unknown,
    { retries = 2 }: { retries?: number } = {},
  ): Promise<T> {
    for (let attempt = 0; ; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      let response: Response;
      try {
        response = await doFetch(`${config.baseUrl}${path}`, {
          method,
          headers: {
            Authorization: `Bearer ${config.token}`,
            Version: GHL_API_VERSION,
            Accept: "application/json",
            ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
          },
          ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
          signal: controller.signal,
        });
      } catch (error) {
        clearTimeout(timer);
        if (attempt < retries) {
          await sleep(500 * (attempt + 1));
          continue;
        }
        const reason = error instanceof Error ? error.name : "unknown";
        throw new GhlApiError(0, `Network error calling GHL (${reason})`);
      }
      clearTimeout(timer);

      const text = await response.text();
      if (response.ok) {
        if (!text) return {} as T;
        try {
          return JSON.parse(text) as T;
        } catch {
          return {} as T;
        }
      }
      const retryable = response.status === 429 || response.status >= 500;
      if (retryable && attempt < retries) {
        const retryAfter = Number(response.headers.get("retry-after"));
        const wait =
          Number.isFinite(retryAfter) && retryAfter > 0
            ? Math.min(retryAfter * 1000, 3000)
            : 500 * (attempt + 1);
        await sleep(wait);
        continue;
      }
      throw new GhlApiError(response.status, summarizeError(text));
    }
  }

  return { request };
}

export type GhlClient = ReturnType<typeof createGhlClient>;

// ---------------------------------------------------------------------------
// Provisioning (tags + custom fields), cached per server isolate
// ---------------------------------------------------------------------------

type GhlCustomField = { id: string; name?: string; fieldKey?: string };
type GhlLocationTag = { id?: string; name?: string };

export async function provisionGhlLocation(
  client: GhlClient,
  locationId: string,
  log: GhlLogger = defaultLogger,
): Promise<GhlFieldIds> {
  const fieldIds: GhlFieldIds = {};
  try {
    const list = await client.request<{ customFields?: GhlCustomField[] }>(
      "GET",
      `/locations/${encodeURIComponent(locationId)}/customFields?model=contact`,
    );
    const existing = list.customFields ?? [];
    for (const def of GHL_CUSTOM_FIELDS) {
      const slug = ghlFieldSlug(def.name);
      const match = existing.find(
        (field) =>
          (field.name && ghlFieldSlug(field.name) === slug) || field.fieldKey === `contact.${slug}`,
      );
      if (match) {
        fieldIds[def.key] = match.id;
        continue;
      }
      try {
        const created = await client.request<{ customField?: GhlCustomField; id?: string }>(
          "POST",
          `/locations/${encodeURIComponent(locationId)}/customFields`,
          { name: def.name, dataType: def.dataType, model: "contact" },
          { retries: 0 },
        );
        const id = created.customField?.id ?? created.id;
        if (id) fieldIds[def.key] = id;
      } catch (error) {
        log("warn", "custom field create failed", { field: def.name, error: errorMessage(error) });
      }
    }
  } catch (error) {
    // Contact + note + tags still sync without custom fields.
    log("warn", "custom field lookup failed", { error: errorMessage(error) });
  }

  try {
    const tags = await client.request<{ tags?: GhlLocationTag[] }>(
      "GET",
      `/locations/${encodeURIComponent(locationId)}/tags`,
    );
    const names = new Set((tags.tags ?? []).map((tag) => (tag.name ?? "").toLowerCase()));
    for (const name of Object.values(GHL_TAGS)) {
      if (names.has(name.toLowerCase())) continue;
      try {
        await client.request(
          "POST",
          `/locations/${encodeURIComponent(locationId)}/tags`,
          { name },
          { retries: 0 },
        );
      } catch (error) {
        log("warn", "tag create failed", { tag: name, error: errorMessage(error) });
      }
    }
  } catch (error) {
    // Tags are auto-created when first added to a contact.
    log("warn", "tag lookup failed", { error: errorMessage(error) });
  }
  return fieldIds;
}

// ---------------------------------------------------------------------------
// Delivery
// ---------------------------------------------------------------------------

type GhlContact = { id?: string; tags?: string[] };

export async function deliverGhlEvent(
  client: GhlClient,
  reg: GhlRegistration,
  eventType: GhlEventType,
  opts: { locationId: string; eventDate: string; sourceUrl: string | null; fieldIds: GhlFieldIds },
  log: GhlLogger = defaultLogger,
  refreshFieldIds?: () => Promise<GhlFieldIds>,
): Promise<{ contactId: string; isNewContact: boolean; retriggered: boolean }> {
  const isValidationError = (error: unknown) =>
    error instanceof GhlApiError && (error.status === 400 || error.status === 422);

  let payload = buildGhlContactPayload(reg, eventType, opts);
  let upsert: { new?: boolean; contact?: GhlContact };
  try {
    upsert = await client.request("POST", "/contacts/upsert", payload);
  } catch (firstError) {
    if (!isValidationError(firstError)) throw firstError;
    let lastError: unknown = firstError;
    let delivered: { new?: boolean; contact?: GhlContact } | null = null;
    // 1) Custom field ids may be stale (field deleted/recreated in GHL): refresh once.
    if (refreshFieldIds) {
      log("warn", "upsert rejected, refreshing custom field ids", {
        error: errorMessage(firstError),
      });
      payload = buildGhlContactPayload(reg, eventType, {
        ...opts,
        fieldIds: await refreshFieldIds(),
      });
      try {
        delivered = await client.request("POST", "/contacts/upsert", payload);
      } catch (error) {
        if (!isValidationError(error)) throw error;
        lastError = error;
      }
    }
    // 2) A phone GHL cannot parse must not lose the lead: retry without it
    //    (the typed number is still stored in "TDC WhatsApp" and in the note).
    if (!delivered && payload.phone) {
      log("warn", "upsert rejected, retrying without phone", { error: errorMessage(lastError) });
      const { phone: _omit, ...withoutPhone } = payload;
      delivered = await client.request("POST", "/contacts/upsert", withoutPhone);
    }
    if (!delivered) throw lastError;
    upsert = delivered;
  }

  const contactId = upsert.contact?.id;
  if (!contactId) throw new GhlApiError(0, "GHL upsert returned no contact id");

  let tags = upsert.contact?.tags;
  if (!Array.isArray(tags) && upsert.new !== true) {
    const fetched = await client.request<{ contact?: GhlContact }>(
      "GET",
      `/contacts/${encodeURIComponent(contactId)}`,
    );
    tags = fetched.contact?.tags;
  }
  const existingTags = (tags ?? []).map((tag) => tag.toLowerCase());

  // Audit note (best effort, runs alongside the tag step).
  const note = client
    .request(
      "POST",
      `/contacts/${encodeURIComponent(contactId)}/notes`,
      { body: buildGhlNote(reg, eventType, opts) },
      { retries: 0 },
    )
    .catch((error: unknown) => log("warn", "note create failed", { error: errorMessage(error) }));

  // Trigger tag after the contact data is saved: the GHL workflow fires on
  // "tag added" and reads the custom fields written above. A returning contact
  // that already carries the tag from an earlier registration gets it removed and
  // re-added so this new registration still produces its one notification.
  const tag = GHL_EVENT_TAG[eventType];
  const retriggered = existingTags.includes(tag.toLowerCase());
  const trigger = (async () => {
    if (retriggered) {
      await client.request("DELETE", `/contacts/${encodeURIComponent(contactId)}/tags`, {
        tags: [tag],
      });
    }
    await client.request("POST", `/contacts/${encodeURIComponent(contactId)}/tags`, {
      tags: [tag],
    });
  })();

  await Promise.all([note, trigger]);
  return { contactId, isNewContact: upsert.new === true, retriggered };
}

// ---------------------------------------------------------------------------
// Ledger + orchestration
// ---------------------------------------------------------------------------

export const LEDGER_MAX_ATTEMPTS = 6;
export const LEDGER_LOCK_MS = 90_000;

export type LedgerClaim =
  | { kind: "claimed"; id: string; sourceUrl: string | null }
  | { kind: "sent" }
  | { kind: "busy" }
  | { kind: "exhausted" }
  | { kind: "missing" }
  | { kind: "unavailable" };

export interface GhlLedger {
  claim(input: {
    registrationId: string;
    eventType: GhlEventType;
    sourceUrl: string | null;
    createIfMissing: boolean;
  }): Promise<LedgerClaim>;
  complete(id: string, contactId: string): Promise<void>;
  fail(id: string, error: string): Promise<void>;
  listPending(input: {
    registrationId?: string;
    since: string;
    limit: number;
  }): Promise<Array<{ registrationId: string; eventType: GhlEventType }>>;
}

export type GhlLogger = (
  level: "info" | "warn" | "error",
  message: string,
  meta?: Record<string, unknown>,
) => void;

const defaultLogger: GhlLogger = (level, message, meta) => {
  console[level](`[ghl] ${message}`, meta ?? {});
};

function errorMessage(error: unknown): string {
  if (error instanceof GhlApiError) return `${error.status}: ${error.message}`;
  return error instanceof Error ? error.message.slice(0, 200) : "unknown error";
}

export type GhlSyncResult =
  | { status: "sent"; contactId: string; isNewContact: boolean; retriggered: boolean }
  | { status: "skipped"; reason: string }
  | { status: "failed"; error: string };

export type GhlSyncService = ReturnType<typeof createGhlSyncService>;

export function createGhlSyncService(deps: {
  config: GhlConfig | null;
  ledger: GhlLedger;
  loadRegistration: (id: string) => Promise<GhlRegistration | null>;
  eventDate: string;
  client?: GhlClient;
  clientOptions?: GhlClientOptions;
  log?: GhlLogger;
  now?: () => Date;
}) {
  const log = deps.log ?? defaultLogger;
  const now = deps.now ?? (() => new Date());
  const client = deps.config
    ? (deps.client ?? createGhlClient(deps.config, deps.clientOptions))
    : null;
  let fieldIdsPromise: Promise<GhlFieldIds> | null = null;
  let fieldIdsAt = 0;

  function getFieldIds(force = false): Promise<GhlFieldIds> {
    if (!client || !deps.config) return Promise.resolve({});
    const fresh = !force && Date.now() - fieldIdsAt < 15 * 60_000;
    if (!fieldIdsPromise || !fresh) {
      fieldIdsAt = Date.now();
      fieldIdsPromise = provisionGhlLocation(client, deps.config.locationId, log).then((ids) => {
        // Do not keep a partial map cached for long (e.g. missing token scope).
        if (Object.keys(ids).length < GHL_CUSTOM_FIELDS.length)
          fieldIdsAt = Date.now() - 14 * 60_000;
        return ids;
      });
    }
    return fieldIdsPromise;
  }

  /**
   * mode "inline": called right after the Supabase write; creates the ledger row.
   * mode "retry": only re-delivers events that already have an unsent ledger row.
   */
  async function syncEvent(input: {
    registrationId: string;
    eventType: GhlEventType;
    mode: "inline" | "retry";
    sourceUrl?: string | null;
    /** Inline only: skip if the ledger is unavailable (used for repeated submits). */
    skipWithoutLedger?: boolean;
  }): Promise<GhlSyncResult> {
    const meta = {
      registration_id: input.registrationId,
      event: input.eventType,
      mode: input.mode,
    };
    if (!deps.config || !client) {
      log("warn", "GHL_PRIVATE_INTEGRATION_TOKEN or GHL_LOCATION_ID missing, sync skipped", meta);
      return { status: "skipped", reason: "not-configured" };
    }

    const reg = await deps.loadRegistration(input.registrationId);
    if (!reg) return { status: "skipped", reason: "registration-not-found" };
    if (input.eventType === "payment_submitted" && !reg.payment_submitted_at) {
      return { status: "skipped", reason: "payment-not-submitted" };
    }

    const claim = await deps.ledger.claim({
      registrationId: input.registrationId,
      eventType: input.eventType,
      sourceUrl: input.sourceUrl ?? null,
      createIfMissing: input.mode === "inline",
    });

    if (
      claim.kind === "sent" ||
      claim.kind === "busy" ||
      claim.kind === "exhausted" ||
      claim.kind === "missing"
    ) {
      return { status: "skipped", reason: `ledger-${claim.kind}` };
    }
    if (claim.kind === "unavailable" && (input.mode === "retry" || input.skipWithoutLedger)) {
      return { status: "skipped", reason: "ledger-unavailable" };
    }
    if (claim.kind === "unavailable") {
      log("warn", "sync ledger unavailable, delivering once without idempotency record", meta);
    }

    const sourceUrl =
      claim.kind === "claimed"
        ? (claim.sourceUrl ?? input.sourceUrl ?? null)
        : (input.sourceUrl ?? null);
    try {
      const fieldIds = await getFieldIds();
      const result = await deliverGhlEvent(
        client,
        reg,
        input.eventType,
        { locationId: deps.config.locationId, eventDate: deps.eventDate, sourceUrl, fieldIds },
        log,
        () => getFieldIds(true),
      );
      if (claim.kind === "claimed") await deps.ledger.complete(claim.id, result.contactId);
      log("info", "event delivered", {
        ...meta,
        new_contact: result.isNewContact,
        retriggered: result.retriggered,
        at: now().toISOString(),
      });
      return { status: "sent", ...result };
    } catch (error) {
      const message = errorMessage(error);
      if (claim.kind === "claimed") await deps.ledger.fail(claim.id, message);
      log("error", "event delivery failed", { ...meta, error: message });
      return { status: "failed", error: message };
    }
  }

  async function retryPending(
    input: { registrationId?: string; limit?: number; maxAgeHours?: number } = {},
  ) {
    const since = new Date(now().getTime() - (input.maxAgeHours ?? 72) * 3_600_000).toISOString();
    const pending = await deps.ledger.listPending({
      ...(input.registrationId ? { registrationId: input.registrationId } : {}),
      since,
      limit: input.limit ?? 25,
    });
    // Lead notifications must precede payment notifications for one registration.
    pending.sort((a, b) => (a.eventType === b.eventType ? 0 : a.eventType === "lead" ? -1 : 1));
    const results: Array<{
      registrationId: string;
      eventType: GhlEventType;
      result: GhlSyncResult;
    }> = [];
    for (const item of pending) {
      const result = await syncEvent({
        registrationId: item.registrationId,
        eventType: item.eventType,
        mode: "retry",
      });
      results.push({ ...item, result });
    }
    return results;
  }

  return { syncEvent, retryPending };
}

// ---------------------------------------------------------------------------
// Supabase-backed wiring (production)
// ---------------------------------------------------------------------------

type SupabaseAdmin = (typeof import("@/integrations/supabase/client.server"))["supabaseAdmin"];

export function createSupabaseGhlLedger(
  supabase: SupabaseAdmin,
  log: GhlLogger = defaultLogger,
  now: () => Date = () => new Date(),
): GhlLedger {
  const table = () => supabase.from("ghl_sync_events");

  return {
    async claim({ registrationId, eventType, sourceUrl, createIfMissing }) {
      try {
        if (createIfMissing) {
          const { error } = await table().upsert(
            { registration_id: registrationId, event_type: eventType, source_url: sourceUrl },
            { onConflict: "registration_id,event_type", ignoreDuplicates: true },
          );
          if (error) {
            log("warn", "ledger insert failed", { code: error.code, error: error.message });
            return { kind: "unavailable" };
          }
        }
        const { data: row, error } = await table()
          .select("id, status, attempts, locked_until, source_url")
          .eq("registration_id", registrationId)
          .eq("event_type", eventType)
          .maybeSingle();
        if (error) {
          log("warn", "ledger read failed", { code: error.code, error: error.message });
          return { kind: "unavailable" };
        }
        if (!row) return { kind: "missing" };
        if (row.status === "sent") return { kind: "sent" };
        if (row.attempts >= LEDGER_MAX_ATTEMPTS) return { kind: "exhausted" };
        const current = now();
        if (row.locked_until && new Date(row.locked_until).getTime() > current.getTime())
          return { kind: "busy" };

        // Optimistic lock: only one request can move `attempts` from N to N+1.
        const { data: claimed, error: claimError } = await table()
          .update({
            status: "processing",
            attempts: row.attempts + 1,
            locked_until: new Date(current.getTime() + LEDGER_LOCK_MS).toISOString(),
            updated_at: current.toISOString(),
          })
          .eq("id", row.id)
          .eq("attempts", row.attempts)
          .neq("status", "sent")
          .select("id");
        if (claimError || !claimed || claimed.length === 0) return { kind: "busy" };
        return { kind: "claimed", id: row.id, sourceUrl: row.source_url };
      } catch (error) {
        log("warn", "ledger unavailable", { error: errorMessage(error) });
        return { kind: "unavailable" };
      }
    },

    async complete(id, contactId) {
      const at = now().toISOString();
      const { error } = await table()
        .update({
          status: "sent",
          sent_at: at,
          ghl_contact_id: contactId,
          locked_until: null,
          last_error: null,
          updated_at: at,
        })
        .eq("id", id);
      if (error) log("error", "ledger complete failed", { code: error.code, error: error.message });
    },

    async fail(id, message) {
      const { error } = await table()
        .update({
          status: "failed",
          locked_until: null,
          last_error: message.slice(0, 500),
          updated_at: now().toISOString(),
        })
        .eq("id", id);
      if (error)
        log("error", "ledger fail update failed", { code: error.code, error: error.message });
    },

    async listPending({ registrationId, since, limit }) {
      try {
        let query = table()
          .select("registration_id, event_type, locked_until")
          .neq("status", "sent")
          .lt("attempts", LEDGER_MAX_ATTEMPTS)
          .gte("created_at", since)
          .order("created_at", { ascending: true })
          .limit(limit);
        if (registrationId) query = query.eq("registration_id", registrationId);
        const { data, error } = await query;
        if (error || !data) return [];
        const current = now().getTime();
        return data
          .filter((row) => !row.locked_until || new Date(row.locked_until).getTime() <= current)
          .filter(
            (row): row is typeof row & { event_type: GhlEventType } =>
              row.event_type === "lead" || row.event_type === "payment_submitted",
          )
          .map((row) => ({ registrationId: row.registration_id, eventType: row.event_type }));
      } catch {
        return [];
      }
    },
  };
}

let servicePromise: Promise<GhlSyncService> | null = null;

async function getDefaultGhlService(): Promise<GhlSyncService> {
  if (!servicePromise) {
    servicePromise = (async () => {
      const [{ supabaseAdmin }, { EVENT_DATE }] = await Promise.all([
        import("@/integrations/supabase/client.server"),
        import("@/components/tdc/event"),
      ]);
      return createGhlSyncService({
        config: readGhlConfig(),
        ledger: createSupabaseGhlLedger(supabaseAdmin),
        eventDate: EVENT_DATE,
        loadRegistration: async (id) => {
          const { data, error } = await supabaseAdmin
            .from("masterclass_registrations")
            .select(REGISTRATION_COLUMNS)
            .eq("id", id)
            .maybeSingle();
          if (error) throw new Error(`registration lookup failed: ${error.message}`);
          return data;
        },
      });
    })().catch((error) => {
      servicePromise = null;
      throw error;
    });
  }
  return servicePromise;
}

/**
 * Runs CRM work without ever breaking the visitor's flow: errors are swallowed,
 * the wait is capped, and on Cloudflare the promise is handed to waitUntil so
 * it can still finish if the cap is reached.
 */
async function runSafely<T>(
  label: string,
  task: () => Promise<T>,
  budgetMs = 9000,
): Promise<T | null> {
  const promise = task().catch((error: unknown) => {
    defaultLogger("error", `${label} crashed`, { error: errorMessage(error) });
    return null;
  });
  try {
    const { getRequest } = await import("@tanstack/react-start/server");
    const request = getRequest() as Request & { waitUntil?: (p: Promise<unknown>) => void };
    if (typeof request?.waitUntil === "function") request.waitUntil(promise);
  } catch {
    /* no request context (tests / cron) */
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => {
      defaultLogger("warn", `${label} exceeded ${budgetMs}ms budget, continuing in background`);
      resolve(null);
    }, budgetMs);
  });
  const result = await Promise.race([promise, timeout]);
  clearTimeout(timer);
  return result;
}

async function readRefererUrl(): Promise<string | null> {
  try {
    const { getRequestHeader } = await import("@tanstack/react-start/server");
    return sanitizeSourceUrl(getRequestHeader("referer"));
  } catch {
    return null;
  }
}

/** Step 1 saved in Supabase -> "TDC Masterclass Lead". */
export async function syncLeadToGhl(registrationId: string): Promise<GhlSyncResult | null> {
  const sourceUrl = await readRefererUrl();
  return runSafely("lead sync", async () => {
    const service = await getDefaultGhlService();
    return service.syncEvent({ registrationId, eventType: "lead", mode: "inline", sourceUrl });
  });
}

/** Payment proof (or free registration) saved in Supabase -> "TDC Masterclass Payment Submitted". */
export async function syncPaymentSubmittedToGhl(
  registrationId: string,
  opts: { previouslySubmitted: boolean },
): Promise<GhlSyncResult | null> {
  const sourceUrl = await readRefererUrl();
  return runSafely("payment sync", async () => {
    const service = await getDefaultGhlService();
    // If step 1's lead delivery failed, deliver it first (no-op when already sent).
    await service.syncEvent({ registrationId, eventType: "lead", mode: "retry" });
    return service.syncEvent({
      registrationId,
      eventType: "payment_submitted",
      mode: "inline",
      sourceUrl,
      skipWithoutLedger: opts.previouslySubmitted,
    });
  });
}

/** Safe to call on every thank-you page load: only unsent ledger rows are delivered. */
export async function retryGhlSyncForRegistration(registrationId: string) {
  return runSafely("registration retry", async () => {
    const service = await getDefaultGhlService();
    return service.retryPending({ registrationId, limit: 2 });
  });
}

/** Scheduled sweep for failed deliveries (e.g. leads that never reached step 2). */
export async function retryPendingGhlSyncs(limit = 25) {
  const service = await getDefaultGhlService();
  return service.retryPending({ limit });
}
