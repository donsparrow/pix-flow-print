import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { brl, statusLabels } from "@/lib/format";
import { ShoppingCart, DollarSign, Clock, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ faturamento: 0, total: 0, pendentes: 0, maisVendidos: [] as any[] });

  useEffect(() => {
    (async () => {
      const { data: pedidos } = await supabase.from("pedidos").select("valor_total, status");
      const { data: itens } = await supabase.from("itens_pedido").select("produto_nome, quantidade");
      const fat = (pedidos || []).filter((p) => p.status !== "cancelado").reduce((s, p) => s + Number(p.valor_total), 0);
      const pend = (pedidos || []).filter((p) => p.status === "analise_pagamento").length;

      const map = new Map<string, number>();
      (itens || []).forEach((i) => map.set(i.produto_nome, (map.get(i.produto_nome) || 0) + i.quantidade));
      const top = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

      setStats({ faturamento: fat, total: pedidos?.length || 0, pendentes: pend, maisVendidos: top });
    })();
  }, []);

  return (
    <div className="space-y-6 max-w-6xl">
      <h1 className="font-display text-3xl font-bold">Dashboard</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card icon={<DollarSign />} label="Faturamento" value={brl(stats.faturamento)} color="bg-success" />
        <Card icon={<ShoppingCart />} label="Pedidos" value={stats.total} color="bg-primary" />
        <Card icon={<Clock />} label="Pendentes" value={stats.pendentes} color="bg-warning" />
        <Card icon={<TrendingUp />} label="Itens vendidos" value={stats.maisVendidos.reduce((s, [, q]) => s + q, 0)} color="bg-secondary" />
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-display font-bold text-xl mb-4">Mais vendidos</h2>
        {stats.maisVendidos.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhuma venda ainda.</p>
        ) : (
          <div className="space-y-2">
            {stats.maisVendidos.map(([nome, qtd]) => (
              <div key={nome} className="flex justify-between p-3 bg-muted/40 rounded-lg">
                <span className="font-semibold">{nome}</span>
                <span className="font-bold text-primary">{qtd} un.</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ icon, label, value, color }: any) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className={`w-10 h-10 ${color} text-white rounded-xl flex items-center justify-center mb-3`}>{icon}</div>
      <div className="text-xs text-muted-foreground font-bold uppercase">{label}</div>
      <div className="font-display font-bold text-2xl mt-1">{value}</div>
    </div>
  );
}
