INSERT INTO public.configuracoes (chave, valor, descricao, publica)
VALUES ('instagram_embed_code', '', 'Código de incorporação do widget de Instagram (EmbedSocial, Elfsight, SnapWidget etc.)', true)
ON CONFLICT (chave) DO NOTHING;

DELETE FROM public.configuracoes WHERE chave = 'instagram_posts';