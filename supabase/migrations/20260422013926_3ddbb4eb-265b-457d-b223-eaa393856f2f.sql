
-- ============================================================
-- 1. Restrict SELECT on order tables to admins only
-- ============================================================
DROP POLICY IF EXISTS "Pedidos visíveis para todos (consulta por código)" ON public.pedidos;
DROP POLICY IF EXISTS "Pedidos visíveis para todos" ON public.pedidos;
CREATE POLICY "Admins veem todos os pedidos"
  ON public.pedidos FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Itens visíveis para todos" ON public.itens_pedido;
CREATE POLICY "Admins veem itens"
  ON public.itens_pedido FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Comprovantes visíveis para todos" ON public.comprovantes;
CREATE POLICY "Admins veem comprovantes"
  ON public.comprovantes FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 2. Public RPC for guest order lookup by code
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_pedido_by_codigo(_codigo text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pedido public.pedidos%ROWTYPE;
  v_itens jsonb;
  v_comprovante jsonb;
BEGIN
  SELECT * INTO v_pedido FROM public.pedidos
  WHERE codigo = upper(trim(_codigo));

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(i.*) - 'lucro_unitario' ORDER BY i.created_at), '[]'::jsonb)
    INTO v_itens
  FROM public.itens_pedido i
  WHERE i.pedido_id = v_pedido.id;

  SELECT to_jsonb(c.*) INTO v_comprovante
  FROM public.comprovantes c
  WHERE c.pedido_id = v_pedido.id
  ORDER BY c.created_at DESC
  LIMIT 1;

  RETURN jsonb_build_object(
    'pedido', to_jsonb(v_pedido),
    'itens', v_itens,
    'comprovante', v_comprovante
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_pedido_by_codigo(text) TO anon, authenticated;

-- ============================================================
-- 3. Public RPC for guest comprovante upload (creates DB record)
-- ============================================================
CREATE OR REPLACE FUNCTION public.registrar_comprovante(_codigo text, _arquivo_path text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pedido_id uuid;
BEGIN
  IF _arquivo_path IS NULL OR length(trim(_arquivo_path)) = 0 THEN
    RAISE EXCEPTION 'Arquivo inválido';
  END IF;

  SELECT id INTO v_pedido_id FROM public.pedidos
  WHERE codigo = upper(trim(_codigo));

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido não encontrado';
  END IF;

  INSERT INTO public.comprovantes (pedido_id, arquivo_url)
  VALUES (v_pedido_id, _arquivo_path);

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.registrar_comprovante(text, text) TO anon, authenticated;

-- ============================================================
-- 4. Signed URL helper for guest to view their own comprovante
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_comprovante_path(_codigo text)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_path text;
BEGIN
  SELECT c.arquivo_url INTO v_path
  FROM public.comprovantes c
  JOIN public.pedidos p ON p.id = c.pedido_id
  WHERE p.codigo = upper(trim(_codigo))
  ORDER BY c.created_at DESC
  LIMIT 1;
  RETURN v_path;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_comprovante_path(text) TO anon, authenticated;

-- ============================================================
-- 5. Server-side freight validation in criar_pedido
-- ============================================================
CREATE OR REPLACE FUNCTION public.criar_pedido(
  _cliente jsonb,
  _itens jsonb,
  _metodo_frete shipping_method,
  _valor_frete numeric,
  _observacoes text DEFAULT NULL,
  _cupom_codigo text DEFAULT NULL
)
RETURNS TABLE(pedido_id uuid, codigo text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pedido_id UUID;
  v_codigo TEXT;
  v_valor_produtos NUMERIC := 0;
  v_item JSONB;
  v_produto RECORD;
  v_qtd INT;
  v_cor TEXT;
  v_subtotal NUMERIC;
  v_cupom public.cupons%ROWTYPE;
  v_desconto NUMERIC := 0;
  v_cupom_final TEXT := NULL;
  v_frete_final NUMERIC := 0;
  v_frete_cfg TEXT;
BEGIN
  -- SERVER-SIDE FREIGHT: ignore _valor_frete from client, look up from configuracoes
  IF _metodo_frete = 'grande_vitoria' THEN
    SELECT valor INTO v_frete_cfg FROM public.configuracoes WHERE chave = 'frete_grande_vitoria';
    v_frete_final := COALESCE(NULLIF(v_frete_cfg, '')::NUMERIC, 0);
  ELSIF _metodo_frete = 'demais_regioes' THEN
    SELECT valor INTO v_frete_cfg FROM public.configuracoes WHERE chave = 'frete_demais_regioes';
    v_frete_final := COALESCE(NULLIF(v_frete_cfg, '')::NUMERIC, 0);
  ELSE
    v_frete_final := 0;
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(_itens) LOOP
    v_qtd := (v_item->>'quantidade')::INT;
    SELECT p.id, p.nome, p.preco, p.estoque, p.imagem_url, p.ativo, p.cores, p.lucro
      INTO v_produto
      FROM public.produtos p
      WHERE p.id = (v_item->>'produto_id')::UUID
      FOR UPDATE;

    IF NOT FOUND OR NOT v_produto.ativo THEN
      RAISE EXCEPTION 'Produto não encontrado ou inativo';
    END IF;
    IF v_produto.estoque < v_qtd THEN
      RAISE EXCEPTION 'Estoque insuficiente para %', v_produto.nome;
    END IF;

    IF v_produto.cores IS NOT NULL AND array_length(v_produto.cores, 1) > 0 THEN
      v_cor := v_item->>'cor_selecionada';
      IF v_cor IS NULL OR v_cor = '' THEN
        RAISE EXCEPTION 'Selecione uma cor para %', v_produto.nome;
      END IF;
      IF NOT (v_cor = ANY(v_produto.cores)) THEN
        RAISE EXCEPTION 'Cor inválida para %', v_produto.nome;
      END IF;
    END IF;

    v_subtotal := v_produto.preco * v_qtd;
    v_valor_produtos := v_valor_produtos + v_subtotal;
  END LOOP;

  IF _cupom_codigo IS NOT NULL AND length(trim(_cupom_codigo)) > 0 THEN
    SELECT c.* INTO v_cupom
    FROM public.cupons c
    WHERE c.codigo = upper(trim(_cupom_codigo))
    FOR UPDATE;

    IF NOT FOUND THEN RAISE EXCEPTION 'Cupom não encontrado'; END IF;
    IF NOT v_cupom.ativo THEN RAISE EXCEPTION 'Cupom inativo'; END IF;
    IF v_cupom.validade IS NOT NULL AND v_cupom.validade < now() THEN
      RAISE EXCEPTION 'Cupom expirado';
    END IF;
    IF v_cupom.limite_uso IS NOT NULL AND v_cupom.usos >= v_cupom.limite_uso THEN
      RAISE EXCEPTION 'Cupom esgotado';
    END IF;
    IF v_cupom.tipo = 'percentual' THEN
      v_desconto := round(v_valor_produtos * v_cupom.valor / 100, 2);
    ELSE
      v_desconto := v_cupom.valor;
    END IF;
    IF v_desconto > v_valor_produtos THEN v_desconto := v_valor_produtos; END IF;
    v_cupom_final := v_cupom.codigo;

    UPDATE public.cupons SET usos = usos + 1 WHERE id = v_cupom.id;
  END IF;

  INSERT INTO public.pedidos (
    cliente_nome, cliente_telefone, cliente_email,
    cliente_cep, cliente_endereco, cliente_numero, cliente_complemento,
    cliente_bairro, cliente_cidade, cliente_estado,
    metodo_frete, valor_frete, valor_produtos, valor_total, observacoes,
    cupom_codigo, cupom_desconto
  ) VALUES (
    _cliente->>'nome', _cliente->>'telefone', _cliente->>'email',
    _cliente->>'cep', _cliente->>'endereco', _cliente->>'numero', _cliente->>'complemento',
    _cliente->>'bairro', _cliente->>'cidade', _cliente->>'estado',
    _metodo_frete, v_frete_final, v_valor_produtos,
    (v_valor_produtos - v_desconto) + v_frete_final, _observacoes,
    v_cupom_final, v_desconto
  )
  RETURNING pedidos.id, pedidos.codigo INTO v_pedido_id, v_codigo;

  FOR v_item IN SELECT * FROM jsonb_array_elements(_itens) LOOP
    v_qtd := (v_item->>'quantidade')::INT;
    v_cor := v_item->>'cor_selecionada';
    SELECT p.id, p.nome, p.preco, p.imagem_url, p.lucro
      INTO v_produto
      FROM public.produtos p
      WHERE p.id = (v_item->>'produto_id')::UUID;

    INSERT INTO public.itens_pedido (
      pedido_id, produto_id, produto_nome, produto_imagem,
      preco_unitario, quantidade, subtotal, cor_selecionada, lucro_unitario
    ) VALUES (
      v_pedido_id, v_produto.id, v_produto.nome, v_produto.imagem_url,
      v_produto.preco, v_qtd, v_produto.preco * v_qtd, NULLIF(v_cor, ''),
      COALESCE(v_produto.lucro, 0)
    );

    UPDATE public.produtos SET estoque = estoque - v_qtd WHERE id = v_produto.id;
  END LOOP;

  RETURN QUERY SELECT v_pedido_id, v_codigo;
END;
$$;

-- ============================================================
-- 6. Make comprovantes bucket private and lock down storage
-- ============================================================
UPDATE storage.buckets SET public = false WHERE id = 'comprovantes';

-- Drop any pre-existing policies on comprovantes and recreate
DROP POLICY IF EXISTS "Comprovantes públicos" ON storage.objects;
DROP POLICY IF EXISTS "Comprovantes upload público" ON storage.objects;
DROP POLICY IF EXISTS "Comprovantes admin select" ON storage.objects;
DROP POLICY IF EXISTS "Comprovantes admin all" ON storage.objects;
DROP POLICY IF EXISTS "Comprovantes upload guest" ON storage.objects;

-- Allow anyone to upload a comprovante (guest checkout flow)
CREATE POLICY "Comprovantes upload guest"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'comprovantes');

-- Only admins can list/read directly via storage API
CREATE POLICY "Comprovantes admin all"
  ON storage.objects FOR ALL
  USING (bucket_id = 'comprovantes' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'comprovantes' AND public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 7. Signed-URL helper RPC (admin & guest with code)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_comprovante_signed_url(_codigo text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_path text;
BEGIN
  SELECT c.arquivo_url INTO v_path
  FROM public.comprovantes c
  JOIN public.pedidos p ON p.id = c.pedido_id
  WHERE p.codigo = upper(trim(_codigo))
  ORDER BY c.created_at DESC
  LIMIT 1;
  RETURN v_path;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_comprovante_signed_url(text) TO anon, authenticated;
