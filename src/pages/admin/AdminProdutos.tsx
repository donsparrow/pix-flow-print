import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
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

  const carregar = async () => {
    const { data } = await supabase
      .from("produtos")
      .select("*, produto_categorias(categoria_id, categorias(id, nome, slug))")
      .order("ordem", { ascending: true })
      .order("created_at", { ascending: false });
    setList(data || []);
  };

  useEffect(() => {
    carregar();
    supabase.from("categorias").select("id, nome, slug").order("nome").then(({ data }) => setCats(data || []));
  }, []);

  const novo = () => {
    setEdit({ nome: "", slug: "", descricao: "", preco: 0, peso_g: 0, dimensoes: "", estoque: 0, imagem_upload: "", imagem_link: "", categoria_ids: [], ativo: true, destaque: false, cores_texto: "" });
    setOpen(true);
  };
  const abrir = (p: any) => {
    const isUpload = !!p.imagem_url && p.imagem_url.includes("/storage/v1/object/public/produtos/");
    const cores_texto = Array.isArray(p.cores) ? p.cores.join(", ") : "";
    const categoria_ids = (p.produto_categorias || []).map((pc: any) => pc.categoria_id);
    setEdit({ ...p, imagem_upload: isUpload ? p.imagem_url : "", imagem_link: isUpload ? "" : (p.imagem_url || ""), cores_texto, categoria_ids });
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

  const sincronizarCategorias = async (produtoId: string, categoriaIds: string[]) => {
    // Garante "Todos" sempre presente
    const todos = cats.find((c) => c.slug === "todos");
    const finalIds = Array.from(new Set([...(categoriaIds || []), ...(todos ? [todos.id] : [])]));

    // Remove vínculos que não estão mais selecionados
    await supabase
      .from("produto_categorias")
      .delete()
      .eq("produto_id", produtoId)
      .not("categoria_id", "in", `(${finalIds.join(",")})`);

    // Insere novos vínculos ignorando duplicatas (trigger pode ter recriado "Todos")
    if (finalIds.length > 0) {
      const { error } = await supabase
        .from("produto_categorias")
        .upsert(
          finalIds.map((cid) => ({ produto_id: produtoId, categoria_id: cid })),
          { onConflict: "produto_id,categoria_id", ignoreDuplicates: true }
        );
      if (error) throw error;
    }
  };

  const salvar = async () => {
    if (!edit.nome) return toast.error("Nome obrigatório");
    const todos = cats.find((c) => c.slug === "todos");
    const userSelecionou = (edit.categoria_ids || []).filter((id: string) => id !== todos?.id);
    if (cats.length > 1 && userSelecionou.length === 0) {
      return toast.error("Selecione ao menos uma categoria além de 'Todos'");
    }

    const imagem_url = edit.imagem_upload || edit.imagem_link || null;
    const cores = (edit.cores_texto || "")
      .split(",")
      .map((c: string) => c.trim())
      .filter(Boolean);
    const payload: any = { ...edit, imagem_url, cores, slug: edit.slug || slugify(edit.nome), preco: Number(edit.preco), peso_g: Number(edit.peso_g), estoque: Number(edit.estoque) };
    delete payload.categorias;
    delete payload.produto_categorias;
    delete payload.imagem_upload;
    delete payload.imagem_link;
    delete payload.cores_texto;
    delete payload.categoria_ids;
    delete payload.categoria_id; // legacy: ignorado

    let produtoId = edit.id;
    if (produtoId) {
      const { error } = await supabase.from("produtos").update(payload).eq("id", produtoId);
      if (error) return toast.error(error.message);
    } else {
      const { data, error } = await supabase.from("produtos").insert(payload).select("id").single();
      if (error) return toast.error(error.message);
      produtoId = data.id;
    }

    await sincronizarCategorias(produtoId, edit.categoria_ids || []);
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
              <Field label="Dimensões">
                <Input value={edit.dimensoes || ""} onChange={(e) => setEdit({ ...edit, dimensoes: e.target.value })} placeholder="ex: 10x10x15cm" />
              </Field>
              <Field label="Categorias (selecione uma ou mais)">
                <div className="border rounded-xl p-3 bg-muted/30 space-y-2 max-h-48 overflow-y-auto">
                  {cats.length === 0 && <div className="text-xs text-muted-foreground">Nenhuma categoria cadastrada.</div>}
                  {cats.map((c) => {
                    const isTodos = c.slug === "todos";
                    const checked = isTodos || (edit.categoria_ids || []).includes(c.id);
                    return (
                      <label key={c.id} className={`flex items-center gap-2 cursor-pointer ${isTodos ? "opacity-70" : ""}`}>
                        <Checkbox
                          checked={checked}
                          disabled={isTodos}
                          onCheckedChange={(v) => {
                            const cur = new Set<string>(edit.categoria_ids || []);
                            if (v) cur.add(c.id); else cur.delete(c.id);
                            setEdit({ ...edit, categoria_ids: Array.from(cur) });
                          }}
                        />
                        <span className="text-sm font-semibold">{c.nome}</span>
                        {isTodos && <span className="text-[10px] uppercase font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">auto</span>}
                      </label>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">A categoria <strong>Todos</strong> é aplicada automaticamente a todos os produtos.</p>
              </Field>
              <Field label="Imagem do produto">
                <div className="space-y-3 border rounded-xl p-3 bg-muted/30">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase">Upload (prioridade)</span>
                      {edit.imagem_upload && <Button type="button" variant="ghost" size="sm" onClick={removerUpload} className="h-7 text-destructive"><Trash2 className="h-3 w-3 mr-1" />Remover</Button>}
                    </div>
                    <div className="flex gap-2 items-center flex-wrap">
                      <input type="file" accept="image/jpeg,image/png,image/webp" id="img-up" className="hidden" onChange={(e) => e.target.files && uploadImg(e.target.files[0])} />
                      <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById("img-up")?.click()}>
                        {edit.imagem_upload ? "Substituir arquivo" : "Selecionar arquivo"}
                      </Button>
                      <span className="text-xs text-muted-foreground">JPG, PNG ou WEBP · até 5MB</span>
                    </div>
                    {edit.imagem_upload && <img src={edit.imagem_upload} loading="lazy" className="w-32 h-32 object-cover rounded-lg border" alt="Preview do upload" />}
                  </div>

                  <div className="border-t pt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase">URL externa {edit.imagem_upload && <span className="text-muted-foreground normal-case font-normal">(ignorada — upload tem prioridade)</span>}</span>
                      {edit.imagem_link && <Button type="button" variant="ghost" size="sm" onClick={removerLink} className="h-7 text-destructive"><Trash2 className="h-3 w-3 mr-1" />Limpar</Button>}
                    </div>
                    <Input value={edit.imagem_link || ""} onChange={(e) => setEdit({ ...edit, imagem_link: e.target.value })} placeholder="https://exemplo.com/imagem.jpg" />
                    {edit.imagem_link && !edit.imagem_upload && <img src={edit.imagem_link} loading="lazy" className="w-32 h-32 object-cover rounded-lg border" alt="Preview da URL" />}
                  </div>
                </div>
              </Field>
              <Field label="Cores disponíveis (opcional)">
                <Input
                  value={edit.cores_texto || ""}
                  onChange={(e) => setEdit({ ...edit, cores_texto: e.target.value })}
                  placeholder="ex: Azul, Preto, Branco"
                />
                <p className="text-xs text-muted-foreground mt-1">Separe por vírgula. Se preenchido, o cliente será obrigado a escolher uma cor antes de finalizar o pedido. Estoque continua geral.</p>
                {(edit.cores_texto || "").split(",").map((c: string) => c.trim()).filter(Boolean).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(edit.cores_texto || "").split(",").map((c: string) => c.trim()).filter(Boolean).map((c: string, idx: number) => (
                      <span key={idx} className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-semibold border border-primary/20">{c}</span>
                    ))}
                  </div>
                )}
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
