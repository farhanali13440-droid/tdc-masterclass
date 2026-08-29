-- Two-step checkout and protected payment-proof support.
ALTER TABLE public.masterclass_registrations
  ADD COLUMN IF NOT EXISTS lead_status text NOT NULL DEFAULT 'Opted In',
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'Payment Pending',
  ADD COLUMN IF NOT EXISTS registration_status text NOT NULL DEFAULT 'Opted In',
  ADD COLUMN IF NOT EXISTS payment_submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS checkout_token uuid;

CREATE INDEX IF NOT EXISTS masterclass_registrations_created_at_idx
  ON public.masterclass_registrations (created_at DESC);

-- The public client never reads registration records. All creation and updates
-- happen through server functions using the service role. Payment proofs are in
-- a private bucket; only an authenticated administrator receives short-lived URLs.
REVOKE ALL ON public.masterclass_registrations FROM anon, authenticated;
GRANT ALL ON public.masterclass_registrations TO service_role;

ALTER TABLE public.masterclass_registrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can create registrations" ON public.masterclass_registrations;
DROP POLICY IF EXISTS "Public can update registrations" ON public.masterclass_registrations;
DROP POLICY IF EXISTS "Public can read registrations" ON public.masterclass_registrations;

INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Public checkout proof upload" ON storage.objects;
CREATE POLICY "Public checkout proof upload"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (
  bucket_id = 'payment-proofs'
  AND (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
);

DROP POLICY IF EXISTS "Public payment-proof access" ON storage.objects;
