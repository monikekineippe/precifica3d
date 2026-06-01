ALTER TABLE public.sales
ADD COLUMN IF NOT EXISTS origin_channel TEXT,
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_fee_percent NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_fee_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS gross_value NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS net_value NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS product_cost NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS profit_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS profit_margin_percent NUMERIC DEFAULT 0;

-- Update existing records if any to have basic values
UPDATE public.sales
SET gross_value = total_amount,
    net_value = total_amount,
    profit_amount = total_amount
WHERE gross_value = 0 OR gross_value IS NULL;
