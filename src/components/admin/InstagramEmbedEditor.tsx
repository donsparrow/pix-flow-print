import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Instagram, Save, ExternalLink, Info } from "lucide-react";

const KEYS = ["instagram_handle", "instagram_subtitulo", "instagram_embed_code"] as const;

export function InstagramEmbedEditor() {
  const [handle, setHandle] = useState("");
  const [subtitulo, setSubtitulo] = useState("");
  const [embed, setEmbed] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("configuracoes")
      .select("chave, valor")
      .in("chave", KEYS as unknown as string[])
      .then(({ data }) => {
        const map = Object.fromEntries((data || []).map((d) => [d.chave, d.valor || ""]));
        setHandle(map.instagram_handle || "");
        setSubtitulo(map.instagram_subtitulo || "");
        setEmbed(map.instagram_embed_code || "");
      });
  }, []);

  const salvar = async () => {
    setSaving(true);
    const updates = [
      { chave: "instagram_handle", valor: handle.replace(/^@/, "") },
      { chave: "instagram_subtitulo", valor: subtitulo },
      { chave: "instagram_embed_code", valor: embed },
    ];
    for (const u of updates) {
      const { error } = await supabase.from("configuracoes").update({ valor: u.valor }).eq("chave", u.chave);
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
    }
    toast.success("Configurações do Instagram salvas");
    setSaving(false);
  };

  return (
    <div className="bg-card border rounded-2xl p-5 space-y-5">
      <div className="flex items-center gap-2">
        <Instagram className="h-5 w-5 text-secondary" />
        <h2 className="font-bold text-lg">Seção Instagram (Automática)</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase">Usuário do Instagram (@)</Label>
          <Input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="jrtl.studio" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase">Subtítulo</Label>
          <Input value={subtitulo} onChange={(e) => setSubtitulo(e.target.value)} placeholder="Acompanhe nossas novidades..." />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-bold uppercase">Código de incorporação do widget</Label>
        <Textarea
          value={embed}
          onChange={(e) => setEmbed(e.target.value)}
          placeholder='Cole aqui o código (HTML/<script>) gerado pelo widget...'
          className="font-mono text-xs min-h-[180px]"
        />
        <div className="rounded-lg bg-muted/50 border p-3 text-xs space-y-2">
          <div className="flex gap-1.5 items-start">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-secondary" />
            <div>
              <p className="font-bold mb-1">Como obter o código:</p>
              <p className="text-muted-foreground">
                Crie um widget gratuito em um destes serviços, conecte seu Instagram e cole o código abaixo. O feed será atualizado automaticamente.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pl-5">
            <a href="https://embedsocial.com/products/instagram-feed/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-secondary hover:underline font-semibold">
              EmbedSocial <ExternalLink className="h-3 w-3" />
            </a>
            <a href="https://elfsight.com/instagram-feed-instashow/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-secondary hover:underline font-semibold">
              Elfsight <ExternalLink className="h-3 w-3" />
            </a>
            <a href="https://snapwidget.com/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-secondary hover:underline font-semibold">
              SnapWidget <ExternalLink className="h-3 w-3" />
            </a>
            <a href="https://behold.so/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-secondary hover:underline font-semibold">
              Behold <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      <Button onClick={salvar} disabled={saving} className="w-full md:w-auto">
        <Save className="h-4 w-4 mr-1.5" /> {saving ? "Salvando..." : "Salvar"}
      </Button>
    </div>
  );
}
