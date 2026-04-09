ALTER TABLE public.user_settings
  ADD COLUMN default_printer_id uuid DEFAULT NULL,
  ADD COLUMN default_state text DEFAULT NULL,
  ADD COLUMN default_city text DEFAULT NULL;