-- Adiciona colunas para acessórios
ALTER TABLE public.orcamentos 
ADD COLUMN IF NOT EXISTS acessorios JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS custo_acessorios DECIMAL(10,2) DEFAULT 0;

-- Adiciona colunas para embalagem (garantindo que todas existam)
ALTER TABLE public.orcamentos 
ADD COLUMN IF NOT EXISTS embalagem_estoque_id UUID,
ADD COLUMN IF NOT EXISTS embalagem_custo DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS embalagem_quantidade INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS quantidade_embalagem INTEGER DEFAULT 1;

-- Adiciona coluna para referência de filamento no estoque
ALTER TABLE public.orcamentos 
ADD COLUMN IF NOT EXISTS filamento_estoque_id UUID;

-- Comentários para documentação
COMMENT ON COLUMN public.orcamentos.acessorios IS 'Lista de acessórios utilizados no orçamento';
COMMENT ON COLUMN public.orcamentos.custo_acessorios IS 'Custo total somado de todos os acessórios';
COMMENT ON COLUMN public.orcamentos.filamento_estoque_id IS 'ID do filamento principal no estoque';
COMMENT ON COLUMN public.orcamentos.embalagem_estoque_id IS 'ID da embalagem no estoque';
