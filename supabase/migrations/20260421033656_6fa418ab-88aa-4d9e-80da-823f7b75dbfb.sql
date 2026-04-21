
-- =========================================
-- ENUMS
-- =========================================
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.order_status AS ENUM (
  'analise_pagamento',
  'pago',
  'em_producao',
  'em_entrega',
  'entregue',
  'cancelado'
);
CREATE TYPE public.shipping_method AS ENUM ('grande_vitoria', 'demais_regioes', 'retirada');

-- =========================================
-- PROFILES
-- =========================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seu próprio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- =========================================
-- USER ROLES
-- =========================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Usuários veem suas roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins gerenciam roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger para criar profile no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================
-- updated_at helper
-- =========================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =========================================
-- CATEGORIAS
-- =========================================
CREATE TABLE public.categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  imagem_url TEXT,
  ordem INT NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_categorias_updated BEFORE UPDATE ON public.categorias
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Categorias ativas são públicas"
  ON public.categorias FOR SELECT
  USING (ativo = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins gerenciam categorias"
  ON public.categorias FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- PRODUTOS
-- =========================================
CREATE TABLE public.produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descricao TEXT,
  preco NUMERIC(10,2) NOT NULL CHECK (preco >= 0),
  peso_g INT DEFAULT 0,
  dimensoes TEXT,
  estoque INT NOT NULL DEFAULT 0 CHECK (estoque >= 0),
  imagem_url TEXT,
  imagens_extras JSONB DEFAULT '[]'::jsonb,
  categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  destaque BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_produtos_updated BEFORE UPDATE ON public.produtos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_produtos_categoria ON public.produtos(categoria_id);
CREATE INDEX idx_produtos_ativo ON public.produtos(ativo);

CREATE POLICY "Produtos ativos são públicos"
  ON public.produtos FOR SELECT
  USING (ativo = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins gerenciam produtos"
  ON public.produtos FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- DEPOIMENTOS
-- =========================================
CREATE TABLE public.depoimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  texto TEXT NOT NULL,
  nota INT NOT NULL CHECK (nota BETWEEN 1 AND 5),
  avatar_url TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  ordem INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.depoimentos ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_depoimentos_updated BEFORE UPDATE ON public.depoimentos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Depoimentos ativos são públicos"
  ON public.depoimentos FOR SELECT
  USING (ativo = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins gerenciam depoimentos"
  ON public.depoimentos FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- CONFIGURACOES (chave/valor)
-- =========================================
CREATE TABLE public.configuracoes (
  chave TEXT PRIMARY KEY,
  valor TEXT,
  descricao TEXT,
  publica BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_config_updated BEFORE UPDATE ON public.configuracoes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Configurações públicas são visíveis"
  ON public.configuracoes FOR SELECT
  USING (publica = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins gerenciam configurações"
  ON public.configuracoes FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Configurações iniciais
INSERT INTO public.configuracoes (chave, valor, descricao, publica) VALUES
  ('pix_chave', 'sua-chave-pix@email.com', 'Chave PIX para recebimento', true),
  ('pix_nome', 'JRTL 3D', 'Nome do recebedor PIX', true),
  ('pix_banco', 'Banco', 'Banco do recebedor', true),
  ('whatsapp_numero', '5527999999999', 'Número do WhatsApp para envio de pedidos (formato 5527XXXXXXXXX)', true),
  ('frete_grande_vitoria', '15.00', 'Valor fixo do frete para Grande Vitória', true),
  ('frete_demais_regioes', '35.00', 'Valor fixo do frete para demais regiões', true),
  ('frete_grande_vitoria_prazo', '2', 'Prazo de entrega Grande Vitória (dias úteis)', true),
  ('frete_demais_regioes_prazo', '7', 'Prazo de entrega demais regiões (dias úteis)', true),
  ('cep_origem', '29000-000', 'CEP de origem das encomendas', false),
  ('hero_video_url', '', 'URL do vídeo do banner principal', true),
  ('instagram_handle', 'jrtl3d', 'Handle do Instagram (sem @)', true),
  ('site_titulo', 'JRTL 3D — Impressões 3D personalizadas', 'Título do site', true),
  ('site_descricao', 'Loja de impressões 3D personalizadas com qualidade artesanal.', 'Descrição do site', true);

-- =========================================
-- PEDIDOS
-- =========================================
CREATE TABLE public.pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  cliente_nome TEXT NOT NULL,
  cliente_telefone TEXT NOT NULL,
  cliente_email TEXT,
  cliente_cep TEXT,
  cliente_endereco TEXT,
  cliente_numero TEXT,
  cliente_complemento TEXT,
  cliente_bairro TEXT,
  cliente_cidade TEXT,
  cliente_estado TEXT,
  metodo_frete shipping_method NOT NULL,
  valor_frete NUMERIC(10,2) NOT NULL DEFAULT 0,
  valor_produtos NUMERIC(10,2) NOT NULL DEFAULT 0,
  valor_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  status order_status NOT NULL DEFAULT 'analise_pagamento',
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_pedidos_updated BEFORE UPDATE ON public.pedidos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_pedidos_codigo ON public.pedidos(codigo);
CREATE INDEX idx_pedidos_status ON public.pedidos(status);

-- Geração de código único PED-XXXXXX
CREATE OR REPLACE FUNCTION public.gerar_codigo_pedido()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  novo_codigo TEXT;
  tentativas INT := 0;
BEGIN
  LOOP
    novo_codigo := 'PED-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.pedidos WHERE codigo = novo_codigo);
    tentativas := tentativas + 1;
    IF tentativas > 10 THEN
      RAISE EXCEPTION 'Não foi possível gerar código único';
    END IF;
  END LOOP;
  RETURN novo_codigo;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_codigo_pedido()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
    NEW.codigo := public.gerar_codigo_pedido();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_codigo_pedido
  BEFORE INSERT ON public.pedidos
  FOR EACH ROW EXECUTE FUNCTION public.set_codigo_pedido();

-- Qualquer um pode criar pedido (loja sem login)
CREATE POLICY "Qualquer um cria pedidos"
  ON public.pedidos FOR INSERT
  WITH CHECK (true);

-- Consulta pública somente por código (controlamos isso na aplicação)
CREATE POLICY "Pedidos visíveis para todos (consulta por código)"
  ON public.pedidos FOR SELECT
  USING (true);

CREATE POLICY "Admins atualizam pedidos"
  ON public.pedidos FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins deletam pedidos"
  ON public.pedidos FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- ITENS PEDIDO
-- =========================================
CREATE TABLE public.itens_pedido (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES public.produtos(id) ON DELETE SET NULL,
  produto_nome TEXT NOT NULL,
  produto_imagem TEXT,
  preco_unitario NUMERIC(10,2) NOT NULL,
  quantidade INT NOT NULL CHECK (quantidade > 0),
  subtotal NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.itens_pedido ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_itens_pedido ON public.itens_pedido(pedido_id);

CREATE POLICY "Itens visíveis para todos"
  ON public.itens_pedido FOR SELECT
  USING (true);

CREATE POLICY "Qualquer um cria itens de pedido"
  ON public.itens_pedido FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins gerenciam itens"
  ON public.itens_pedido FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Função RPC para criar pedido com itens e abater estoque atomicamente
CREATE OR REPLACE FUNCTION public.criar_pedido(
  _cliente JSONB,
  _itens JSONB,
  _metodo_frete shipping_method,
  _valor_frete NUMERIC,
  _observacoes TEXT DEFAULT NULL
)
RETURNS TABLE(pedido_id UUID, codigo TEXT)
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
  v_subtotal NUMERIC;
BEGIN
  -- Valida e calcula
  FOR v_item IN SELECT * FROM jsonb_array_elements(_itens) LOOP
    v_qtd := (v_item->>'quantidade')::INT;
    SELECT id, nome, preco, estoque, imagem_url, ativo
      INTO v_produto
      FROM public.produtos
      WHERE id = (v_item->>'produto_id')::UUID
      FOR UPDATE;

    IF NOT FOUND OR NOT v_produto.ativo THEN
      RAISE EXCEPTION 'Produto não encontrado ou inativo';
    END IF;
    IF v_produto.estoque < v_qtd THEN
      RAISE EXCEPTION 'Estoque insuficiente para %', v_produto.nome;
    END IF;

    v_subtotal := v_produto.preco * v_qtd;
    v_valor_produtos := v_valor_produtos + v_subtotal;
  END LOOP;

  -- Cria pedido
  INSERT INTO public.pedidos (
    cliente_nome, cliente_telefone, cliente_email,
    cliente_cep, cliente_endereco, cliente_numero, cliente_complemento,
    cliente_bairro, cliente_cidade, cliente_estado,
    metodo_frete, valor_frete, valor_produtos, valor_total, observacoes
  ) VALUES (
    _cliente->>'nome', _cliente->>'telefone', _cliente->>'email',
    _cliente->>'cep', _cliente->>'endereco', _cliente->>'numero', _cliente->>'complemento',
    _cliente->>'bairro', _cliente->>'cidade', _cliente->>'estado',
    _metodo_frete, _valor_frete, v_valor_produtos, v_valor_produtos + _valor_frete, _observacoes
  )
  RETURNING id, pedidos.codigo INTO v_pedido_id, v_codigo;

  -- Insere itens e abate estoque
  FOR v_item IN SELECT * FROM jsonb_array_elements(_itens) LOOP
    v_qtd := (v_item->>'quantidade')::INT;
    SELECT id, nome, preco, imagem_url INTO v_produto
      FROM public.produtos WHERE id = (v_item->>'produto_id')::UUID;

    INSERT INTO public.itens_pedido (
      pedido_id, produto_id, produto_nome, produto_imagem,
      preco_unitario, quantidade, subtotal
    ) VALUES (
      v_pedido_id, v_produto.id, v_produto.nome, v_produto.imagem_url,
      v_produto.preco, v_qtd, v_produto.preco * v_qtd
    );

    UPDATE public.produtos
       SET estoque = estoque - v_qtd
     WHERE id = v_produto.id;
  END LOOP;

  RETURN QUERY SELECT v_pedido_id, v_codigo;
END;
$$;

-- =========================================
-- COMPROVANTES
-- =========================================
CREATE TABLE public.comprovantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  arquivo_url TEXT NOT NULL,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.comprovantes ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_comprovantes_pedido ON public.comprovantes(pedido_id);

CREATE POLICY "Comprovantes visíveis para todos"
  ON public.comprovantes FOR SELECT
  USING (true);

CREATE POLICY "Qualquer um envia comprovante"
  ON public.comprovantes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins gerenciam comprovantes"
  ON public.comprovantes FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- STORAGE BUCKETS
-- =========================================
INSERT INTO storage.buckets (id, name, public) VALUES
  ('produtos', 'produtos', true),
  ('comprovantes', 'comprovantes', true),
  ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Qualquer um vê imagens de produtos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'produtos');

CREATE POLICY "Admins fazem upload em produtos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'produtos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins atualizam imagens de produtos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'produtos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins deletam imagens de produtos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'produtos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Qualquer um vê comprovantes"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'comprovantes');

CREATE POLICY "Qualquer um envia comprovantes"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'comprovantes');

CREATE POLICY "Admins gerenciam comprovantes storage"
  ON storage.objects FOR ALL
  USING (bucket_id = 'comprovantes' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Qualquer um vê media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

CREATE POLICY "Admins gerenciam media"
  ON storage.objects FOR ALL
  USING (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));
