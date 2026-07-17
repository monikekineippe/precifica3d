
ALTER TABLE public.encomendas
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_encomendas_client_id ON public.encomendas(client_id);

-- Backfill: cria clientes que só existem em encomendas
WITH enc AS (
  SELECT
    e.id,
    e.user_id,
    e.cliente_nome,
    e.whatsapp,
    NULLIF(regexp_replace(COALESCE(e.whatsapp, ''), '\D', '', 'g'), '') AS wa_digits
  FROM public.encomendas e
  WHERE e.client_id IS NULL
),
matched AS (
  SELECT
    enc.*,
    (
      SELECT c.id FROM public.clients c
      WHERE c.user_id = enc.user_id
        AND (
          (enc.wa_digits IS NOT NULL
            AND NULLIF(regexp_replace(COALESCE(c.whatsapp, ''), '\D', '', 'g'), '') = enc.wa_digits)
          OR (enc.wa_digits IS NULL
            AND lower(trim(c.name)) = lower(trim(enc.cliente_nome)))
        )
      LIMIT 1
    ) AS existing_client_id
  FROM enc
),
to_create AS (
  SELECT DISTINCT ON (user_id, COALESCE(wa_digits, lower(trim(cliente_nome))))
    user_id, cliente_nome, whatsapp, wa_digits
  FROM matched
  WHERE existing_client_id IS NULL
    AND cliente_nome IS NOT NULL
    AND trim(cliente_nome) <> ''
),
created AS (
  INSERT INTO public.clients (user_id, name, whatsapp, preferred_channel)
  SELECT user_id, trim(cliente_nome), whatsapp, 'whatsapp'
  FROM to_create
  RETURNING id, user_id, name, whatsapp
)
UPDATE public.encomendas e
SET client_id = c.id
FROM public.clients c
WHERE e.client_id IS NULL
  AND c.user_id = e.user_id
  AND (
    (
      NULLIF(regexp_replace(COALESCE(e.whatsapp, ''), '\D', '', 'g'), '') IS NOT NULL
      AND NULLIF(regexp_replace(COALESCE(e.whatsapp, ''), '\D', '', 'g'), '')
        = NULLIF(regexp_replace(COALESCE(c.whatsapp, ''), '\D', '', 'g'), '')
    )
    OR (
      NULLIF(regexp_replace(COALESCE(e.whatsapp, ''), '\D', '', 'g'), '') IS NULL
      AND lower(trim(c.name)) = lower(trim(e.cliente_nome))
    )
  );
