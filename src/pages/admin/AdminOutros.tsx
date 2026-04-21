import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { HeroVideoEditor } from "@/components/admin/HeroVideoEditor";

const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function AdminCategorias() {
  const [list, setList] = useState<any[]>([]);
  const [nome, setNome] = useState("");
  const carregar = () => supabase.from("categorias").select("*").order("ordem").then(({ data }) => setList(data || []));
  useEffect(() => { carregar(); }, []);

  const add = async () => {
    if (!nome) return;
    const { error } = await supabase.from("categorias").insert({ nome, slug: slugify(nome), ordem: list.length + 1 });
    if (error) return toast.error(error.message);
    setNome(""); carregar();
  };
  const del = async (id: string) => {
    if (!confirm("Excluir?")) return;
    await supabase.from("categorias").delete().eq("id", id);
    carregar();
  };
  const toggle = async (id: string, ativo: boolean) => {
    await supabase.from("categorias").update({ ativo }).eq("id", id);
    carregar();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-display text-3xl font-bold">Categorias</h1>
      <div className="flex gap-2">
        <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome da categoria" />
        <Button onClick={add}><Plus className="h-4 w-4" /></Button>
      </div>
      <div className="space-y-2">
        {list.map((c) => (
          <div key={c.id} className="flex items-center gap-3 p-3 bg-card border rounded-xl">
            <div className="flex-1 font-semibold">{c.nome}</div>
            <Switch checked={c.ativo} onCheckedChange={(v) => toggle(c.id, v)} />
            <Button size="icon" variant="ghost" onClick={() => del(c.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
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

  // Vídeo da home tem editor dedicado
  const HIDDEN = ["hero_video_url", "hero_video_upload"];
  const visiveis = list.filter((c) => !HIDDEN.includes(c.chave));

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="font-display text-3xl font-bold">Configurações</h1>
      <p className="text-sm text-muted-foreground">Chave PIX, WhatsApp, fretes, vídeo da home, Instagram, etc.</p>

      <HeroVideoEditor />

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
