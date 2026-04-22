CREATE OR REPLACE FUNCTION public.criar_pedido(
  _cliente jsonb,
  _itens jsonb,
  _metodo_frete shipping_method,
  _valor_frete numeric,
  _observacoes text DEFAULT NULL::text,
  _cupom_codigo text DEFAULT NULL::text
)
RETURNS TABLE(pedido_id uuid, codigo text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
BEGIN
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
    _metodo_frete, _valor_frete, v_valor_produtos,
    (v_valor_produtos - v_desconto) + _valor_frete, _observacoes,
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
$function$;