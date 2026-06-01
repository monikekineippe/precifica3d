-- Add category and last_purchase_date to inventory table
ALTER TABLE public.inventory 
ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'raw_material',
ADD COLUMN IF NOT EXISTS last_purchase_date TIMESTAMP WITH TIME ZONE;

-- Update existing items to 'raw_material' (already default, but good to be sure)
UPDATE public.inventory SET category = 'raw_material' WHERE category IS NULL;
