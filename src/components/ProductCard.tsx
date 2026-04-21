import { Link } from "react-router-dom";
import { brl } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { Plus } from "lucide-react";

export type Produto = {
  id: string;
  nome: string;
  slug: string;
  preco: number;
  estoque: number;
  imagem_url: string | null;
  descricao?: string | null;
};

export function ProductCard({ p }: { p: Produto }) {
  const { add } = useCart();
  const esgotado = p.estoque <= 0;

  return (
    <div className="group flex flex-col bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/40 hover:shadow-brand transition-all duration-300 hover:-translate-y-1">
      <Link to={`/produto/${p.slug}`} className="block relative aspect-square overflow-hidden bg-muted">
        {p.imagem_url ? (
          <img
            src={p.imagem_url}
            alt={p.nome}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">Sem imagem</div>
        )}
        {esgotado && (
          <div className="absolute inset-0 bg-foreground/60 flex items-center justify-center">
            <span className="px-4 py-2 rounded-full bg-destructive text-destructive-foreground font-bold text-sm tracking-wider">
              ESGOTADO
            </span>
          </div>
        )}
      </Link>
      <div className="p-4 flex-1 flex flex-col">
        <Link to={`/produto/${p.slug}`} className="font-display font-semibold text-base leading-tight line-clamp-2 hover:text-primary transition-colors">
          {p.nome}
        </Link>
        <div className="mt-auto pt-3 flex items-end justify-between gap-2">
          <div>
            <div className="text-xs text-muted-foreground font-semibold">A partir de</div>
            <div className="font-display font-bold text-xl text-primary">{brl(p.preco)}</div>
          </div>
          <Button
            size="icon"
            disabled={esgotado}
            onClick={() => add({ produto_id: p.id, nome: p.nome, preco: p.preco, imagem_url: p.imagem_url, estoque: p.estoque })}
            className="rounded-full bg-accent hover:bg-accent/90 text-accent-foreground shadow-md hover:shadow-glow transition-all hover:scale-110"
            aria-label="Adicionar ao carrinho"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
