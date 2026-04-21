import { useEffect, useRef, useState } from "react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import EmojiPicker, { EmojiStyle, Theme } from "emoji-picker-react";

function EmojiSelector({ value, onChange }: { value: string; onChange: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className="h-14 w-14 text-3xl p-0" aria-label="Escolher emoji">
            {value || "😀"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-auto border-0" align="start">
          <EmojiPicker
            onEmojiClick={(e) => { onChange(e.emoji); setOpen(false); }}
            emojiStyle={EmojiStyle.NATIVE}
            theme={Theme.AUTO}
            searchPlaceholder="Buscar emoji..."
            width={340}
            height={400}
            previewConfig={{ showPreview: false }}
            skinTonesDisabled
          />
        </PopoverContent>
      </Popover>
      {value && (
        <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => onChange("")}>
          Remover
        </Button>
      )}
    </div>
  );
}

const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

type CategoriaForm = { nome: string; slug: string; emoji: string; imagem_url: string };

function CategoriaImagemPreview({ imagem_url, emoji, nome }: { imagem_url?: string | null; emoji?: string | null; nome: string }) {
  if (imagem_url) {
    return <img src={imagem_url} alt={nome} className="w-12 h-12 rounded-lg object-cover bg-muted shrink-0" />;
  }
  return <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-2xl shrink-0">{emoji || "📦"}</div>;
}

function ImagemUploadCampo({
  value,
  onChange,
  disabled,
}: { value: string; onChange: (url: string) => void; disabled?: boolean }) {
  const [enviando, setEnviando] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
      return toast.error("Use JPG, PNG ou WEBP");
    }
    if (file.size > 5 * 1024 * 1024) return toast.error("Imagem muito grande (máx 5MB)");
    setEnviando(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("categorias").upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) {
      setEnviando(false);
      return toast.error(error.message);
    }
    const { data } = supabase.storage.from("categorias").getPublicUrl(path);
    onChange(data.publicUrl);
    setEnviando(false);
    toast.success("Imagem enviada");
  };

  return (
    <div className="flex items-center gap-3">
      {value ? (
        <img src={value} alt="" className="w-16 h-16 rounded-lg object-cover bg-muted border" />
      ) : (
        <div className="w-16 h-16 rounded-lg bg-muted border border-dashed flex items-center justify-center text-[10px] text-muted-foreground text-center px-1">Sem imagem</div>
      )}
      <div className="flex flex-col gap-1">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }}
          disabled={disabled || enviando}
        />
        <Button type="button" size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={disabled || enviando}>
          {enviando ? "Enviando..." : value ? "Trocar" : "Enviar imagem"}
        </Button>
        {value && (
          <Button type="button" size="sm" variant="ghost" className="text-destructive h-7" onClick={() => onChange("")} disabled={disabled || enviando}>
            Remover
          </Button>
        )}
      </div>
    </div>
  );
}

export function AdminCategorias() {
  const [list, setList] = useState<any[]>([]);
  const [nome, setNome] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CategoriaForm>({ nome: "", slug: "", emoji: "", imagem_url: "" });

  const carregar = () => supabase.from("categorias").select("*").order("ordem").then(({ data }) => setList(data || []));
  useEffect(() => { carregar(); }, []);

  const [adicionando, setAdicionando] = useState(false);
  const add = async () => {
    const raw = (nome || inputRef.current?.value || "").toString();
    const nomeLimpo = raw.trim();
    if (!nomeLimpo) {
      inputRef.current?.focus();
      return toast.error("Informe o nome da categoria");
    }
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
    if (inputRef.current) inputRef.current.value = "";
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

  const startEdit = (c: any) => {
    setEditId(c.id);
    setEditForm({ nome: c.nome, slug: c.slug, emoji: c.emoji || "", imagem_url: c.imagem_url || "" });
  };
  const cancelEdit = () => { setEditId(null); };
  const saveEdit = async (id: string, slugAtual: string) => {
    if (!editForm.nome || !editForm.slug) return toast.error("Nome e slug obrigatórios");
    if (slugAtual === "todos" && editForm.slug !== "todos") return toast.error('A categoria "Todos" não pode ter o slug alterado');
    const { error } = await supabase.from("categorias").update({
      nome: editForm.nome,
      slug: slugify(editForm.slug),
      emoji: editForm.emoji.trim() || null,
      imagem_url: editForm.imagem_url || null,
    }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Categoria atualizada"); setEditId(null); carregar();
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-3xl font-bold">Categorias</h1>
        <p className="text-sm text-muted-foreground mt-1">A categoria <strong>Todos</strong> é padrão do sistema — todo produto pertence a ela automaticamente.</p>
        <p className="text-xs text-muted-foreground mt-1">Personalize cada categoria com uma <strong>imagem</strong> (prioridade), <strong>URL</strong> ou <strong>emoji</strong>.</p>
      </div>
      <form
        className="flex gap-2 items-stretch relative z-10"
        onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); add(); }}
        autoComplete="off"
      >
        <input
          ref={inputRef}
          type="text"
          name="nome-categoria"
          autoComplete="off"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome da nova categoria"
          className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
            <div key={c.id} className="p-3 bg-card border rounded-xl">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs font-bold">Nome</Label>
                      <Input value={editForm.nome} onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })} placeholder="Nome" />
                    </div>
                    <div>
                      <Label className="text-xs font-bold">Slug</Label>
                      <Input value={editForm.slug} onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })} placeholder="Slug" disabled={isTodos} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-bold">Imagem (upload)</Label>
                    <div className="mt-1">
                      <ImagemUploadCampo value={editForm.imagem_url} onChange={(url) => setEditForm({ ...editForm, imagem_url: url })} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-bold">URL de imagem (alternativa)</Label>
                    <Input
                      value={editForm.imagem_url}
                      onChange={(e) => setEditForm({ ...editForm, imagem_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold">Emoji (fallback)</Label>
                    <div className="mt-1">
                      <EmojiSelector
                        value={editForm.emoji}
                        onChange={(emoji) => setEditForm({ ...editForm, emoji })}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">Usado quando não houver imagem.</p>
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <Button size="sm" variant="ghost" onClick={cancelEdit}><X className="h-4 w-4 mr-1" />Cancelar</Button>
                    <Button size="sm" onClick={() => saveEdit(c.id, c.slug)}><Check className="h-4 w-4 mr-1" />Salvar</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <CategoriaImagemPreview imagem_url={c.imagem_url} emoji={c.emoji} nome={c.nome} />
                  <div className="flex-1">
                    <div className="font-semibold flex items-center gap-2">
                      {c.nome}
                      {isTodos && <span className="text-[10px] uppercase font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full inline-flex items-center gap-1"><Lock className="h-3 w-3" />Padrão</span>}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">{c.slug}</div>
                  </div>
                  <Switch checked={c.ativo} onCheckedChange={(v) => toggle(c.id, v)} />
                  <Button size="icon" variant="ghost" onClick={() => startEdit(c)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => del(c.id, c.slug)} disabled={isTodos} className="text-destructive disabled:text-muted-foreground"><Trash2 className="h-4 w-4" /></Button>
                </div>
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
