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
import { Plus, Pencil, Trash2, GripVertical, ChevronUp, ChevronDown, Star, X } from "lucide-react";
import { toast } from "sonner";
import { mp4ToGif } from "@/lib/mp4ToGif";
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
    // Produtos com lucro (admin-only via RPC) + associações de categorias
    const [{ data: prods }, { data: assocs }] = await Promise.all([
      (supabase as any).rpc("get_produtos_admin"),
      supabase
        .from("produto_categorias")
        .select("produto_id, categoria_id, categorias(id, nome, slug)"),
    ]);
    const byProd = new Map<string, any[]>();
    (assocs || []).forEach((a: any) => {
      const arr = byProd.get(a.produto_id) || [];
      arr.push({ categoria_id: a.categoria_id, categorias: a.categorias });
      byProd.set(a.produto_id, arr);
    });
    const merged = (prods || []).map((p: any) => ({
      ...p,
      produto_categorias: byProd.get(p.id) || [],
    }));
    setList(merged);
  };

  useEffect(() => {
    carregar();
    supabase.from("categorias").select("id, nome, slug").order("nome").then(({ data }) => setCats(data || []));
  }, []);

  const novo = () => {
    setEdit({ nome: "", slug: "", descricao: "", preco: 0, lucro: 0, peso_g: 0, dimensoes: "", estoque: 0, imagens: [], imagem_link: "", categoria_ids: [], ativo: true, destaque: false, cores_texto: "" });
    setOpen(true);
  };
  const abrir = (p: any) => {
    const cores_texto = Array.isArray(p.cores) ? p.cores.join(", ") : "";
    const categoria_ids = (p.produto_categorias || []).map((pc: any) => pc.categoria_id);
    const extras = Array.isArray(p.imagens_extras) ? p.imagens_extras.filter((u: any) => typeof u === "string" && u) : [];
    const imagens: string[] = [];
    if (p.imagem_url) imagens.push(p.imagem_url);
    for (const u of extras) if (!imagens.includes(u)) imagens.push(u);
    setEdit({ ...p, imagens, imagem_link: "", cores_texto, categoria_ids });
    setOpen(true);
  };

  const uploadImg = async (files: FileList) => {
    const tiposOk = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const novas: string[] = [];
    for (let f of Array.from(files)) {
      if (f.type === "video/mp4") {
        if (f.size > 50 * 1024 * 1024) { toast.error(`${f.name}: vídeo até 50MB`); continue; }
        const tid = toast.loading("Convertendo vídeo em GIF... 0%");
        try {
          f = await mp4ToGif(f, (pct) => toast.loading(`Convertendo vídeo em GIF... ${pct}%`, { id: tid }));
          toast.dismiss(tid);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Falha ao converter vídeo", { id: tid });
          continue;
        }
      }
      if (!tiposOk.includes(f.type)) { toast.error(`${f.name}: use JPG, PNG, WEBP ou GIF`); continue; }
      const limite = f.type === "image/gif" ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
      if (f.size > limite) { toast.error(f.type === "image/gif" ? `${f.name}: GIF: até 10MB` : `${f.name}: até 5MB`); continue; }
      const ext = f.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("produtos").upload(path, f, { cacheControl: "31536000", contentType: f.type });
      if (error) { toast.error(error.message); continue; }
      const { data: { publicUrl } } = supabase.storage.from("produtos").getPublicUrl(path);
      novas.push(publicUrl);
    }
    if (novas.length > 0) {
      setEdit((cur: any) => ({ ...cur, imagens: [...(cur.imagens || []), ...novas] }));
      toast.success(`${novas.length} imagem(ns) enviada(s)`);
    }
  };

  const adicionarLink = () => {
    const url = (edit.imagem_link || "").trim();
    if (!url) return;
    setEdit({ ...edit, imagens: [...(edit.imagens || []), url], imagem_link: "" });
  };
  const removerImagem = (idx: number) => {
    const arr = [...(edit.imagens || [])];
    arr.splice(idx, 1);
    setEdit({ ...edit, imagens: arr });
  };
  const definirCapa = (idx: number) => {
    if (idx === 0) return;
    const arr = [...(edit.imagens || [])];
    const [item] = arr.splice(idx, 1);
    arr.unshift(item);
    setEdit({ ...edit, imagens: arr });
  };
  const moverImagem = (idx: number, dir: -1 | 1) => {
    const arr = [...(edit.imagens || [])];
    const novo = idx + dir;
    if (novo < 0 || novo >= arr.length) return;
    [arr[idx], arr[novo]] = [arr[novo], arr[idx]];
    setEdit({ ...edit, imagens: arr });
  };

  const sincronizarCategorias = async (produtoId: string, categoriaIds: string[]) => {
    const todos = cats.find((c) => c.slug === "todos");
    const finalIds = Array.from(new Set([...(categoriaIds || []), ...(todos ? [todos.id] : [])]));
    await supabase
      .from("produto_categorias")
      .delete()
      .eq("produto_id", produtoId)
      .not("categoria_id", "in", `(${finalIds.join(",")})`);
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

    const imagens: string[] = (edit.imagens || []).filter((u: string) => typeof u === "string" && u.trim());
    const imagem_url = imagens[0] || null;
    const imagens_extras = imagens.slice(1);

    const cores = (edit.cores_texto || "")
      .split(",")
      .map((c: string) => c.trim())
      .filter(Boolean);
    const payload: any = { ...edit, imagem_url, imagens_extras, cores, slug: edit.slug || slugify(edit.nome), preco: Number(edit.preco), lucro: Number(edit.lucro || 0), peso_g: Number(edit.peso_g), estoque: Number(edit.estoque) };
    delete payload.categorias;
    delete payload.produto_categorias;
    delete payload.imagens;
    delete payload.imagem_link;
    delete payload.cores_texto;
    delete payload.categoria_ids;
    delete payload.categoria_id;

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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Field label="Preço (R$)"><Input type="number" step="0.01" value={edit.preco} onChange={(e) => setEdit({ ...edit, preco: e.target.value })} /></Field>
                <Field label="Lucro (R$) — interno">
                  <Input type="number" step="0.01" value={edit.lucro ?? 0} onChange={(e) => setEdit({ ...edit, lucro: e.target.value })} />
                </Field>
                <Field label="Peso (g)"><Input type="number" value={edit.peso_g} onChange={(e) => setEdit({ ...edit, peso_g: e.target.value })} /></Field>
                <Field label="Estoque"><Input type="number" value={edit.estoque} onChange={(e) => setEdit({ ...edit, estoque: e.target.value })} /></Field>
              </div>
              <p className="text-xs text-muted-foreground -mt-2">O lucro é apenas para controle interno e não aparece para os clientes.</p>
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
              <Field label="Imagens do produto (galeria)">
                <div className="space-y-3 border rounded-xl p-3 bg-muted/30">
                  <div className="flex gap-2 items-center flex-wrap">
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4" id="img-up" multiple className="hidden" onChange={(e) => e.target.files && e.target.files.length > 0 && uploadImg(e.target.files)} />
                    <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById("img-up")?.click()}>
                      <Plus className="h-3 w-3 mr-1" /> Adicionar imagens
                    </Button>
                    <span className="text-xs text-muted-foreground">JPG, PNG ou WEBP: até 5MB · GIF: até 10MB · MP4 vira GIF automaticamente (máx. 6s) · vários arquivos</span>
                  </div>

                  {(edit.imagens || []).length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {(edit.imagens as string[]).map((url, idx) => (
                        <div key={`${url}-${idx}`} className={`relative group rounded-lg overflow-hidden border-2 ${idx === 0 ? "border-primary" : "border-border"}`}>
                          <img src={url} alt={`Imagem ${idx + 1}`} loading="lazy" className="w-full aspect-square object-cover" />
                          {idx === 0 && (
                            <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] font-bold uppercase rounded-full px-2 py-0.5 flex items-center gap-1">
                              <Star className="h-2.5 w-2.5 fill-current" /> Capa
                            </div>
                          )}
                          <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                            <div className="flex gap-1">
                              <button type="button" onClick={() => moverImagem(idx, -1)} disabled={idx === 0} className="bg-background text-foreground rounded p-1 disabled:opacity-30" aria-label="Mover para trás">
                                <ChevronUp className="h-3 w-3 -rotate-90" />
                              </button>
                              <button type="button" onClick={() => moverImagem(idx, 1)} disabled={idx === (edit.imagens || []).length - 1} className="bg-background text-foreground rounded p-1 disabled:opacity-30" aria-label="Mover para frente">
                                <ChevronDown className="h-3 w-3 -rotate-90" />
                              </button>
                            </div>
                            {idx !== 0 && (
                              <button type="button" onClick={() => definirCapa(idx)} className="bg-primary text-primary-foreground rounded px-2 py-0.5 text-[10px] font-bold uppercase flex items-center gap-1">
                                <Star className="h-2.5 w-2.5" /> Capa
                              </button>
                            )}
                            <button type="button" onClick={() => removerImagem(idx)} className="bg-destructive text-destructive-foreground rounded px-2 py-0.5 text-[10px] font-bold uppercase flex items-center gap-1">
                              <X className="h-2.5 w-2.5" /> Remover
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground italic py-4 text-center">Nenhuma imagem adicionada. A primeira será usada como capa.</div>
                  )}

                  <div className="border-t pt-3 space-y-2">
                    <span className="text-xs font-bold uppercase">Adicionar via URL externa</span>
                    <div className="flex gap-2">
                      <Input value={edit.imagem_link || ""} onChange={(e) => setEdit({ ...edit, imagem_link: e.target.value })} placeholder="https://exemplo.com/imagem.jpg" />
                      <Button type="button" variant="outline" size="sm" onClick={adicionarLink}>Adicionar</Button>
                    </div>
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
