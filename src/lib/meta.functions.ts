import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";

const eventSchema = z.object({
  eventName: z.enum([
    "Lead",
    "Contact",
    "SubmitApplication",
    "AddPaymentInfo",
    "CompleteRegistration",
    "Purchase",
  ]),
  eventId: z.string().min(3).max(120),
  eventSourceUrl: z.string().url().max(1000),
  eventTime: z.number().int().positive().optional(),
  value: z.number().nonnegative().optional(),
  currency: z.string().length(3).optional(),
  registrationId: z.string().uuid().optional(),
  userData: z
    .object({
      email: z.string().max(255).optional(),
      phone: z.string().max(40).optional(),
      firstName: z.string().max(100).optional(),
      lastName: z.string().max(100).optional(),
      city: z.string().max(100).optional(),
      externalId: z.string().max(120).optional(),
      fbp: z.string().max(200).optional(),
      fbc: z.string().max(400).optional(),
    })
    .optional(),
});

/** Public config only — the CAPI access token is never returned. */
export const getMetaPixelId = createServerFn({ method: "GET" }).handler(async () => {
  return { pixelId: process.env['META_PIXEL_ID'] ?? null };
});

export const trackMetaEvent = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => eventSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      const { sendMetaCapiEvent, getRegistrationPaymentState } = await import("./meta.server");

      // Purchase is only ever reported for a registration whose payment the
      // TDC team has actually verified in the database.
      if (data.eventName === "Purchase") {
        if (!data.registrationId) return { ok: false, skipped: "no-registration" as const };
        const state = await getRegistrationPaymentState(data.registrationId);
        if (!state.confirmed) return { ok: false, skipped: "payment-not-confirmed" as const };
      }

      const result = await sendMetaCapiEvent(
        {
          eventName: data.eventName,
          eventId: data.eventId,
          eventSourceUrl: data.eventSourceUrl,
          ...(data.eventTime !== undefined ? { eventTime: data.eventTime } : {}),
          ...(data.value !== undefined ? { value: data.value } : {}),
          ...(data.currency !== undefined ? { currency: data.currency } : {}),
          ...(data.userData ? { userData: data.userData } : {}),
        },
        {
          userAgent: getRequestHeader("user-agent"),
          ip: getRequestIP({ xForwardedFor: true }),
        },
      );
      return { ok: result.ok };
    } catch (error) {
      console.error("[meta-capi] handler error", {
        error: error instanceof Error ? error.message : "unknown error",
      });
      return { ok: false };
    }
  });

/** Lets the thank-you page ask whether payment has been confirmed (no PII returned). */
export const getRegistrationConfirmation = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ registrationId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    try {
      const { getRegistrationPaymentState } = await import("./meta.server");
      const state = await getRegistrationPaymentState(data.registrationId);
      return { exists: state.exists, confirmed: state.confirmed };
    } catch {
      return { exists: false, confirmed: false };
    }
  });
