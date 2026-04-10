
ALTER TABLE public.user_settings
  ADD COLUMN pix_discount numeric NOT NULL DEFAULT 0,
  ADD COLUMN card_fee_percent numeric NOT NULL DEFAULT 4.99,
  ADD COLUMN max_installments integer NOT NULL DEFAULT 12;
