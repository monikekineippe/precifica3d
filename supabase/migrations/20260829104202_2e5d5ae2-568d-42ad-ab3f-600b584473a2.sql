ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS sales_channels jsonb;
ALTER TABLE public.orcamentos ADD COLUMN IF NOT EXISTS canais_venda jsonb;