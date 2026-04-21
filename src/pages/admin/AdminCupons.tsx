import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Ticket } from "lucide-react";
import { brl } from "@/lib/format";

type Cupom = {
  id: string;
  codigo: string;
  tipo: "percentual" | "fixo";
  valor: number;
  validade: string | null;
  limite_uso: number | null;
  usos: number;
  ativo: boolean;
};

const empty = {
  codigo: "",
  tipo: "percentual" as "percentual" | "fixo",
  valor: 10,
  validade: "",
  limite_uso: "",
  ativo: true,
};

export default function AdminCupons() {
  const [list, setList] = useState<Cupom[]>([]);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any>(empty);
  const [editId, setEditId] = useState<string | null>(null);

  const carregar = async () => {
    const { data } = await (supabase as any).from("cupons").select("*").order("created_at", { ascending: false });
    setList(data || []);
  };
  useEffect(() => { carregar(); }, []);

  const abrir = (c?: Cupom) => {
    if (c) {
      setEditId(c.id);
      setEdit({
        codigo: c.codigo,
        tipo: c.tipo,
        valor: Number(c.valor),
        validade: c.validade ? c.validade.slice(0, 16) : "",
        limite_uso: c.limite_uso?.toString() || "",
        ativo: c.ativo,
      });
    } else {
      setEditId(null);
      setEdit(empty);
    }
    setOpen(true);
  };

  const salvar = async () => {
    const codigo = edit.codigo.trim().toUpperCase();
    if (!codigo) return toast.error("Informe o código");
    if (!edit.valor || Number(edit.valor) <= 0) return toast.error("Valor inválido");

    const payload: any = {
      codigo,
      tipo: edit.tipo,
      valor: Number(edit.valor),
      validade: edit.validade ? new Date(edit.validade).toISOString() : null,
      limite_uso: edit.limite_uso ? Number(edit.limite_uso) : null,
      ativo: edit.ativo,
    };

    const { error } = editId
      ? await (supabase as any).from("cupons").update(payload).eq("id", editId)
      : await (supabase as any).from("cupons").insert(payload);

    if (error) return toast.error(error.message);
    toast.success(editId ? "Cupom atualizado" : "Cupom criado");
    setOpen(false);
    carregar();
  };

  const excluir = async (id: string) => {
    if (!confirm("Excluir este cupom?")) return;
    const { error } = await (supabase as any).from("cupons").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Excluído");
    carregar();
  };

  const toggle = async (id: string, ativo: boolean) => {
    await (supabase as any).from("cupons").update({ ativo }).eq("id", id);
    carregar();
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold flex items-center gap-2">
          <Ticket className="h-7 w-7 text-primary" /> Cupons de desconto
        </h1>
        <Button onClick={() => abrir()}><Plus className="h-4 w-4 mr-1" />Novo cupom</Button>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Código</th>
              <th className="p-3">Desconto</th>
              <th className="p-3">Validade</th>
              <th className="p-3">Uso</th>
              <th className="p-3">Ativo</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Nenhum cupom criado.</td></tr>
            )}
            {list.map((c) => (
              <tr key={c.id} className="border-t hover:bg-muted/30">
                <td className="p-3 font-mono font-bold">{c.codigo}</td>
                <td className="p-3">
                  {c.tipo === "percentual" ? `${Number(c.valor)}%` : brl(Number(c.valor))}
                </td>
                <td className="p-3 text-xs">
                  {c.validade ? new Date(c.validade).toLocaleString("pt-BR") : <span className="text-muted-foreground">Sem validade</span>}
                </td>
                <td className="p-3 text-xs">
                  {c.usos}{c.limite_uso ? ` / ${c.limite_uso}` : ""}
                </td>
                <td className="p-3">
                  <Switch checked={c.ativo} onCheckedChange={(v) => toggle(c.id, v)} />
                </td>
                <td className="p-3 flex gap-1 justify-end">
                  <Button size="icon" variant="ghost" onClick={() => abrir(c)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => excluir(c.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{editId ? "Editar cupom" : "Novo cupom"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-bold uppercase">Código</Label>
              <Input
                value={edit.codigo}
                onChange={(e) => setEdit({ ...edit, codigo: e.target.value.toUpperCase() })}
                placeholder="DESCONTO10"
                className="font-mono"
                maxLength={30}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold uppercase">Tipo</Label>
                <Select value={edit.tipo} onValueChange={(v: any) => setEdit({ ...edit, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentual">Percentual (%)</SelectItem>
                    <SelectItem value="fixo">Valor fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-bold uppercase">
                  Valor {edit.tipo === "percentual" ? "(%)" : "(R$)"}
                </Label>
                <Input
                  type="number"
                  min={0}
                  step={edit.tipo === "percentual" ? 1 : 0.01}
                  value={edit.valor}
                  onChange={(e) => setEdit({ ...edit, valor: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs font-bold uppercase">Validade (opcional)</Label>
              <Input
                type="datetime-local"
                value={edit.validade}
                onChange={(e) => setEdit({ ...edit, validade: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs font-bold uppercase">Limite de uso (opcional)</Label>
              <Input
                type="number"
                min={1}
                value={edit.limite_uso}
                onChange={(e) => setEdit({ ...edit, limite_uso: e.target.value })}
                placeholder="Ilimitado"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={edit.ativo} onCheckedChange={(v) => setEdit({ ...edit, ativo: v })} />
              <Label>Cupom ativo</Label>
            </div>
            <Button onClick={salvar} className="w-full">Salvar cupom</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
