import { Layout } from "@/components/Layout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useParams, Link } from "react-router-dom";
import { brl } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { Minus, Plus, ShoppingBag, ArrowLeft, Ruler, Weight, Check } from "lucide-react";
import { toast } from "sonner";

export default function Produto() {
  const { slug } = useParams();
  const [p, setP] = useState<any>(null);
  const [qty, setQty] = useState(1);
  const [cor, setCor] = useState<string | null>(null);
  const [imgAtiva, setImgAtiva] = useState(0);
  const { add } = useCart();

  useEffect(() => {
    if (!slug) return;
    supabase
      .from("produtos")
      .select("id, nome, slug, descricao, preco, estoque, peso_g, dimensoes, imagem_url, imagens_extras, cores, categoria_id, ativo, destaque, ordem, created_at, updated_at, categorias(nome, slug), produto_categorias(categorias(nome, slug))")
      .eq("slug", slug)
      .eq("ativo", true)
      .maybeSingle()
      .then(({ data }) => {
        setP(data);
        setCor(null);
        setImgAtiva(0);
      });
  }, [slug]);

  if (!p) return <Layout><div className="container py-20 text-center text-muted-foreground">Carregando...</div></Layout>;

  const esgotado = p.estoque <= 0;
  const cores: string[] = Array.isArray(p.cores) ? p.cores.filter(Boolean) : [];
  const temCores = cores.length > 0;

  const adicionar = () => {
    if (temCores && !cor) {
      toast.error("Selecione uma cor antes de continuar");
      return;
    }
    add(
      {
        produto_id: p.id,
        nome: p.nome,
        preco: p.preco,
        imagem_url: p.imagem_url,
        estoque: p.estoque,
        cor_selecionada: temCores ? cor : null,
        cores_disponiveis: temCores ? cores : null,
      },
      qty
    );
  };

  return (
    <Layout>
      <div className="container py-10">
        <Link to="/produtos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4" /> Voltar para produtos
        </Link>

        <div className="grid md:grid-cols-2 gap-10">
          {(() => {
            const extras = Array.isArray(p.imagens_extras) ? p.imagens_extras.filter((u: any) => typeof u === "string" && u) : [];
            const galeria: string[] = [];
            if (p.imagem_url) galeria.push(p.imagem_url);
            for (const u of extras) if (!galeria.includes(u)) galeria.push(u);
            const ativa = galeria[imgAtiva] || galeria[0] || null;
            return (
              <div className="space-y-3">
                <div className="aspect-square rounded-3xl overflow-hidden bg-muted shadow-md">
                  {ativa && <img src={ativa} alt={p.nome} className="w-full h-full object-cover" />}
                </div>
                {galeria.length > 1 && (
                  <div className="grid grid-cols-5 gap-2">
                    {galeria.map((url, idx) => (
                      <button
                        key={`${url}-${idx}`}
                        type="button"
                        onClick={() => setImgAtiva(idx)}
                        className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${idx === imgAtiva ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/40"}`}
                        aria-label={`Ver imagem ${idx + 1}`}
                      >
                        <img src={url} alt={`${p.nome} ${idx + 1}`} loading="lazy" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          <div className="space-y-5">
            {(() => {
              const tags = (p.produto_categorias || [])
                .map((pc: any) => pc.categorias)
                .filter((c: any) => c && c.slug !== "todos");
              if (tags.length === 0) return null;
              return (
                <div className="flex flex-wrap gap-2">
                  {tags.map((c: any) => (
                    <Link key={c.slug} to={`/produtos?categoria=${c.slug}`} className="text-xs font-bold text-secondary uppercase tracking-wider px-2 py-1 rounded-full bg-secondary/10 hover:bg-secondary/20 transition-colors">
                      {c.nome}
                    </Link>
                  ))}
                </div>
              );
            })()}
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

            {temCores && (
              <div className="space-y-2">
                <div className="text-sm font-bold">
                  Cor: {cor ? <span className="text-primary">{cor}</span> : <span className="text-muted-foreground font-normal">selecione uma opção</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {cores.map((c) => {
                    const sel = c === cor;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCor(c)}
                        className={`px-4 py-2 rounded-full border-2 text-sm font-semibold transition-all flex items-center gap-2 ${sel ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"}`}
                      >
                        {sel && <Check className="h-3.5 w-3.5" />}
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

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
                  onClick={adicionar}
                  disabled={temCores && !cor}
                  className="w-full bg-gradient-warm text-white font-bold rounded-full shadow-pop hover:translate-y-0.5 hover:shadow-md transition-all h-14 text-base disabled:opacity-50"
                >
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  {temCores && !cor ? "Selecione uma cor" : `Adicionar ao carrinho — ${brl(p.preco * qty)}`}
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
