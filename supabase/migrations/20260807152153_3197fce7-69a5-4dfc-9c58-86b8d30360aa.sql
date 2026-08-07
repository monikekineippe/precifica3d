UPDATE public.cash_transactions ct
SET profit_amount = s.profit_amount
FROM public.sales s
WHERE ct.sale_id = s.id;