import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { brl, statusLabels, statusColors } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Eye, Image as ImageIcon, Ban, RotateCcw, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [sel, setSel] = useState<any>(null);
  const [itens, setItens] = useState<any[]>([]);
  const [comp, setComp] = useState<any>(null);

  const carregar = () => supabase.from("pedidos").select("*").order("created_at", { ascending: false }).then(({ data }) => setPedidos(data || []));
  useEffect(() => { carregar(); }, []);

  const abrir = async (p: any) => {
    setSel(p);
    const { data: i } = await supabase.from("itens_pedido").select("*").eq("pedido_id", p.id);
    setItens(i || []);
    const { data: c } = await supabase.from("comprovantes").select("*").eq("pedido_id", p.id).order("created_at", { ascending: false }).maybeSingle();
    setComp(c);
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("pedidos").update({ status: status as any }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(status === "cancelado" ? "Pedido cancelado" : status === "analise_pagamento" ? "Pedido reativado" : "Status atualizado");
    carregar();
    if (sel?.id === id) setSel({ ...sel, status });
  };

  const apagarTodos = async () => {
    // Apaga comprovantes -> itens -> pedidos (sem afetar produtos, categorias, cupons, configs)
    const { error: e1 } = await supabase.from("comprovantes").delete().not("id", "is", null);
    if (e1) return toast.error("Erro ao apagar comprovantes: " + e1.message);
    const { error: e2 } = await supabase.from("itens_pedido").delete().not("id", "is", null);
    if (e2) return toast.error("Erro ao apagar itens: " + e2.message);
    const { error: e3 } = await supabase.from("pedidos").delete().not("id", "is", null);
    if (e3) return toast.error("Erro ao apagar pedidos: " + e3.message);
    toast.success("Todos os pedidos foram apagados");
    setSel(null);
    carregar();
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="font-display text-3xl font-bold">Pedidos</h1>
        <ApagarTodosBotao total={pedidos.length} onConfirm={apagarTodos} />
      </div>
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Código</th><th className="p-3">Cliente</th><th className="p-3">Total</th><th className="p-3">Status</th><th className="p-3">Data</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map((p) => {
              const cancelado = p.status === "cancelado";
              return (
                <tr
                  key={p.id}
                  className={`border-t hover:bg-muted/30 ${cancelado ? "bg-destructive/5 text-muted-foreground line-through decoration-muted-foreground/40" : ""}`}
                >
                  <td className="p-3 font-mono font-bold no-underline">{p.codigo}</td>
                  <td className="p-3">{p.cliente_nome}</td>
                  <td className={`p-3 font-bold ${cancelado ? "text-muted-foreground" : "text-primary"}`}>{brl(Number(p.valor_total))}</td>
                  <td className="p-3"><Badge className={statusColors[p.status]}>{statusLabels[p.status]}</Badge></td>
                  <td className="p-3 text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("pt-BR")}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => abrir(p)}><Eye className="h-3 w-3 mr-1" />Ver</Button>
                      {cancelado ? (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(p.id, "analise_pagamento")} title="Reativar pedido">
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      ) : (
                        <CancelarBotao onConfirm={() => updateStatus(p.id, "cancelado")} codigo={p.codigo} compact />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {sel && (
            <>
              <DialogHeader><DialogTitle className="font-display">{sel.codigo}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-wrap items-end gap-2">
                  <div className="flex-1 min-w-[200px]">
                    <div className="text-xs font-bold uppercase text-muted-foreground mb-1">Status</div>
                    <Select value={sel.status} onValueChange={(v) => updateStatus(sel.id, v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {sel.status === "cancelado" ? (
                    <Button variant="outline" onClick={() => updateStatus(sel.id, "analise_pagamento")}>
                      <RotateCcw className="h-4 w-4 mr-1" />Reativar pedido
                    </Button>
                  ) : (
                    <CancelarBotao onConfirm={() => updateStatus(sel.id, "cancelado")} codigo={sel.codigo} />
                  )}
                </div>
                {sel.status === "cancelado" && (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm">
                    <strong className="text-destructive">Pedido cancelado.</strong>{" "}
                    Não é contabilizado em faturamento, lucro ou itens vendidos.
                  </div>
                )}
                <div className="text-sm space-y-1">
                  <div><strong>Cliente:</strong> {sel.cliente_nome} · {sel.cliente_telefone}</div>
                  {sel.cliente_email && <div><strong>Email:</strong> {sel.cliente_email}</div>}
                  {sel.cliente_endereco && <div><strong>Endereço:</strong> {sel.cliente_endereco}, {sel.cliente_numero} — {sel.cliente_bairro}, {sel.cliente_cidade}/{sel.cliente_estado} — CEP {sel.cliente_cep}</div>}
                  <div><strong>Frete:</strong> {sel.metodo_frete} ({brl(Number(sel.valor_frete))})</div>
                  {sel.observacoes && <div><strong>Obs:</strong> {sel.observacoes}</div>}
                </div>
                <div className="border rounded-xl p-3">
                  <div className="font-bold mb-2">Itens</div>
                  {itens.map((i) => (
                    <div key={i.id} className="flex justify-between text-sm py-1">
                      <span>{i.quantidade}× {i.produto_nome}{i.cor_selecionada && <span className="text-muted-foreground"> · Cor: <strong className="text-foreground">{i.cor_selecionada}</strong></span>}</span>
                      <span>{brl(Number(i.subtotal))}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm pt-2 mt-2 border-t">
                    <span>Subtotal</span><span>{brl(Number(sel.valor_produtos))}</span>
                  </div>
                  {Number(sel.cupom_desconto) > 0 && (
                    <div className="flex justify-between text-sm text-success">
                      <span>Cupom <span className="font-mono font-bold">{sel.cupom_codigo}</span></span>
                      <span>− {brl(Number(sel.cupom_desconto))}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>Frete</span><span>{brl(Number(sel.valor_frete))}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-2 mt-2">
                    <span>Total</span><span className="text-primary">{brl(Number(sel.valor_total))}</span>
                  </div>
                </div>
                {comp ? (
                  <div>
                    <div className="font-bold mb-2 flex items-center gap-2"><ImageIcon className="h-4 w-4" />Comprovante</div>
                    <a href={comp.arquivo_url} target="_blank" rel="noreferrer">
                      <img src={comp.arquivo_url} alt="Comprovante" className="rounded-xl border max-h-80 mx-auto" />
                    </a>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Sem comprovante enviado.</div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CancelarBotao({ onConfirm, codigo, compact }: { onConfirm: () => void; codigo: string; compact?: boolean }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {compact ? (
          <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" title="Cancelar pedido">
            <Ban className="h-3 w-3" />
          </Button>
        ) : (
          <Button variant="outline" className="text-destructive border-destructive/40 hover:bg-destructive/10">
            <Ban className="h-4 w-4 mr-1" />Cancelar pedido
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancelar pedido {codigo}?</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja cancelar este pedido? O pedido será mantido no sistema,
            mas não será contabilizado no faturamento, lucro ou itens vendidos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Voltar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Cancelar pedido
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
