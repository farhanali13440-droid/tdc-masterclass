-- GoHighLevel CRM sync ledger.
-- One row per (registration, CRM event). The unique key is the idempotency key
-- that stops page refreshes, repeated requests and retries from creating
-- duplicate GHL notifications. Server-only: written with the service role.
CREATE TABLE IF NOT EXISTS public.ghl_sync_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL REFERENCES public.masterclass_registrations(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('lead', 'payment_submitted')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  attempts integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  ghl_contact_id text,
  source_url text,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ghl_sync_events_registration_event_key UNIQUE (registration_id, event_type)
);

CREATE INDEX IF NOT EXISTS ghl_sync_events_retry_idx
  ON public.ghl_sync_events (status, created_at);

REVOKE ALL ON public.ghl_sync_events FROM anon, authenticated;
GRANT ALL ON public.ghl_sync_events TO service_role;

ALTER TABLE public.ghl_sync_events ENABLE ROW LEVEL SECURITY;
