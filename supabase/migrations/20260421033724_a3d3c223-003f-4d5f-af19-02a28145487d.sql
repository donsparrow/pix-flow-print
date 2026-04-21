
-- 1) search_path nas funções restantes
ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.gerar_codigo_pedido() SET search_path = public;
ALTER FUNCTION public.set_codigo_pedido() SET search_path = public;

-- 2) Endurecer RLS de pedidos: INSERT público mas só via dados válidos mínimos
DROP POLICY IF EXISTS "Qualquer um cria pedidos" ON public.pedidos;
CREATE POLICY "Qualquer um cria pedidos com dados válidos"
  ON public.pedidos FOR INSERT
  WITH CHECK (
    cliente_nome IS NOT NULL AND length(cliente_nome) > 0
    AND cliente_telefone IS NOT NULL AND length(cliente_telefone) > 0
    AND valor_total >= 0
  );

-- 3) Itens: só criáveis para pedidos recém-criados (anti-tampering)
DROP POLICY IF EXISTS "Qualquer um cria itens de pedido" ON public.itens_pedido;
CREATE POLICY "Itens criáveis para pedidos recentes"
  ON public.itens_pedido FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pedidos p
      WHERE p.id = pedido_id
        AND p.created_at > now() - interval '10 minutes'
    )
  );

-- 4) Comprovantes: só para pedidos existentes
DROP POLICY IF EXISTS "Qualquer um envia comprovante" ON public.comprovantes;
CREATE POLICY "Comprovantes para pedidos existentes"
  ON public.comprovantes FOR INSERT
  WITH CHECK (
    arquivo_url IS NOT NULL AND length(arquivo_url) > 0
    AND EXISTS (SELECT 1 FROM public.pedidos p WHERE p.id = pedido_id)
  );

-- 5) Storage: remover listagem ampla, manter acesso por URL conhecida
-- A leitura de arquivo individual em bucket público funciona sem policy SELECT;
-- removemos as policies de SELECT que permitem listar todo o bucket
DROP POLICY IF EXISTS "Qualquer um vê imagens de produtos" ON storage.objects;
DROP POLICY IF EXISTS "Qualquer um vê comprovantes" ON storage.objects;
DROP POLICY IF EXISTS "Qualquer um vê media" ON storage.objects;

-- Permitir SELECT apenas para admins listarem/gerenciarem
CREATE POLICY "Admins listam produtos storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'produtos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins listam comprovantes storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'comprovantes' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins listam media storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));
