// Server-only Meta Conversions API helpers.
// META_CAPI_ACCESS_TOKEN is read here and NEVER returned to the client.

const GRAPH_VERSION = "v21.0";

export type MetaUserData = {
  email?: string | undefined;
  phone?: string | undefined;
  firstName?: string | undefined;
  lastName?: string | undefined;
  city?: string | undefined;
  externalId?: string | undefined;
  fbp?: string | undefined;
  fbc?: string | undefined;
};

export type MetaEventInput = {
  eventName: string;
  eventId: string;
  eventSourceUrl: string;
  eventTime?: number | undefined;
  value?: number | undefined;
  currency?: string | undefined;
  userData?: MetaUserData | undefined;
};

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Meta normalization: trim + lowercase, strip nothing else for names/emails. */
async function hashNormalized(value: string | undefined): Promise<string | undefined> {
  const normalized = (value ?? "").trim().toLowerCase();
  if (!normalized) return undefined;
  return sha256(normalized);
}

/** Phones: digits only, default Pakistan country code for local 03xx numbers. */
async function hashPhone(value: string | undefined): Promise<string | undefined> {
  let digits = (value ?? "").replace(/\D/g, "");
  if (!digits) return undefined;
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = `92${digits.slice(1)}`;
  else if (digits.length === 10) digits = `92${digits}`;
  return sha256(digits);
}

async function buildUserData(
  input: MetaUserData | undefined,
  clientIp: string | undefined,
  clientUserAgent: string | undefined,
): Promise<Record<string, unknown>> {
  const userData: Record<string, unknown> = {};

  const em = await hashNormalized(input?.email);
  if (em) userData['em'] = [em];
  const ph = await hashPhone(input?.phone);
  if (ph) userData['ph'] = [ph];
  const fn = await hashNormalized(input?.firstName);
  if (fn) userData['fn'] = [fn];
  const ln = await hashNormalized(input?.lastName);
  if (ln) userData['ln'] = [ln];
  const ct = await hashNormalized(input?.city?.replace(/\s/g, ""));
  if (ct) userData['ct'] = [ct];
  const externalId = input?.externalId?.trim();
  if (externalId) userData['external_id'] = [await sha256(externalId.toLowerCase())];

  // NOT hashed, per Meta's requirements.
  if (input?.fbp) userData['fbp'] = input.fbp;
  if (input?.fbc) userData['fbc'] = input.fbc;
  if (clientIp) userData['client_ip_address'] = clientIp;
  if (clientUserAgent) userData['client_user_agent'] = clientUserAgent;

  return userData;
}

export async function sendMetaCapiEvent(
  input: MetaEventInput,
  request: { userAgent?: string | undefined; ip?: string | undefined },
): Promise<{ ok: boolean }> {
  const pixelId = process.env['META_PIXEL_ID'];
  const accessToken = process.env['META_CAPI_ACCESS_TOKEN'];
  const testEventCode = process.env['META_TEST_EVENT_CODE'];

  if (!pixelId || !accessToken) {
    console.warn("[meta-capi] missing META_PIXEL_ID or META_CAPI_ACCESS_TOKEN — event skipped", {
      event_name: input.eventName,
      event_id: input.eventId,
    });
    return { ok: false };
  }

  const eventTime = input.eventTime ?? Math.floor(Date.now() / 1000);
  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: input.eventName,
        event_time: eventTime,
        event_id: input.eventId,
        event_source_url: input.eventSourceUrl,
        action_source: "website",
        user_data: await buildUserData(input.userData, request.ip, request.userAgent),
        ...(input.value !== undefined
          ? { custom_data: { value: input.value, currency: input.currency ?? "PKR" } }
          : {}),
      },
    ],
  };
  if (testEventCode) payload['test_event_code'] = testEventCode;

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(
    accessToken,
  )}`;

  // Never let Meta failures break the user flow: one retry, then give up quietly.
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.text();
      // Log only non-sensitive diagnostics — never the token or customer PII.
      console.info("[meta-capi]", {
        event_name: input.eventName,
        event_id: input.eventId,
        event_time: eventTime,
        status: response.status,
        ...(response.ok ? {} : { error: body.slice(0, 500) }),
      });
      if (response.ok) return { ok: true };
      // 4xx responses are not retryable.
      if (response.status < 500) return { ok: false };
    } catch (error) {
      console.error("[meta-capi] request failed", {
        event_name: input.eventName,
        event_id: input.eventId,
        attempt,
        error: error instanceof Error ? error.message : "unknown error",
      });
    }
  }

  return { ok: false };
}

/** Reads the payment verification state of a registration (service role, server-only). */
export async function getRegistrationPaymentState(
  registrationId: string,
): Promise<{ exists: boolean; confirmed: boolean; status: string | null }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("masterclass_registrations")
    .select("id, status")
    .eq("id", registrationId)
    .maybeSingle();

  if (error) {
    console.error("[meta-capi] registration lookup failed", { error: error.message });
    return { exists: false, confirmed: false, status: null };
  }
  if (!data) return { exists: false, confirmed: false, status: null };

  const status = data.status ?? null;
  const confirmed = ["verified", "confirmed", "paid", "approved"].includes(
    (status ?? "").toLowerCase(),
  );
  return { exists: true, confirmed, status };
}
