ALTER TABLE public.impressoras ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.impressoras TO authenticated;
GRANT ALL ON public.impressoras TO service_role;