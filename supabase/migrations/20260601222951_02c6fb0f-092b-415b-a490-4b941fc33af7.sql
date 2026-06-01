-- Add primary_printer_id to profiles table if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS primary_printer_id UUID REFERENCES public.impressoras(id) ON DELETE SET NULL;

-- Ensure users can update their own profile
-- (Select/Insert/Update policies for profiles often already exist, but we ensure update for the new column)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Users can update their own profile'
    ) THEN
        CREATE POLICY "Users can update their own profile" 
        ON public.profiles 
        FOR UPDATE 
        USING (auth.uid() = user_id);
    END IF;
END $$;
