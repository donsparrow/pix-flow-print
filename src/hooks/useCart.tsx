import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type CartItem = {
  produto_id: string;
  nome: string;
  preco: number;
  imagem_url: string | null;
  quantidade: number;
  estoque: number;
  cor_selecionada?: string | null;
  cores_disponiveis?: string[] | null;
};

type CartContextType = {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantidade">, qty?: number) => void;
  remove: (produto_id: string, cor?: string | null) => void;
  setQty: (produto_id: string, qty: number, cor?: string | null) => void;
  clear: () => void;
  total: number;
  count: number;
  isOpen: boolean;
  setOpen: (v: boolean) => void;
};

const CartContext = createContext<CartContextType | null>(null);
const STORAGE_KEY = "jrtl_cart_v1";

const sameLine = (a: CartItem, produto_id: string, cor?: string | null) =>
  a.produto_id === produto_id && (a.cor_selecionada || null) === (cor || null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const add: CartContextType["add"] = (item, qty = 1) => {
    setItems((prev) => {
      const found = prev.find((i) => sameLine(i, item.produto_id, item.cor_selecionada));
      if (found) {
        const newQty = Math.min(found.quantidade + qty, item.estoque);
        return prev.map((i) =>
          sameLine(i, item.produto_id, item.cor_selecionada) ? { ...i, quantidade: newQty } : i
        );
      }
      return [...prev, { ...item, quantidade: Math.min(qty, item.estoque) }];
    });
    setOpen(true);
  };

  const remove = (produto_id: string, cor?: string | null) =>
    setItems((prev) => prev.filter((i) => !sameLine(i, produto_id, cor)));

  const setQty = (produto_id: string, qty: number, cor?: string | null) =>
    setItems((prev) =>
      prev.map((i) =>
        sameLine(i, produto_id, cor)
          ? { ...i, quantidade: Math.max(1, Math.min(qty, i.estoque)) }
          : i
      )
    );

  const clear = () => setItems([]);

  const total = items.reduce((s, i) => s + i.preco * i.quantidade, 0);
  const count = items.reduce((s, i) => s + i.quantidade, 0);

  return (
    <CartContext.Provider value={{ items, add, remove, setQty, clear, total, count, isOpen, setOpen }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
