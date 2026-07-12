
CREATE SEQUENCE IF NOT EXISTS public.encomendas_codigo_seq START 1;

CREATE TABLE public.encomendas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  codigo TEXT NOT NULL,
  cliente_nome TEXT NOT NULL,
  whatsapp TEXT,
  produto TEXT NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  descricao TEXT,
  valor_total NUMERIC NOT NULL DEFAULT 0,
  sinal_recebido BOOLEAN NOT NULL DEFAULT false,
  sinal_valor NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'recebida',
  data_encomenda TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_entrega TIMESTAMPTZ,
  observacoes TEXT,
  inventory_item_id UUID,
  estoque_deduzido BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.encomendas TO authenticated;
GRANT ALL ON public.encomendas TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.encomendas_codigo_seq TO authenticated, service_role;

ALTER TABLE public.encomendas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own encomendas" ON public.encomendas
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_encomendas_updated_at
  BEFORE UPDATE ON public.encomendas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_encomendas_user_status ON public.encomendas(user_id, status);
