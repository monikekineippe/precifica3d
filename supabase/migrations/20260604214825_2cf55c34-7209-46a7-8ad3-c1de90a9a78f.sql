ALTER TABLE public.cash_transactions 
ADD COLUMN IF NOT EXISTS auto_inventory_update BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS inventory_data JSONB;

COMMENT ON COLUMN public.cash_transactions.auto_inventory_update IS 'Indicates if this transaction triggered an automatic inventory update';
COMMENT ON COLUMN public.cash_transactions.inventory_data IS 'Details about the inventory update triggered by this transaction';
