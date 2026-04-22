-- Remove a janela de 24h do upload no storage
DROP POLICY IF EXISTS "Comprovantes upload restrito" ON storage.objects;

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
  )
);

-- Remove a janela de 24h do insert na tabela comprovantes
DROP POLICY IF EXISTS "Comprovantes para pedidos recentes" ON public.comprovantes;

CREATE POLICY "Comprovantes para pedidos existentes"
ON public.comprovantes
FOR INSERT
TO public
WITH CHECK (
  arquivo_url IS NOT NULL
  AND length(arquivo_url) > 0
  AND EXISTS (
    SELECT 1 FROM public.pedidos p
    WHERE p.id = comprovantes.pedido_id
  )
);