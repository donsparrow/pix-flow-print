import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { brl } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  produto: {
    nome: string;
    preco: number;
    imagem_url: string | null;
    cores: string[];
  };
  onConfirm: (cor: string) => void;
};

// Mapa simples de nomes de cores -> valor CSS para a bolinha visual
const corCss = (nome: string): string => {
  const k = nome.trim().toLowerCase();
  const map: Record<string, string> = {
    preto: "#000000", branco: "#ffffff", cinza: "#9ca3af",
    vermelho: "#dc2626", azul: "#2563eb", "azul claro": "#60a5fa", "azul marinho": "#1e3a8a",
    verde: "#16a34a", "verde claro": "#86efac", amarelo: "#facc15",
    laranja: "#f97316", rosa: "#ec4899", roxo: "#9333ea", marrom: "#78350f",
    bege: "#e7d2b3", dourado: "#d4af37", prata: "#c0c0c0", transparente: "transparent",
  };
  return map[k] || k;
};

export function ColorPickerDialog({ open, onOpenChange, produto, onConfirm }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleConfirm = () => {
    if (!selected) return;
    onConfirm(selected);
    setSelected(null);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setSelected(null);
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Escolha a cor</DialogTitle>
          <DialogDescription>Selecione uma cor disponível para adicionar ao carrinho.</DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 items-center">
          <div className="w-24 h-24 rounded-xl bg-muted overflow-hidden shrink-0">
            {produto.imagem_url ? (
              <img src={produto.imagem_url} alt={produto.nome} className="w-full h-full object-cover" />
            ) : null}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold leading-tight line-clamp-2">{produto.nome}</h3>
            <div className="mt-1 font-display font-bold text-lg text-primary">{brl(produto.preco)}</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Cores disponíveis</div>
          <div className="flex flex-wrap gap-2">
            {produto.cores.map((cor) => {
              const isSel = selected === cor;
              const css = corCss(cor);
              return (
                <button
                  key={cor}
                  type="button"
                  onClick={() => setSelected(cor)}
                  className={cn(
                    "group flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-all",
                    isSel
                      ? "border-primary bg-primary/10 ring-2 ring-primary"
                      : "border-border hover:border-primary/50"
                  )}
                  aria-pressed={isSel}
                >
                  <span
                    className="inline-block w-5 h-5 rounded-full border border-border shadow-sm relative"
                    style={{ backgroundColor: css }}
                  >
                    {isSel && (
                      <Check className="absolute inset-0 m-auto h-3 w-3 text-foreground mix-blend-difference" />
                    )}
                  </span>
                  <span>{cor}</span>
                </button>
              );
            })}
          </div>
        </div>

        <Button
          onClick={handleConfirm}
          disabled={!selected}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          Adicionar ao carrinho
        </Button>
      </DialogContent>
    </Dialog>
  );
}
