
-- =========================================================
-- 1) Protect produtos.lucro from public read access
-- =========================================================
-- Revoke column-level SELECT on lucro from public roles.
-- Admins will read lucro via SECURITY DEFINER RPC below.
REVOKE SELECT (lucro) ON public.produtos FROM anon, authenticated;

-- RPC for admins to read products WITH lucro for editing.
CREATE OR REPLACE FUNCTION public.get_produtos_admin()
RETURNS SETOF public.produtos
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;
  RETURN QUERY SELECT * FROM public.produtos ORDER BY ordem ASC, created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_produtos_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_produtos_admin() TO authenticated;

-- =========================================================
-- 2) Lock down comprovantes storage uploads
-- =========================================================
-- Remove the permissive guest upload policies on storage.objects
DROP POLICY IF EXISTS "Qualquer um envia comprovantes" ON storage.objects;
DROP POLICY IF EXISTS "Comprovantes upload guest" ON storage.objects;

-- New strict guest upload policy:
--  * bucket must be 'comprovantes'
--  * path's first folder must be a UUID matching a pedido created in the last 24h
--  * file extension restricted to image/pdf
CREATE POLICY "Comprovantes upload restrito"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'comprovantes'
  AND lower(storage.extension(name)) IN ('jpg','jpeg','png','webp','pdf')
  AND EXISTS (
    SELECT 1 FROM public.pedidos p
    WHERE p.id::text = (storage.foldername(name))[1]
      AND p.created_at > now() - interval '24 hours'
  )
);

-- Enforce file size limit and allowed MIME types on the bucket itself
UPDATE storage.buckets
SET
  file_size_limit = 5242880, -- 5 MB
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','application/pdf']
WHERE id = 'comprovantes';

-- =========================================================
-- 3) Tighten comprovantes table INSERT to recent pedidos only
-- =========================================================
DROP POLICY IF EXISTS "Comprovantes para pedidos existentes" ON public.comprovantes;

CREATE POLICY "Comprovantes para pedidos recentes"
ON public.comprovantes
FOR INSERT
TO public
WITH CHECK (
  arquivo_url IS NOT NULL
  AND length(arquivo_url) > 0
  AND EXISTS (
    SELECT 1 FROM public.pedidos p
    WHERE p.id = comprovantes.pedido_id
      AND p.created_at > now() - interval '24 hours'
  )
);
