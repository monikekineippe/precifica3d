ALTER TABLE public.impressoras
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT false;

-- Garantir que as impressoras pré-cadastradas marcadas como "ativas" no frontend sejam refletidas aqui se necessário,
-- mas por padrão todas começam como false ou o que o usuário desejar.
-- Se já houver dados, podemos querer ativar as que o usuário já estava usando.
UPDATE public.impressoras SET is_active = true WHERE is_active IS NULL;
