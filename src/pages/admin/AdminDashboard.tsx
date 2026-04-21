import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { brl, statusLabels, statusColors } from "@/lib/format";
import {
  ShoppingCart, DollarSign, Clock, TrendingUp, Wallet,
  ArrowUp, ArrowDown, Minus, AlertTriangle, PackageX, PackageSearch,
  Plus, ListOrdered, Ticket, Sparkles, Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

type Pedido = {
  id: string; codigo: string; valor_total: number; status: string; created_at: string;
};
type Item = {
  produto_nome: string; quantidade: number; lucro_unitario: number;
  preco_unitario: number; subtotal: number; pedido_id: string;
};
type Produto = { id: string; nome: string; estoque: number; ativo: boolean };

function ymOfNow() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function rangeFromYM(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return { start: new Date(y, m - 1, 1), end: new Date(y, m, 1) };
}
function rangeFromPreset(preset: "hoje" | "7d" | "30d" | "mes") {
  const end = new Date(); end.setHours(23, 59, 59, 999);
  const start = new Date();
  if (preset === "hoje") start.setHours(0, 0, 0, 0);
  else if (preset === "7d") { start.setDate(start.getDate() - 6); start.setHours(0, 0, 0, 0); }
  else if (preset === "30d") { start.setDate(start.getDate() - 29); start.setHours(0, 0, 0, 0); }
  else { start.setDate(1); start.setHours(0, 0, 0, 0); }
  return { start, end };
}
function previousRange(start: Date, end: Date) {
  const ms = end.getTime() - start.getTime();
  return { start: new Date(start.getTime() - ms), end: new Date(start.getTime()) };
}
function fmtDay(d: Date) {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function variation(curr: number, prev: number) {
  if (prev === 0) return curr === 0 ? 0 : 100;
  return ((curr - prev) / prev) * 100;
}

export default function AdminDashboard() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [itens, setItens] = useState<Item[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [mes, setMes] = useState<string>(ymOfNow());
  const [preset, setPreset] = useState<"mes-input" | "hoje" | "7d" | "30d" | "mes">("mes-input");

  useEffect(() => {
    (async () => {
      const [{ data: p }, { data: i }, { data: pr }] = await Promise.all([
        supabase.from("pedidos").select("id, codigo, valor_total, status, created_at").order("created_at", { ascending: false }),
        supabase.from("itens_pedido").select("produto_nome, quantidade, lucro_unitario, preco_unitario, subtotal, pedido_id"),
        supabase.from("produtos").select("id, nome, estoque, ativo"),
      ]);
      setPedidos((p as any) || []);
      setItens((i as any) || []);
      setProdutos((pr as any) || []);
    })();
  }, []);

  const range = useMemo(
    () => (preset === "mes-input" ? rangeFromYM(mes) : rangeFromPreset(preset)),
    [preset, mes]
  );
  const prevR = useMemo(() => previousRange(range.start, range.end), [range]);

  const compute = (start: Date, end: Date) => {
    const validos = pedidos.filter((p) => {
      if (p.status === "cancelado") return false;
      const d = new Date(p.created_at);
      return d >= start && d < end;
    });
    const ids = new Set(validos.map((p) => p.id));
    const fat = validos.reduce((s, p) => s + Number(p.valor_total), 0);
    const itensV = itens.filter((i) => ids.has(i.pedido_id));
    const lucro = itensV.reduce((s, i) => s + Number(i.lucro_unitario || 0) * Number(i.quantidade), 0);
    const qtdItens = itensV.reduce((s, i) => s + Number(i.quantidade), 0);
    const pend = validos.filter((p) => p.status === "analise_pagamento").length;
    return { fat, lucro, qtdPedidos: validos.length, qtdItens, pend, validos, itensV };
  };

  const cur = useMemo(() => compute(range.start, range.end), [pedidos, itens, range]);
  const prev = useMemo(() => compute(prevR.start, prevR.end), [pedidos, itens, prevR]);

  const maisVendidos = useMemo(() => {
    const map = new Map<string, { qtd: number; receita: number }>();
    cur.itensV.forEach((i) => {
      const cur = map.get(i.produto_nome) || { qtd: 0, receita: 0 };
      cur.qtd += Number(i.quantidade);
      cur.receita += Number(i.subtotal || i.preco_unitario * i.quantidade);
      map.set(i.produto_nome, cur);
    });
    return [...map.entries()]
      .map(([nome, v]) => ({ nome, ...v }))
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 5);
  }, [cur.itensV]);

  const chartData = useMemo(() => {
    const days: { label: string; key: string; vendas: number; lucro: number }[] = [];
    const cursor = new Date(range.start);
    cursor.setHours(0, 0, 0, 0);
    while (cursor < range.end) {
      const key = cursor.toISOString().slice(0, 10);
      days.push({ label: fmtDay(cursor), key, vendas: 0, lucro: 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
    const idx = new Map(days.map((d, i) => [d.key, i]));
    cur.validos.forEach((p) => {
      const k = new Date(p.created_at).toISOString().slice(0, 10);
      const i = idx.get(k);
      if (i !== undefined) days[i].vendas += Number(p.valor_total);
    });
    cur.itensV.forEach((i) => {
      const ped = cur.validos.find((p) => p.id === i.pedido_id);
      if (!ped) return;
      const k = new Date(ped.created_at).toISOString().slice(0, 10);
      const idxD = idx.get(k);
      if (idxD !== undefined) days[idxD].lucro += Number(i.lucro_unitario || 0) * Number(i.quantidade);
    });
    return days;
  }, [range, cur]);

  const pedidosRecentes = useMemo(() => pedidos.slice(0, 6), [pedidos]);

  const alertasPagamento = useMemo(
    () => pedidos.filter((p) => p.status === "analise_pagamento").length,
    [pedidos]
  );
  const estoqueBaixo = useMemo(
    () => produtos.filter((p) => p.ativo && p.estoque > 0 && p.estoque <= 3),
    [produtos]
  );
  const esgotados = useMemo(
    () => produtos.filter((p) => p.ativo && p.estoque === 0),
    [produtos]
  );

  const insightTopo = maisVendidos[0];
  const variacaoFat = variation(cur.fat, prev.fat);

  const presetBtn = (key: typeof preset, label: string) => (
    <Button
      key={key} type="button" size="sm"
      variant={preset === key ? "default" : "outline"}
      onClick={() => setPreset(key)}
    >
      {label}
    </Button>
  );

  return (
    <div className="space-y-6 max-w-7xl animate-fade-in">
      {/* Header + filtros */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visão geral do período selecionado, com comparação ao período anterior.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {presetBtn("hoje", "Hoje")}
          {presetBtn("7d", "7 dias")}
          {presetBtn("30d", "30 dias")}
          {presetBtn("mes", "Este mês")}
          <Input
            type="month" value={mes}
            onChange={(e) => { setMes(e.target.value || ymOfNow()); setPreset("mes-input"); }}
            className={`w-[170px] ${preset === "mes-input" ? "border-primary" : ""}`}
          />
        </div>
      </div>

      {/* Ações rápidas */}
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline">
          <Link to="/admin/produtos"><Plus className="h-4 w-4 mr-1" />Criar produto</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link to="/admin/pedidos"><ListOrdered className="h-4 w-4 mr-1" />Ver pedidos</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link to="/admin/cupons"><Ticket className="h-4 w-4 mr-1" />Criar cupom</Link>
        </Button>
      </div>

      {/* Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={<DollarSign />} label="Faturamento" value={brl(cur.fat)} color="bg-success" delta={variation(cur.fat, prev.fat)} />
        <StatCard icon={<Wallet />} label="Lucro" value={brl(cur.lucro)} color="bg-primary" delta={variation(cur.lucro, prev.lucro)} />
        <StatCard icon={<ShoppingCart />} label="Pedidos" value={cur.qtdPedidos} color="bg-secondary" delta={variation(cur.qtdPedidos, prev.qtdPedidos)} />
        <StatCard icon={<Clock />} label="Pendentes" value={cur.pend} color="bg-warning" />
        <StatCard icon={<TrendingUp />} label="Itens vendidos" value={cur.qtdItens} color="bg-accent" delta={variation(cur.qtdItens, prev.qtdItens)} />
      </div>

      {/* Insight */}
      {(cur.fat > 0 || insightTopo) && (
        <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-success/10 border border-border rounded-2xl p-5 flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div className="text-sm space-y-1">
            {cur.fat > 0 && (
              <p>
                Seu faturamento{" "}
                <span className={`font-bold ${variacaoFat >= 0 ? "text-success" : "text-destructive"}`}>
                  {variacaoFat >= 0 ? "aumentou" : "diminuiu"} {Math.abs(variacaoFat).toFixed(1)}%
                </span>{" "}
                em relação ao período anterior.
              </p>
            )}
            {insightTopo && (
              <p>Produto mais vendido: <span className="font-bold">{insightTopo.nome}</span> ({insightTopo.qtd} un.)</p>
            )}
          </div>
        </div>
      )}

      {/* Gráfico */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-xl">Vendas no período</h2>
          <span className="text-xs text-muted-foreground">{chartData.length} dia(s)</span>
        </div>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `R$${v}`} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                formatter={(v: number, name) => [brl(v), name === "vendas" ? "Vendas" : "Lucro"]}
              />
              <Area type="monotone" dataKey="vendas" stroke="hsl(var(--primary))" fill="url(#gv)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Mais vendidos + Pedidos recentes */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" /> Mais vendidos
          </h2>
          {maisVendidos.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma venda no período.</p>
          ) : (
            <div className="space-y-2">
              {maisVendidos.map((p, idx) => (
                <div key={p.nome} className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg">
                  <div className="w-7 h-7 rounded-full bg-primary/15 text-primary font-bold flex items-center justify-center text-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{p.nome}</div>
                    <div className="text-xs text-muted-foreground">{p.qtd} un. vendidas</div>
                  </div>
                  <div className="font-bold text-primary text-sm">{brl(p.receita)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-xl">Pedidos recentes</h2>
            <Button asChild size="sm" variant="ghost"><Link to="/admin/pedidos">Ver todos</Link></Button>
          </div>
          {pedidosRecentes.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum pedido ainda.</p>
          ) : (
            <div className="space-y-2">
              {pedidosRecentes.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{p.codigo}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString("pt-BR")} ·{" "}
                      {new Date(p.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <Badge className={`${statusColors[p.status]} text-[10px]`}>{statusLabels[p.status]}</Badge>
                  <div className="font-bold text-sm w-24 text-right">{brl(Number(p.valor_total))}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Alertas */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" /> Alertas
        </h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <AlertCard
            icon={<Clock className="h-5 w-5" />}
            tone="warning"
            title="Aguardando pagamento"
            count={alertasPagamento}
            empty="Sem pedidos pendentes"
            to="/admin/pedidos"
          />
          <AlertCard
            icon={<PackageSearch className="h-5 w-5" />}
            tone="accent"
            title="Estoque baixo"
            count={estoqueBaixo.length}
            empty="Estoques saudáveis"
            to="/admin/produtos"
            preview={estoqueBaixo.slice(0, 3).map((p) => `${p.nome} (${p.estoque})`)}
          />
          <AlertCard
            icon={<PackageX className="h-5 w-5" />}
            tone="destructive"
            title="Esgotados"
            count={esgotados.length}
            empty="Nenhum esgotado"
            to="/admin/produtos"
            preview={esgotados.slice(0, 3).map((p) => p.nome)}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, delta }: any) {
  const hasDelta = typeof delta === "number" && isFinite(delta);
  const up = hasDelta && delta > 0.5;
  const down = hasDelta && delta < -0.5;
  return (
    <div className="bg-card border border-border rounded-2xl p-5 transition-all hover:shadow-md hover:-translate-y-0.5">
      <div className={`w-10 h-10 ${color} text-white rounded-xl flex items-center justify-center mb-3`}>{icon}</div>
      <div className="text-xs text-muted-foreground font-bold uppercase">{label}</div>
      <div className="font-display font-bold text-2xl mt-1">{value}</div>
      {hasDelta && (
        <div className={`mt-2 text-xs flex items-center gap-1 font-semibold ${up ? "text-success" : down ? "text-destructive" : "text-muted-foreground"}`}>
          {up ? <ArrowUp className="h-3 w-3" /> : down ? <ArrowDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
          {Math.abs(delta).toFixed(1)}% vs período anterior
        </div>
      )}
    </div>
  );
}

function AlertCard({ icon, tone, title, count, empty, to, preview }: any) {
  const toneMap: Record<string, string> = {
    warning: "bg-warning/10 text-warning border-warning/30",
    accent: "bg-accent/10 text-accent-foreground border-accent/30",
    destructive: "bg-destructive/10 text-destructive border-destructive/30",
  };
  return (
    <Link to={to} className={`block rounded-xl border p-4 transition-all hover:shadow-md ${toneMap[tone]}`}>
      <div className="flex items-center gap-2 font-bold">{icon}<span>{title}</span></div>
      <div className="font-display text-3xl font-bold mt-2">{count}</div>
      {count === 0 ? (
        <div className="text-xs opacity-70 mt-1">{empty}</div>
      ) : preview && preview.length > 0 ? (
        <ul className="text-xs opacity-80 mt-2 space-y-0.5">
          {preview.map((p: string) => <li key={p} className="truncate">• {p}</li>)}
        </ul>
      ) : null}
    </Link>
  );
}
