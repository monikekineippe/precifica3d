CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id AND is_admin = true
  );
$$;

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all usage events" ON public.eventos_uso;
CREATE POLICY "Admins can view all usage events"
ON public.eventos_uso
FOR SELECT
TO authenticated
USING (private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all quotes" ON public.orcamentos;
CREATE POLICY "Admins can view all quotes"
ON public.orcamentos
FOR SELECT
TO authenticated
USING (private.is_admin(auth.uid()));

DROP FUNCTION IF EXISTS public.is_admin(uuid);