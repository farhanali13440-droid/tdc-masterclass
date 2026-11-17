import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";

const eventSchema = z.object({
  eventName: z.enum([
    "ViewContent",
    "InitiateCheckout",
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
  registrationId: z.string().uuid().optional(),
  checkoutToken: z.string().uuid().optional(),
  userData: z
    .object({
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
      const { sendMetaCapiEvent } = await import("./meta.server");

      // Events tied to a registration require its private checkout token, and
      // Purchase additionally requires a saved payment submission.
      const registrationEvents = ["CompleteRegistration", "AddPaymentInfo", "SubmitApplication", "Lead", "Purchase"];
      if (data.registrationId || data.eventName === "Purchase") {
        if (!data.registrationId || !data.checkoutToken) return { ok: false };
        const { getOwnedRegistration } = await import("./registration-token.server");
        const owned = await getOwnedRegistration(data.registrationId, data.checkoutToken);
        if (!owned) return { ok: false };
        if (data.eventName === "Purchase" && !owned.payment_submitted_at) return { ok: false };
      } else if (registrationEvents.includes(data.eventName) && data.eventName !== "Lead") {
        return { ok: false };
      }
      // Value is fixed server-side; callers cannot choose amounts.
      const valued = data.eventName === "Purchase" || data.eventName === "InitiateCheckout";

      const result = await sendMetaCapiEvent(
        {
          eventName: data.eventName,
          eventId: data.eventId,
          eventSourceUrl: data.eventSourceUrl,
          ...(data.eventTime !== undefined ? { eventTime: data.eventTime } : {}),
          ...(valued ? { value: 499, currency: "PKR" } : {}),
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
