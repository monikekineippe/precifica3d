
-- Add email column to existing profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text DEFAULT '';

-- Create impressoras table
CREATE TABLE public.impressoras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  cinematica text NOT NULL DEFAULT 'cartesiana',
  custo_aquisicao numeric NOT NULL DEFAULT 0,
  vida_util_horas numeric NOT NULL DEFAULT 0,
  consumo_watts numeric NOT NULL DEFAULT 0,
  custo_manutencao_mensal numeric NOT NULL DEFAULT 0,
  horas_uso_mensal numeric NOT NULL DEFAULT 0,
  max_filamentos integer NOT NULL DEFAULT 1,
  is_precadastrada boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create orcamentos table
CREATE TABLE public.orcamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_peca text NOT NULL,
  impressora_id uuid REFERENCES public.impressoras(id) ON DELETE SET NULL,
  impressora_nome text NOT NULL DEFAULT '',
  tempo_horas numeric NOT NULL DEFAULT 0,
  tempo_minutos numeric NOT NULL DEFAULT 0,
  filamentos jsonb NOT NULL DEFAULT '[]'::jsonb,
  estado text,
  cidade text,
  distribuidora text,
  tarifa_energia numeric NOT NULL DEFAULT 0.85,
  custo_energia numeric NOT NULL DEFAULT 0,
  modo_mao_de_obra text NOT NULL DEFAULT 'automatico',
  custo_mao_de_obra numeric NOT NULL DEFAULT 0,
  percentual_mao_de_obra numeric,
  valor_hora_mao_de_obra numeric,
  horas_mao_de_obra numeric,
  custo_manutencao numeric NOT NULL DEFAULT 0,
  custo_depreciacao numeric NOT NULL DEFAULT 0,
  tipo_embalagem text NOT NULL DEFAULT 'none',
  custo_embalagem numeric NOT NULL DEFAULT 0,
  margem_lucro numeric NOT NULL DEFAULT 50,
  percentual_impostos numeric NOT NULL DEFAULT 6,
  custo_total numeric NOT NULL DEFAULT 0,
  preco_minimo numeric NOT NULL DEFAULT 0,
  preco_sugerido numeric NOT NULL DEFAULT 0,
  lucro_liquido numeric NOT NULL DEFAULT 0,
  categoria_ia text,
  margem_minima_ia numeric,
  margem_sugerida_ia numeric,
  margem_maxima_ia numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.impressoras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;

-- RLS policies for impressoras
CREATE POLICY "Users can view own and preset printers" ON public.impressoras
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_precadastrada = true);

CREATE POLICY "Users can insert own printers" ON public.impressoras
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own printers" ON public.impressoras
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own printers" ON public.impressoras
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- RLS policies for orcamentos
CREATE POLICY "Users can view own quotes" ON public.orcamentos
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quotes" ON public.orcamentos
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quotes" ON public.orcamentos
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own quotes" ON public.orcamentos
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Update profiles RLS to use id instead of user_id for new policy pattern
-- (existing policies already use user_id, which is correct)

-- Update trigger to also set email from auth metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email, plano)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, ''),
    'free'
  );
  RETURN NEW;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
