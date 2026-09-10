import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Thank-you page safety net: re-delivers GHL events for this registration that
 * are recorded as NOT yet sent (e.g. GHL was briefly down during checkout).
 * Idempotent per registration id + event, so refreshing /thank-you never
 * creates another lead, payment update or notification. Returns no data.
 */
export const retryRegistrationCrmSync = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ registrationId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    try {
      const { retryGhlSyncForRegistration } = await import("./ghl.server");
      await retryGhlSyncForRegistration(data.registrationId);
    } catch (error) {
      console.error("[ghl] thank-you retry failed", error instanceof Error ? error.message : error);
    }
    return { ok: true };
  });
