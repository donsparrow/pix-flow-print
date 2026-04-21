import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, Produto } from "./ProductCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export function FeaturedProducts() {
  const [produtos, setProdutos] = useState<Produto[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("produtos")
        .select("id, nome, slug, preco, estoque, imagem_url, descricao, destaque, ordem, created_at, cores")
        .eq("ativo", true);
      const list = ((data || []) as any[]).sort((a, b) => {
        // Ordem manual crescente; 0/null vão por último
        const ao = a.ordem && a.ordem > 0 ? a.ordem : Number.POSITIVE_INFINITY;
        const bo = b.ordem && b.ordem > 0 ? b.ordem : Number.POSITIVE_INFINITY;
        if (ao !== bo) return ao - bo;
        // Desempate: destaques primeiro, depois mais recentes
        if (!!b.destaque !== !!a.destaque) return b.destaque ? 1 : -1;
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }).slice(0, 8);
      setProdutos(list as any);
    })();
  }, []);

  return (
    <section className="container py-16 md:py-24">
      <div className="flex items-end justify-between mb-10 gap-4">
        <div>
          <div className="text-sm font-bold text-accent uppercase tracking-wider mb-2">Vitrine</div>
          <h2 className="font-display text-4xl md:text-5xl font-bold">
            Nossos <span className="text-gradient-brand">destaques</span>
          </h2>
        </div>
        <Button asChild variant="ghost" className="hidden sm:flex font-bold rounded-full hover:bg-primary/10">
          <Link to="/produtos">
            Ver todos
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {produtos.map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </div>
    </section>
  );
}
