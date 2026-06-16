
-- Add admin/whatsapp/ultimo_acesso to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS ultimo_acesso timestamptz;

-- Mark admin user
UPDATE public.profiles SET is_admin = true WHERE email = 'financeiro@monikekineippe.com.br';

-- Update handle_new_user trigger to also save whatsapp (keeps existing fields)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email, telefone, instagram, whatsapp, plano)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'telefone', ''),
    COALESCE(NEW.raw_user_meta_data->>'instagram', ''),
    COALESCE(NEW.raw_user_meta_data->>'whatsapp', NEW.raw_user_meta_data->>'telefone', ''),
    'free'
  );
  RETURN NEW;
END;
$function$;

-- eventos_uso table
CREATE TABLE IF NOT EXISTS public.eventos_uso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('calculo','orcamento')),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.eventos_uso TO authenticated;
GRANT ALL ON public.eventos_uso TO service_role;

ALTER TABLE public.eventos_uso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own usage events"
  ON public.eventos_uso FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own usage events"
  ON public.eventos_uso FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all usage events"
  ON public.eventos_uso FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.is_admin = true));

CREATE INDEX IF NOT EXISTS eventos_uso_user_id_idx ON public.eventos_uso(user_id);
CREATE INDEX IF NOT EXISTS eventos_uso_created_at_idx ON public.eventos_uso(created_at);

-- Allow admins to read all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.is_admin = true));
