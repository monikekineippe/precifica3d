
CREATE TABLE public.encomenda_pagamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  encomenda_id UUID NOT NULL REFERENCES public.encomendas(id) ON DELETE CASCADE,
  valor NUMERIC NOT NULL DEFAULT 0,
  data_pagamento DATE NOT NULL DEFAULT CURRENT_DATE,
  forma_pagamento TEXT NOT NULL DEFAULT 'pix',
  observacao TEXT,
  cash_transaction_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.encomenda_pagamentos TO authenticated;
GRANT ALL ON public.encomenda_pagamentos TO service_role;

ALTER TABLE public.encomenda_pagamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own encomenda pagamentos select" ON public.encomenda_pagamentos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own encomenda pagamentos insert" ON public.encomenda_pagamentos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own encomenda pagamentos update" ON public.encomenda_pagamentos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own encomenda pagamentos delete" ON public.encomenda_pagamentos FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_encomenda_pagamentos_updated_at
BEFORE UPDATE ON public.encomenda_pagamentos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_encomenda_pagamentos_encomenda ON public.encomenda_pagamentos(encomenda_id);
CREATE INDEX idx_encomenda_pagamentos_user ON public.encomenda_pagamentos(user_id);

ALTER TABLE public.cash_transactions
  ADD COLUMN IF NOT EXISTS encomenda_id UUID REFERENCES public.encomendas(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS encomenda_pagamento_id UUID REFERENCES public.encomenda_pagamentos(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS transaction_date DATE;

CREATE INDEX IF NOT EXISTS idx_cash_transactions_encomenda ON public.cash_transactions(encomenda_id);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_pagamento ON public.cash_transactions(encomenda_pagamento_id);
