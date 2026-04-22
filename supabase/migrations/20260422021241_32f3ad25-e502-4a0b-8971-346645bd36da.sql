-- Função SECURITY DEFINER para checar se um pedido existe (sem expor a tabela pedidos)
CREATE OR REPLACE FUNCTION public.pedido_existe(_pedido_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.pedidos WHERE id = _pedido_id);
$$;

GRANT EXECUTE ON FUNCTION public.pedido_existe(uuid) TO anon, authenticated;

-- Recria a policy de upload no storage usando a função
DROP POLICY IF EXISTS "Comprovantes upload restrito" ON storage.objects;

CREATE POLICY "Comprovantes upload restrito"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'comprovantes'
  AND lower(storage.extension(name)) IN ('jpg','jpeg','png','webp','pdf')
  AND public.pedido_existe(((storage.foldername(name))[1])::uuid)
);

-- Recria a policy de insert na tabela comprovantes usando a função também
DROP POLICY IF EXISTS "Comprovantes para pedidos existentes" ON public.comprovantes;

CREATE POLICY "Comprovantes para pedidos existentes"
ON public.comprovantes
FOR INSERT
TO public
WITH CHECK (
  arquivo_url IS NOT NULL
  AND length(arquivo_url) > 0
  AND public.pedido_existe(comprovantes.pedido_id)
);