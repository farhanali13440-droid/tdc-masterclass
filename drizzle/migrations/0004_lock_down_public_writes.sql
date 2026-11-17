DROP POLICY IF EXISTS "Anyone can submit a registration" ON public.masterclass_registrations;
REVOKE INSERT ON public.masterclass_registrations FROM anon, authenticated;
DROP POLICY IF EXISTS "Anyone can upload a payment proof" ON storage.objects;