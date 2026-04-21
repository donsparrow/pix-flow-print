import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Upload, Loader2, Instagram, GripVertical } from "lucide-react";

const MAX_POSTS = 9;
type Post = { imagem: string; link: string };

export function InstagramPostsEditor() {
  const [handle, setHandle] = useState("");
  const [subtitulo, setSubtitulo] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

  const carregar = async () => {
    const { data } = await supabase
      .from("configuracoes")
      .select("chave, valor")
      .in("chave", ["instagram_handle", "instagram_subtitulo", "instagram_posts"]);
    data?.forEach((c) => {
      if (c.chave === "instagram_handle") setHandle(c.valor || "");
      if (c.chave === "instagram_subtitulo") setSubtitulo(c.valor || "");
      if (c.chave === "instagram_posts") {
        try {
          const arr = c.valor ? JSON.parse(c.valor) : [];
          if (Array.isArray(arr)) setPosts(arr.map((p) => ({ imagem: p.imagem || "", link: p.link || "" })));
        } catch {}
      }
    });
  };
  useEffect(() => { carregar(); }, []);

  const salvar = async () => {
    setSaving(true);
    const limpos = posts.filter((p) => p.imagem.trim());
    const updates = await Promise.all([
      supabase.from("configuracoes").update({ valor: handle.replace(/^@/, "").trim() }).eq("chave", "instagram_handle"),
      supabase.from("configuracoes").update({ valor: subtitulo.trim() }).eq("chave", "instagram_subtitulo"),
      supabase.from("configuracoes").update({ valor: JSON.stringify(limpos) }).eq("chave", "instagram_posts"),
    ]);
    setSaving(false);
    const erro = updates.find((u) => u.error);
    if (erro?.error) return toast.error(erro.error.message);
    toast.success("Seção Instagram salva!");
  };

  const upload = async (idx: number, file: File) => {
    if (!file.type.startsWith("image/")) return toast.error("Envie uma imagem");
    if (file.size > 5 * 1024 * 1024) return toast.error("Máx 5MB");
    setUploadingIdx(idx);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `instagram/${Date.now()}-${idx}.${ext}`;
    const { error: upErr } = await supabase.storage.from("media").upload(path, file, { contentType: file.type });
    if (upErr) { setUploadingIdx(null); return toast.error(upErr.message); }
    const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(path);
    setPosts((prev) => prev.map((p, i) => i === idx ? { ...p, imagem: publicUrl } : p));
    setUploadingIdx(null);
    toast.success("Imagem enviada");
  };

  const addPost = () => {
    if (posts.length >= MAX_POSTS) return toast.error(`Máximo de ${MAX_POSTS} posts`);
    setPosts([...posts, { imagem: "", link: "" }]);
  };
  const removePost = (idx: number) => setPosts(posts.filter((_, i) => i !== idx));
  const updatePost = (idx: number, field: keyof Post, value: string) =>
    setPosts(posts.map((p, i) => i === idx ? { ...p, [field]: value } : p));

  return (
    <div className="bg-card border rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Instagram className="h-5 w-5 text-secondary" />
        <h2 className="font-display font-bold text-xl">Seção Instagram</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase">@ do Instagram</Label>
          <Input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="jrtl.studio" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase">Subtítulo</Label>
          <Input value={subtitulo} onChange={(e) => setSubtitulo(e.target.value)} maxLength={200} />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold uppercase">Posts do feed ({posts.length}/{MAX_POSTS})</Label>
          <Button size="sm" variant="outline" onClick={addPost} disabled={posts.length >= MAX_POSTS} className="rounded-full">
            <Plus className="h-3 w-3 mr-1" /> Adicionar
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Faça upload da imagem do post e cole o link da publicação no Instagram (https://instagram.com/p/...).
          Se vazio, mostra o feed de exemplo.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {posts.map((post, i) => (
            <div key={i} className="border rounded-xl p-3 space-y-2 bg-muted/30">
              <div className="aspect-square rounded-lg overflow-hidden bg-muted relative group">
                {post.imagem ? (
                  <img src={post.imagem} alt={`Post ${i + 1}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">Sem imagem</div>
                )}
                <button
                  onClick={() => fileRefs.current[i]?.click()}
                  disabled={uploadingIdx === i}
                  className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-background font-bold text-xs"
                >
                  {uploadingIdx === i ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Upload className="h-4 w-4 mr-1" /> {post.imagem ? "Trocar" : "Enviar"}</>}
                </button>
                <input
                  ref={(el) => (fileRefs.current[i] = el)}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && upload(i, e.target.files[0])}
                />
              </div>
              <Input
                value={post.link}
                onChange={(e) => updatePost(i, "link", e.target.value)}
                placeholder="https://instagram.com/p/..."
                className="text-xs h-8"
              />
              <Button size="sm" variant="ghost" onClick={() => removePost(i)} className="w-full text-destructive hover:text-destructive h-7 text-xs">
                <Trash2 className="h-3 w-3 mr-1" /> Remover
              </Button>
            </div>
          ))}
        </div>
      </div>

      <Button onClick={salvar} disabled={saving} className="w-full bg-gradient-brand text-white font-bold rounded-full">
        {saving ? "Salvando..." : "Salvar seção Instagram"}
      </Button>
    </div>
  );
}
