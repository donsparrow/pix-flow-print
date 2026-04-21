ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS ordem integer NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_produtos_ordem ON public.produtos(ordem);
-- Initialize ordem based on current created_at order (newest first => lowest ordem)
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) AS rn FROM public.produtos
)
UPDATE public.produtos p SET ordem = r.rn FROM ranked r WHERE p.id = r.id;