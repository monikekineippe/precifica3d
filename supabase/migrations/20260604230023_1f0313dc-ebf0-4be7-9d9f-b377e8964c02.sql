ALTER TABLE public.orcamentos 
ADD COLUMN IF NOT EXISTS acessorios JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS embalagem_estoque_id UUID REFERENCES public.inventory(id),
ADD COLUMN IF NOT EXISTS embalagem_custo DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS embalagem_quantidade INTEGER DEFAULT 1;

-- Garantir que as permissões continuem válidas para as novas colunas
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orcamentos TO authenticated;
GRANT ALL ON public.orcamentos TO service_role;