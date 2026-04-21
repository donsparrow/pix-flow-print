
-- 1. Garante categoria "Todos"
INSERT INTO public.categorias (nome, slug, ativo, ordem)
VALUES ('Todos', 'todos', true, 0)
ON CONFLICT (slug) DO NOTHING;

-- 2. Tabela de junção
CREATE TABLE IF NOT EXISTS public.produto_categorias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  categoria_id UUID NOT NULL REFERENCES public.categorias(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (produto_id, categoria_id)
);

CREATE INDEX IF NOT EXISTS idx_pc_produto ON public.produto_categorias(produto_id);
CREATE INDEX IF NOT EXISTS idx_pc_categoria ON public.produto_categorias(categoria_id);

ALTER TABLE public.produto_categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Associações visíveis para todos"
ON public.produto_categorias FOR SELECT USING (true);

CREATE POLICY "Admins gerenciam associações"
ON public.produto_categorias FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Migrar dados existentes: vincular à categoria atual + "Todos"
INSERT INTO public.produto_categorias (produto_id, categoria_id)
SELECT p.id, p.categoria_id
FROM public.produtos p
WHERE p.categoria_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.produto_categorias (produto_id, categoria_id)
SELECT p.id, (SELECT id FROM public.categorias WHERE slug = 'todos')
FROM public.produtos p
ON CONFLICT DO NOTHING;

-- 4. Trigger: ao inserir produto, vincular automaticamente a "Todos"
CREATE OR REPLACE FUNCTION public.vincular_produto_todos()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_todos UUID;
BEGIN
  SELECT id INTO v_todos FROM public.categorias WHERE slug = 'todos';
  IF v_todos IS NOT NULL THEN
    INSERT INTO public.produto_categorias (produto_id, categoria_id)
    VALUES (NEW.id, v_todos)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vincular_todos ON public.produtos;
CREATE TRIGGER trg_vincular_todos
AFTER INSERT ON public.produtos
FOR EACH ROW EXECUTE FUNCTION public.vincular_produto_todos();

-- 5. Trigger: se produto ficar sem categoria após delete, re-vincular a "Todos"
CREATE OR REPLACE FUNCTION public.garantir_categoria_produto()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
  v_todos UUID;
BEGIN
  -- Verifica se o produto ainda existe (pode ter sido deletado em cascata)
  IF NOT EXISTS (SELECT 1 FROM public.produtos WHERE id = OLD.produto_id) THEN
    RETURN OLD;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM public.produto_categorias
  WHERE produto_id = OLD.produto_id;

  IF v_count = 0 THEN
    SELECT id INTO v_todos FROM public.categorias WHERE slug = 'todos';
    IF v_todos IS NOT NULL THEN
      INSERT INTO public.produto_categorias (produto_id, categoria_id)
      VALUES (OLD.produto_id, v_todos)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_garantir_categoria ON public.produto_categorias;
CREATE TRIGGER trg_garantir_categoria
AFTER DELETE ON public.produto_categorias
FOR EACH ROW EXECUTE FUNCTION public.garantir_categoria_produto();

-- 6. Trigger: bloquear exclusão da categoria "Todos"
CREATE OR REPLACE FUNCTION public.bloquear_delete_todos()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.slug = 'todos' THEN
    RAISE EXCEPTION 'A categoria "Todos" é padrão do sistema e não pode ser excluída';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_bloquear_delete_todos ON public.categorias;
CREATE TRIGGER trg_bloquear_delete_todos
BEFORE DELETE ON public.categorias
FOR EACH ROW EXECUTE FUNCTION public.bloquear_delete_todos();
