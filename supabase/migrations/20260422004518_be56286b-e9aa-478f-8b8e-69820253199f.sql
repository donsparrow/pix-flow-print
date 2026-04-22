CREATE OR REPLACE FUNCTION public.validar_cupom(_codigo text, _subtotal numeric)
 RETURNS TABLE(valido boolean, mensagem text, desconto numeric, codigo text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_cupom public.cupons%ROWTYPE;
  v_desc NUMERIC := 0;
BEGIN
  SELECT * INTO v_cupom
  FROM public.cupons c
  WHERE c.codigo = upper(trim(_codigo));

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Cupom não encontrado'::TEXT, 0::NUMERIC, NULL::TEXT;
    RETURN;
  END IF;

  IF NOT v_cupom.ativo THEN
    RETURN QUERY SELECT false, 'Cupom inativo'::TEXT, 0::NUMERIC, NULL::TEXT;
    RETURN;
  END IF;

  IF v_cupom.validade IS NOT NULL AND v_cupom.validade < now() THEN
    RETURN QUERY SELECT false, 'Cupom expirado'::TEXT, 0::NUMERIC, NULL::TEXT;
    RETURN;
  END IF;

  IF v_cupom.limite_uso IS NOT NULL AND v_cupom.usos >= v_cupom.limite_uso THEN
    RETURN QUERY SELECT false, 'Cupom esgotado'::TEXT, 0::NUMERIC, NULL::TEXT;
    RETURN;
  END IF;

  IF v_cupom.tipo = 'percentual' THEN
    v_desc := round(_subtotal * v_cupom.valor / 100, 2);
  ELSE
    v_desc := v_cupom.valor;
  END IF;

  IF v_desc > _subtotal THEN
    v_desc := _subtotal;
  END IF;

  RETURN QUERY SELECT true, 'Cupom aplicado'::TEXT, v_desc, v_cupom.codigo;
END;
$function$;