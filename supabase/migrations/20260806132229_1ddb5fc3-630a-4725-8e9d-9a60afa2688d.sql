ALTER TABLE public.encomendas 
ADD COLUMN IF NOT EXISTS shipping_method text,
ADD COLUMN IF NOT EXISTS tracking_code text,
ADD COLUMN IF NOT EXISTS installments integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_refunded boolean DEFAULT false;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.encomendas TO authenticated;
GRANT ALL ON public.encomendas TO service_role;
