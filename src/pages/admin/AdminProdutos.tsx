import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { brl } from "@/lib/format";
import { Plus, Pencil, Trash2, GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function AdminProdutos() {
  const [list, setList] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [edit, setEdit] = useState<any>(null);
  const [open, setOpen] = useState(false);

  const carregar = () =>
    supabase
      .from("produtos")
      .select("*, categorias(nome)")
      .order("ordem", { ascending: true })
      .order("created_at", { ascending: false })
      .then(({ data }) => setList(data || []));

  useEffect(() => {
    carregar();
    supabase.from("categorias").select("id, nome").then(({ data }) => setCats(data || []));
  }, []);

  const novo = () => { setEdit({ nome: "", slug: "", descricao: "", preco: 0, peso_g: 0, dimensoes: "", estoque: 0, imagem_upload: "", imagem_link: "", categoria_id: null, ativo: true, destaque: false }); setOpen(true); };
  const abrir = (p: any) => {
    // Heurística: se a URL aponta para o nosso bucket, tratamos como upload; caso contrário, link externo.
    const isUpload = !!p.imagem_url && p.imagem_url.includes("/storage/v1/object/public/produtos/");
    setEdit({ ...p, imagem_upload: isUpload ? p.imagem_url : "", imagem_link: isUpload ? "" : (p.imagem_url || "") });
    setOpen(true);
  };

  const uploadImg = async (f: File) => {
    const tiposOk = ["image/jpeg", "image/png", "image/webp"];
    if (!tiposOk.includes(f.type)) return toast.error("Use JPG, PNG ou WEBP");
    if (f.size > 5 * 1024 * 1024) return toast.error("Imagem deve ter até 5MB");
    const ext = f.name.split(".").pop();
    const path = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("produtos").upload(path, f, { cacheControl: "31536000", contentType: f.type });
    if (error) { toast.error(error.message); return; }
    const { data: { publicUrl } } = supabase.storage.from("produtos").getPublicUrl(path);
    setEdit({ ...edit, imagem_upload: publicUrl });
    toast.success("Imagem enviada");
  };

  const removerUpload = () => setEdit({ ...edit, imagem_upload: "" });
  const removerLink = () => setEdit({ ...edit, imagem_link: "" });

  const salvar = async () => {
    if (!edit.nome) return toast.error("Nome obrigatório");
    // Upload tem prioridade sobre URL manual
    const imagem_url = edit.imagem_upload || edit.imagem_link || null;
    const payload: any = { ...edit, imagem_url, slug: edit.slug || slugify(edit.nome), preco: Number(edit.preco), peso_g: Number(edit.peso_g), estoque: Number(edit.estoque) };
    delete payload.categorias;
    delete payload.imagem_upload;
    delete payload.imagem_link;
    const { error } = edit.id
      ? await supabase.from("produtos").update(payload).eq("id", edit.id)
      : await supabase.from("produtos").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Salvo");
    setOpen(false); carregar();
  };

  const excluir = async (id: string) => {
    if (!confirm("Excluir este produto?")) return;
    const { error } = await supabase.from("produtos").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Excluído"); carregar();
  };

  const persistirOrdem = async (items: any[]) => {
    setList(items);
    const updates = items.map((p, i) =>
      supabase.from("produtos").update({ ordem: i + 1 }).eq("id", p.id)
    );
    const results = await Promise.all(updates);
    const err = results.find((r) => r.error);
    if (err?.error) toast.error("Erro ao salvar ordem");
    else toast.success("Ordem atualizada");
  };

  const mover = (id: string, dir: -1 | 1) => {
    const idx = list.findIndex((p) => p.id === id);
    const novoIdx = idx + dir;
    if (idx < 0 || novoIdx < 0 || novoIdx >= list.length) return;
    persistirOrdem(arrayMove(list, idx, novoIdx));
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = list.findIndex((p) => p.id === active.id);
    const newIdx = list.findIndex((p) => p.id === over.id);
    persistirOrdem(arrayMove(list, oldIdx, newIdx));
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-3xl font-bold">Produtos</h1>
          <p className="text-sm text-muted-foreground mt-1">Arraste pelo ícone <GripVertical className="inline h-3 w-3" /> ou use as setas para reordenar.</p>
        </div>
        <Button onClick={novo} className="rounded-full"><Plus className="h-4 w-4 mr-1" />Novo</Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={list.map((p) => p.id)} strategy={rectSortingStrategy}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map((p, i) => (
              <SortableCard
                key={p.id}
                p={p}
                index={i}
                total={list.length}
                onEdit={abrir}
                onDelete={excluir}
                onUp={() => mover(p.id, -1)}
                onDown={() => mover(p.id, 1)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{edit?.id ? "Editar" : "Novo"} produto</DialogTitle></DialogHeader>
          {edit && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nome"><Input value={edit.nome} onChange={(e) => setEdit({ ...edit, nome: e.target.value, slug: edit.slug || slugify(e.target.value) })} /></Field>
                <Field label="Slug"><Input value={edit.slug} onChange={(e) => setEdit({ ...edit, slug: slugify(e.target.value) })} /></Field>
              </div>
              <Field label="Descrição"><Textarea value={edit.descricao || ""} onChange={(e) => setEdit({ ...edit, descricao: e.target.value })} /></Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Preço (R$)"><Input type="number" step="0.01" value={edit.preco} onChange={(e) => setEdit({ ...edit, preco: e.target.value })} /></Field>
                <Field label="Peso (g)"><Input type="number" value={edit.peso_g} onChange={(e) => setEdit({ ...edit, peso_g: e.target.value })} /></Field>
                <Field label="Estoque"><Input type="number" value={edit.estoque} onChange={(e) => setEdit({ ...edit, estoque: e.target.value })} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Dimensões"><Input value={edit.dimensoes || ""} onChange={(e) => setEdit({ ...edit, dimensoes: e.target.value })} placeholder="ex: 10x10x15cm" /></Field>
                <Field label="Categoria">
                  <Select value={edit.categoria_id || ""} onValueChange={(v) => setEdit({ ...edit, categoria_id: v })}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>{cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="Imagem">
                <div className="flex gap-2 items-center">
                  <Input value={edit.imagem_url || ""} onChange={(e) => setEdit({ ...edit, imagem_url: e.target.value })} placeholder="URL ou faça upload" />
                  <input type="file" accept="image/*" id="img-up" className="hidden" onChange={(e) => e.target.files && uploadImg(e.target.files[0])} />
                  <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById("img-up")?.click()}>Upload</Button>
                </div>
                {edit.imagem_url && <img src={edit.imagem_url} className="w-32 h-32 object-cover rounded-lg mt-2" alt="" />}
              </Field>
              <div className="flex gap-6">
                <label className="flex items-center gap-2"><Switch checked={edit.ativo} onCheckedChange={(v) => setEdit({ ...edit, ativo: v })} />Ativo</label>
                <label className="flex items-center gap-2"><Switch checked={edit.destaque} onCheckedChange={(v) => setEdit({ ...edit, destaque: v })} />Destaque</label>
              </div>
              <Button onClick={salvar} className="w-full bg-gradient-brand text-white">Salvar</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SortableCard({ p, index, total, onEdit, onDelete, onUp, onDown }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: p.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="bg-card border rounded-2xl overflow-hidden relative">
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
        <button {...attributes} {...listeners} className="bg-background/90 backdrop-blur rounded-lg p-1.5 cursor-grab active:cursor-grabbing border shadow-sm" aria-label="Arrastar">
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex flex-col gap-0.5 bg-background/90 backdrop-blur rounded-lg border shadow-sm">
          <button onClick={onUp} disabled={index === 0} className="p-1 disabled:opacity-30 hover:bg-accent rounded-t-lg" aria-label="Subir"><ChevronUp className="h-3 w-3" /></button>
          <button onClick={onDown} disabled={index === total - 1} className="p-1 disabled:opacity-30 hover:bg-accent rounded-b-lg" aria-label="Descer"><ChevronDown className="h-3 w-3" /></button>
        </div>
      </div>
      <div className="absolute top-2 right-2 z-10 bg-primary text-primary-foreground text-xs font-bold rounded-full px-2 py-0.5">#{index + 1}</div>
      {p.imagem_url && <img src={p.imagem_url} alt="" className="w-full aspect-video object-cover" />}
      <div className="p-4 space-y-1">
        <div className="font-bold line-clamp-1">{p.nome}</div>
        <div className="text-sm text-primary font-bold">{brl(Number(p.preco))}</div>
        <div className="text-xs text-muted-foreground">Estoque: {p.estoque} {!p.ativo && "· Inativo"}</div>
        <div className="flex gap-2 pt-2">
          <Button size="sm" variant="outline" onClick={() => onEdit(p)}><Pencil className="h-3 w-3" /></Button>
          <Button size="sm" variant="outline" onClick={() => onDelete(p.id)} className="text-destructive"><Trash2 className="h-3 w-3" /></Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: any) {
  return <div className="space-y-1.5"><Label className="text-xs font-bold uppercase">{label}</Label>{children}</div>;
}
