import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { brl } from "@/lib/format";
import { ShoppingCart, DollarSign, Clock, TrendingUp, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Pedido = { id: string; valor_total: number; status: string; created_at: string };
type Item = { produto_nome: string; quantidade: number; lucro_unitario: number; pedido_id: string };

function ymOfNow() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function rangeFromYM(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
  const end = new Date(y, m, 1, 0, 0, 0, 0);
  return { start, end };
}

function rangeFromPreset(preset: "hoje" | "7d" | "30d" | "mes") {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  if (preset === "hoje") start.setHours(0, 0, 0, 0);
  else if (preset === "7d") { start.setDate(start.getDate() - 6); start.setHours(0, 0, 0, 0); }
  else if (preset === "30d") { start.setDate(start.getDate() - 29); start.setHours(0, 0, 0, 0); }
  else { start.setDate(1); start.setHours(0, 0, 0, 0); }
  return { start, end };
}

export default function AdminDashboard() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [itens, setItens] = useState<Item[]>([]);
  const [mes, setMes] = useState<string>(ymOfNow());
  const [preset, setPreset] = useState<"mes-input" | "hoje" | "7d" | "30d" | "mes">("mes-input");

  useEffect(() => {
    (async () => {
      const [{ data: p }, { data: i }] = await Promise.all([
        supabase.from("pedidos").select("id, valor_total, status, created_at"),
        supabase.from("itens_pedido").select("produto_nome, quantidade, lucro_unitario, pedido_id"),
      ]);
      setPedidos((p as any) || []);
      setItens((i as any) || []);
    })();
  }, []);

  const range = useMemo(() => {
    if (preset === "mes-input") return rangeFromYM(mes);
    return rangeFromPreset(preset);
  }, [preset, mes]);

  const stats = useMemo(() => {
    const validos = pedidos.filter((p) => {
      if (p.status === "cancelado") return false;
      const d = new Date(p.created_at);
      return d >= range.start && d < range.end;
    });
    const validIds = new Set(validos.map((p) => p.id));
    const fat = validos.reduce((s, p) => s + Number(p.valor_total), 0);
    const pend = validos.filter((p) => p.status === "analise_pagamento").length;
    const itensValidos = itens.filter((i) => validIds.has(i.pedido_id));
    const lucroTotal = itensValidos.reduce(
      (s, i) => s + Number(i.lucro_unitario || 0) * Number(i.quantidade || 0),
      0
    );
    const map = new Map<string, number>();
    itensValidos.forEach((i) => map.set(i.produto_nome, (map.get(i.produto_nome) || 0) + i.quantidade));
    const top = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    return { faturamento: fat, lucro: lucroTotal, total: validos.length, pendentes: pend, maisVendidos: top };
  }, [pedidos, itens, range]);

  const itensVendidos = stats.maisVendidos.reduce((s, [, q]) => s + q, 0);

  const presetBtn = (key: typeof preset, label: string) => (
    <Button
      key={key}
      type="button"
      size="sm"
      variant={preset === key ? "default" : "outline"}
      onClick={() => setPreset(key)}
    >
      {label}
    </Button>
  );

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <h1 className="font-display text-3xl font-bold">Dashboard</h1>
        <div className="flex flex-wrap items-center gap-2">
          {presetBtn("hoje", "Hoje")}
          {presetBtn("7d", "Últimos 7 dias")}
          {presetBtn("30d", "Últimos 30 dias")}
          {presetBtn("mes", "Este mês")}
          <Input
            type="month"
            value={mes}
            onChange={(e) => { setMes(e.target.value || ymOfNow()); setPreset("mes-input"); }}
            className={`w-[170px] ${preset === "mes-input" ? "border-primary" : ""}`}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card icon={<DollarSign />} label="Faturamento" value={brl(stats.faturamento)} color="bg-success" />
        <Card icon={<Wallet />} label="Lucro total" value={brl(stats.lucro)} color="bg-primary" />
        <Card icon={<ShoppingCart />} label="Pedidos" value={stats.total} color="bg-secondary" />
        <Card icon={<Clock />} label="Pendentes" value={stats.pendentes} color="bg-warning" />
        <Card icon={<TrendingUp />} label="Itens vendidos" value={itensVendidos} color="bg-accent" />
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-display font-bold text-xl mb-4">Mais vendidos no período</h2>
        {stats.maisVendidos.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhuma venda no período selecionado.</p>
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
