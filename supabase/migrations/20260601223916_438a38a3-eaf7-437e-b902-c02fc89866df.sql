-- Add inventory_item_id to sales table if it doesn't exist
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS inventory_item_id UUID REFERENCES public.inventory(id) ON DELETE SET NULL;

-- Ensure users can update their own sales
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sales' AND policyname = 'Users can update their own sales'
    ) THEN
        CREATE POLICY "Users can update their own sales" 
        ON public.sales 
        FOR UPDATE 
        USING (auth.uid() = user_id);
    END IF;
END $$;
