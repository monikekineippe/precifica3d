
-- Make user_id nullable for preset printers
ALTER TABLE public.impressoras ALTER COLUMN user_id DROP NOT NULL;

-- Update SELECT policy to allow viewing presets with null user_id
DROP POLICY IF EXISTS "Users can view own and preset printers" ON public.impressoras;
CREATE POLICY "Users can view own and preset printers" ON public.impressoras
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_precadastrada = true);
