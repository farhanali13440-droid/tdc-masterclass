CREATE TABLE public.masterclass_registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name text NOT NULL,
  whatsapp text NOT NULL,
  email text NOT NULL,
  city text NOT NULL,
  age integer,
  has_diabetes text,
  diabetes_type text,
  payment_proof_path text NOT NULL,
  amount_pkr integer NOT NULL DEFAULT 499,
  status text NOT NULL DEFAULT 'pending_verification',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.masterclass_registrations TO anon;
GRANT INSERT ON public.masterclass_registrations TO authenticated;
GRANT ALL ON public.masterclass_registrations TO service_role;

ALTER TABLE public.masterclass_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a registration"
ON public.masterclass_registrations
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can upload a payment proof"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'payment-proofs');