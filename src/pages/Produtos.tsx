import { Layout } from "@/components/Layout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, Produto } from "@/components/ProductCard";
import { useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

type Cat = { id: string; nome: string; slug: string };

export default function Produtos() {
  const [params, setParams] = useSearchParams();
  const cat = params.get("categoria") || "todos";
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    supabase
      .from("categorias")
      .select("id, nome, slug")
      .eq("ativo", true)
      .order("ordem")
      .then(({ data }) => setCats(data || []));
  }, []);

  useEffect(() => {
    (async () => {
      // 1. Pega o id da categoria pelo slug (ou "todos")
      const slugAtivo = cat || "todos";
      const { data: catRow } = await supabase
        .from("categorias")
        .select("id")
        .eq("slug", slugAtivo)
        .maybeSingle();

      // 2. Busca ids de produtos vinculados àquela categoria
      let produtoIds: string[] | null = null;
      if (catRow?.id) {
        const { data: rels } = await supabase
          .from("produto_categorias")
          .select("produto_id")
          .eq("categoria_id", catRow.id);
        produtoIds = (rels || []).map((r: any) => r.produto_id);
        if (produtoIds.length === 0) {
          setProdutos([]);
          return;
        }
      }

      // 3. Busca produtos
      let query = supabase
        .from("produtos")
        .select("id, nome, slug, preco, estoque, imagem_url, descricao, ordem, created_at")
        .eq("ativo", true);
      if (produtoIds) query = query.in("id", produtoIds);
      const { data } = await query;

      let list = (data || []) as any[];
      list.sort((a, b) => {
        const ao = a.ordem && a.ordem > 0 ? a.ordem : Number.POSITIVE_INFINITY;
        const bo = b.ordem && b.ordem > 0 ? b.ordem : Number.POSITIVE_INFINITY;
        if (ao !== bo) return ao - bo;
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });
      if (q) list = list.filter((p) => p.nome.toLowerCase().includes(q.toLowerCase()));
      setProdutos(list);
    })();
  }, [cat, q]);

  return (
    <Layout>
      <div className="container py-10 md:py-16">
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-2">
            Nossa <span className="text-gradient-brand">vitrine</span>
          </h1>
          <p className="text-muted-foreground">Escolha sua peça favorita.</p>
        </div>

        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produto..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-11 h-12 rounded-full"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {cats.map((c) => (
              <Button
                key={c.id}
                size="sm"
                variant={cat === c.slug ? "default" : "outline"}
                onClick={() => setParams({ categoria: c.slug })}
                className="rounded-full"
              >
                {c.nome}
              </Button>
            ))}
          </div>
        </div>

        {produtos.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">Nenhum produto encontrado.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {produtos.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
