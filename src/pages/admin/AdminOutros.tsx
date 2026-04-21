import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Check, X, Lock } from "lucide-react";
import { HeroVideoEditor } from "@/components/admin/HeroVideoEditor";
import { InstagramEmbedEditor } from "@/components/admin/InstagramEmbedEditor";

const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function AdminCategorias() {
  const [list, setList] = useState<any[]>([]);
  const [nome, setNome] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ nome: string; slug: string }>({ nome: "", slug: "" });

  const carregar = () => supabase.from("categorias").select("*").order("ordem").then(({ data }) => setList(data || []));
  useEffect(() => { carregar(); }, []);

  const [adicionando, setAdicionando] = useState(false);
  const add = async () => {
    const nomeLimpo = nome.trim();
    if (!nomeLimpo) return toast.error("Informe o nome da categoria");
    const slug = slugify(nomeLimpo);
    if (!slug) return toast.error("Nome inválido");
    if (list.some((c) => c.slug === slug || c.nome.toLowerCase() === nomeLimpo.toLowerCase())) {
      return toast.error("Já existe uma categoria com esse nome");
    }
    setAdicionando(true);
    const { error } = await supabase.from("categorias").insert({ nome: nomeLimpo, slug, ordem: list.length + 1 });
    setAdicionando(false);
    if (error) return toast.error(error.message);
    setNome("");
    toast.success("Categoria criada com sucesso");
    carregar();
  };

  const del = async (id: string, slug: string) => {
    if (slug === "todos") return toast.error('A categoria "Todos" não pode ser excluída');
    if (!confirm("Excluir esta categoria? Os produtos vinculados a ela serão movidos automaticamente para 'Todos' caso não tenham outra categoria.")) return;
    const { error } = await supabase.from("categorias").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Categoria excluída"); carregar();
  };

  const toggle = async (id: string, ativo: boolean) => {
    await supabase.from("categorias").update({ ativo }).eq("id", id);
    carregar();
  };

  const startEdit = (c: any) => { setEditId(c.id); setEditForm({ nome: c.nome, slug: c.slug }); };
  const cancelEdit = () => { setEditId(null); };
  const saveEdit = async (id: string, slugAtual: string) => {
    if (!editForm.nome || !editForm.slug) return toast.error("Nome e slug obrigatórios");
    if (slugAtual === "todos" && editForm.slug !== "todos") return toast.error('A categoria "Todos" não pode ter o slug alterado');
    const { error } = await supabase.from("categorias").update({ nome: editForm.nome, slug: slugify(editForm.slug) }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Categoria atualizada"); setEditId(null); carregar();
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-3xl font-bold">Categorias</h1>
        <p className="text-sm text-muted-foreground mt-1">A categoria <strong>Todos</strong> é padrão do sistema — todo produto pertence a ela automaticamente.</p>
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e) => { e.preventDefault(); add(); }}
      >
        <Input
          type="text"
          name="nome-categoria"
          autoComplete="off"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome da nova categoria"
          disabled={adicionando}
          className="flex-1"
        />
        <Button type="submit" disabled={adicionando}>
          <Plus className="h-4 w-4 mr-1" />{adicionando ? "Adicionando..." : "Adicionar"}
        </Button>
      </form>
      <div className="space-y-2">
        {list.map((c) => {
          const isTodos = c.slug === "todos";
          const isEditing = editId === c.id;
          return (
            <div key={c.id} className="flex items-center gap-3 p-3 bg-card border rounded-xl">
              {isEditing ? (
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <Input value={editForm.nome} onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })} placeholder="Nome" />
                  <Input value={editForm.slug} onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })} placeholder="Slug" disabled={isTodos} />
                </div>
              ) : (
                <div className="flex-1">
                  <div className="font-semibold flex items-center gap-2">
                    {c.nome}
                    {isTodos && <span className="text-[10px] uppercase font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full inline-flex items-center gap-1"><Lock className="h-3 w-3" />Padrão</span>}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">{c.slug}</div>
                </div>
              )}
              {isEditing ? (
                <>
                  <Button size="icon" variant="ghost" onClick={() => saveEdit(c.id, c.slug)} className="text-success"><Check className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={cancelEdit}><X className="h-4 w-4" /></Button>
                </>
              ) : (
                <>
                  <Switch checked={c.ativo} onCheckedChange={(v) => toggle(c.id, v)} />
                  <Button size="icon" variant="ghost" onClick={() => startEdit(c)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => del(c.id, c.slug)} disabled={isTodos} className="text-destructive disabled:text-muted-foreground"><Trash2 className="h-4 w-4" /></Button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AdminDepoimentos() {
  const [list, setList] = useState<any[]>([]);
  const [form, setForm] = useState({ nome: "", texto: "", nota: 5 });
  const carregar = () => supabase.from("depoimentos").select("*").order("ordem").then(({ data }) => setList(data || []));
  useEffect(() => { carregar(); }, []);

  const add = async () => {
    if (!form.nome || !form.texto) return toast.error("Preencha tudo");
    const { error } = await supabase.from("depoimentos").insert({ ...form, ordem: list.length + 1 });
    if (error) return toast.error(error.message);
    setForm({ nome: "", texto: "", nota: 5 }); carregar();
  };
  const del = async (id: string) => { if (!confirm("Excluir?")) return; await supabase.from("depoimentos").delete().eq("id", id); carregar(); };

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="font-display text-3xl font-bold">Depoimentos</h1>
      <div className="bg-card border rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-[1fr_100px] gap-3">
          <div><Label className="text-xs font-bold">Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
          <div><Label className="text-xs font-bold">Nota</Label><Input type="number" min={1} max={5} value={form.nota} onChange={(e) => setForm({ ...form, nota: Number(e.target.value) })} /></div>
        </div>
        <div><Label className="text-xs font-bold">Depoimento</Label><Textarea value={form.texto} onChange={(e) => setForm({ ...form, texto: e.target.value })} /></div>
        <Button onClick={add}><Plus className="h-4 w-4 mr-1" />Adicionar</Button>
      </div>
      <div className="space-y-2">
        {list.map((d) => (
          <div key={d.id} className="p-4 bg-card border rounded-xl flex justify-between items-start gap-3">
            <div><div className="font-bold">{d.nome} · {"⭐".repeat(d.nota)}</div><div className="text-sm text-muted-foreground">{d.texto}</div></div>
            <Button size="icon" variant="ghost" onClick={() => del(d.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminConfiguracoes() {
  const [list, setList] = useState<any[]>([]);
  useEffect(() => { supabase.from("configuracoes").select("*").order("chave").then(({ data }) => setList(data || [])); }, []);

  const salvar = async (chave: string, valor: string) => {
    const { error } = await supabase.from("configuracoes").update({ valor }).eq("chave", chave);
    if (error) return toast.error(error.message);
    toast.success("Salvo");
  };

  const HIDDEN = ["hero_video_url", "hero_video_upload", "instagram_handle", "instagram_subtitulo", "instagram_posts", "instagram_embed_code"];
  const visiveis = list.filter((c) => !HIDDEN.includes(c.chave));

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="font-display text-3xl font-bold">Configurações</h1>
      <p className="text-sm text-muted-foreground">Chave PIX, WhatsApp, fretes, vídeo da home, Instagram, etc.</p>

      <HeroVideoEditor />
      <InstagramEmbedEditor />

      <div className="space-y-3">
        {visiveis.map((c) => (
          <div key={c.chave} className="bg-card border rounded-xl p-4 space-y-2">
            <Label className="text-xs font-bold uppercase">{c.descricao || c.chave}</Label>
            <div className="flex gap-2">
              <Input defaultValue={c.valor || ""} onBlur={(e) => e.target.value !== c.valor && salvar(c.chave, e.target.value)} />
            </div>
            <div className="text-[10px] text-muted-foreground font-mono">{c.chave}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
