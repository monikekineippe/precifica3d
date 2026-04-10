
-- Drop old constraint first
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plano_check;

-- Update existing data
UPDATE public.profiles SET plano = 'mensal' WHERE plano = 'pro';
UPDATE public.profiles SET plano = 'anual' WHERE plano = 'vitalicio';

-- Add new constraint
ALTER TABLE public.profiles ADD CONSTRAINT profiles_plano_check CHECK (plano IN ('free', 'mensal', 'anual'));
