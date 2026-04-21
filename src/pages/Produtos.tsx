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
  const cat = params.get("categoria") || "";
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    supabase.from("categorias").select("id, nome, slug").eq("ativo", true).order("ordem").then(({ data }) => setCats(data || []));
  }, []);

  useEffect(() => {
    (async () => {
      let query = supabase
        .from("produtos")
        .select("id, nome, slug, preco, estoque, imagem_url, descricao, categoria_id, categorias!inner(slug)")
        .eq("ativo", true)
        .order("created_at", { ascending: false });
      if (cat) query = query.eq("categorias.slug", cat);
      const { data } = await query;
      let list = (data || []) as any[];
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
            <Button
              size="sm"
              variant={!cat ? "default" : "outline"}
              onClick={() => setParams({})}
              className="rounded-full"
            >
              Todos
            </Button>
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
