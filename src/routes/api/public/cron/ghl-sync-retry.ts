import { createFileRoute } from "@tanstack/react-router";

import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

/**
 * Optional scheduled sweep: re-delivers GHL events whose delivery failed
 * (for example a lead that never reached step 2 while GHL was unavailable).
 * Protected by LOVABLE_CRON_SECRET (Authorization: Bearer <secret>).
 * Idempotent: events already marked sent in ghl_sync_events are never resent.
 */
export const Route = createFileRoute("/api/public/cron/ghl-sync-retry")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauthorized = await authenticateCronRequest(request);
        if (unauthorized) return unauthorized;
        try {
          const { retryPendingGhlSyncs } = await import("@/lib/ghl.server");
          const results = await retryPendingGhlSyncs(25);
          const summary = results.reduce<Record<string, number>>((acc, item) => {
            acc[item.result.status] = (acc[item.result.status] ?? 0) + 1;
            return acc;
          }, {});
          return Response.json({ ok: true, processed: results.length, ...summary });
        } catch (error) {
          console.error("[ghl] cron retry failed", error instanceof Error ? error.message : error);
          return Response.json({ ok: false }, { status: 500 });
        }
      },
    },
  },
});
