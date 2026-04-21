import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/hooks/useCart";
import { brl } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";

export function CartDrawer() {
  const { items, isOpen, setOpen, setQty, remove, total } = useCart();

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-primary" />
            Seu carrinho
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 text-muted-foreground">
            <ShoppingBag className="h-16 w-16 opacity-30" />
            <p>Seu carrinho está vazio.</p>
            <Button onClick={() => setOpen(false)} variant="outline">Continuar comprando</Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto -mx-6 px-6 mt-4 space-y-3">
              {items.map((i) => (
                <div key={i.produto_id} className="flex gap-3 p-3 bg-muted/40 rounded-xl">
                  {i.imagem_url && (
                    <img src={i.imagem_url} alt={i.nome} className="w-16 h-16 rounded-lg object-cover" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm line-clamp-2">{i.nome}</div>
                    <div className="text-primary font-bold text-sm mt-1">{brl(i.preco)}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <Button size="icon" variant="outline" className="h-7 w-7 rounded-full" onClick={() => setQty(i.produto_id, i.quantidade - 1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="font-bold w-6 text-center text-sm">{i.quantidade}</span>
                      <Button size="icon" variant="outline" className="h-7 w-7 rounded-full" onClick={() => setQty(i.produto_id, i.quantidade + 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full ml-auto text-destructive hover:bg-destructive/10" onClick={() => remove(i.produto_id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t pt-4 mt-4 space-y-3">
              <div className="flex justify-between font-bold text-lg">
                <span>Subtotal</span>
                <span className="text-primary">{brl(total)}</span>
              </div>
              <p className="text-xs text-muted-foreground">O frete será calculado no checkout.</p>
              <Button asChild size="lg" className="w-full bg-gradient-warm text-white font-bold hover:opacity-90 shadow-md">
                <Link to="/checkout" onClick={() => setOpen(false)}>
                  Finalizar pedido
                </Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
