import { Layout } from "@/components/Layout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useParams, Link } from "react-router-dom";
import { brl } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { Minus, Plus, ShoppingBag, ArrowLeft, Package, Ruler, Weight } from "lucide-react";

export default function Produto() {
  const { slug } = useParams();
  const [p, setP] = useState<any>(null);
  const [qty, setQty] = useState(1);
  const { add } = useCart();

  useEffect(() => {
    if (!slug) return;
    supabase
      .from("produtos")
      .select("*, categorias(nome, slug)")
      .eq("slug", slug)
      .eq("ativo", true)
      .maybeSingle()
      .then(({ data }) => setP(data));
  }, [slug]);

  if (!p) return <Layout><div className="container py-20 text-center text-muted-foreground">Carregando...</div></Layout>;

  const esgotado = p.estoque <= 0;

  return (
    <Layout>
      <div className="container py-10">
        <Link to="/produtos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4" /> Voltar para produtos
        </Link>

        <div className="grid md:grid-cols-2 gap-10">
          <div className="aspect-square rounded-3xl overflow-hidden bg-muted shadow-md">
            {p.imagem_url && <img src={p.imagem_url} alt={p.nome} className="w-full h-full object-cover" />}
          </div>

          <div className="space-y-5">
            {p.categorias && (
              <Link to={`/produtos?categoria=${p.categorias.slug}`} className="text-sm font-bold text-secondary uppercase tracking-wider">
                {p.categorias.nome}
              </Link>
            )}
            <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight">{p.nome}</h1>
            <div className="font-display text-4xl font-bold text-primary">{brl(p.preco)}</div>

            {p.descricao && <p className="text-muted-foreground leading-relaxed">{p.descricao}</p>}

            <div className="grid grid-cols-2 gap-3 py-4">
              {p.peso_g > 0 && (
                <Info icon={<Weight className="h-4 w-4" />} label="Peso" value={`${p.peso_g}g`} />
              )}
              {p.dimensoes && (
                <Info icon={<Ruler className="h-4 w-4" />} label="Dimensões" value={p.dimensoes} />
              )}
            </div>

            {esgotado ? (
              <div className="bg-destructive/10 text-destructive font-bold rounded-xl p-4 text-center">
                ESGOTADO — entre em contato pelo WhatsApp para encomendar.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Button size="icon" variant="outline" className="rounded-full" onClick={() => setQty(Math.max(1, qty - 1))}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="font-display font-bold text-2xl w-10 text-center">{qty}</span>
                  <Button size="icon" variant="outline" className="rounded-full" onClick={() => setQty(Math.min(p.estoque, qty + 1))}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  size="lg"
                  onClick={() => add({ produto_id: p.id, nome: p.nome, preco: p.preco, imagem_url: p.imagem_url, estoque: p.estoque }, qty)}
                  className="w-full bg-gradient-warm text-white font-bold rounded-full shadow-pop hover:translate-y-0.5 hover:shadow-md transition-all h-14 text-base"
                >
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  Adicionar ao carrinho — {brl(p.preco * qty)}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
      <div className="text-primary">{icon}</div>
      <div>
        <div className="text-xs text-muted-foreground font-semibold">{label}</div>
        <div className="font-bold text-sm">{value}</div>
      </div>
    </div>
  );
}
