ALTER TABLE public.impressoras
  ADD COLUMN IF NOT EXISTS consumo_medio_watts numeric,
  ADD COLUMN IF NOT EXISTS potencia_nominal_watts numeric,
  ADD COLUMN IF NOT EXISTS origem_consumo text,
  ADD COLUMN IF NOT EXISTS origem_custo text,
  ADD COLUMN IF NOT EXISTS preco_referencia_data date,
  ADD COLUMN IF NOT EXISTS catalogo_id uuid REFERENCES public.impressoras(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'impressoras_origem_custo_check'
  ) THEN
    ALTER TABLE public.impressoras
      ADD CONSTRAINT impressoras_origem_custo_check
      CHECK (origem_custo IS NULL OR origem_custo IN ('media_mercado', 'informado'));
  END IF;
END $$;