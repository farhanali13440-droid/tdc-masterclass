CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_percent integer NOT NULL,
  expires_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.coupons TO service_role;

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.masterclass_registrations
  ADD COLUMN coupon_code text,
  ADD COLUMN original_amount_pkr integer NOT NULL DEFAULT 499,
  ADD COLUMN discount_amount_pkr integer NOT NULL DEFAULT 0;
