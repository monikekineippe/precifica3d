CREATE POLICY "Admins can view all quotes"
ON public.orcamentos
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));