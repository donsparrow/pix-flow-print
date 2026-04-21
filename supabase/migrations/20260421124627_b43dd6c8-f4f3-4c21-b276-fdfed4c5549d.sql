-- Adicionar campo emoji nas categorias
ALTER TABLE public.categorias ADD COLUMN IF NOT EXISTS emoji text;

-- Criar bucket para imagens de categorias (público)
INSERT INTO storage.buckets (id, name, public)
VALUES ('categorias', 'categorias', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas do bucket: leitura pública, escrita apenas para admins
DO $$ BEGIN
  CREATE POLICY "Imagens de categorias visíveis publicamente"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'categorias');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins enviam imagens de categorias"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'categorias' AND public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins atualizam imagens de categorias"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'categorias' AND public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins removem imagens de categorias"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'categorias' AND public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;