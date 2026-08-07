-- Ensure the column exists with correct defaults
ALTER TABLE public.impressoras ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT false;

-- Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.impressoras TO authenticated;
GRANT ALL ON public.impressoras TO service_role;
