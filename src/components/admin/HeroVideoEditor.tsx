import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, Trash2, Link2, Video, Loader2 } from "lucide-react";

const MAX_MB = 50;

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}
function getVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}

export function HeroVideoEditor() {
  const [urlValue, setUrlValue] = useState("");
  const [uploadValue, setUploadValue] = useState("");
  const [savingUrl, setSavingUrl] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const carregar = async () => {
    const { data } = await supabase
      .from("configuracoes")
      .select("chave, valor")
      .in("chave", ["hero_video_url", "hero_video_upload"]);
    data?.forEach((c) => {
      if (c.chave === "hero_video_url") setUrlValue(c.valor || "");
      if (c.chave === "hero_video_upload") setUploadValue(c.valor || "");
    });
  };

  useEffect(() => { carregar(); }, []);

  const salvarUrl = async () => {
    setSavingUrl(true);
    const { error } = await supabase
      .from("configuracoes")
      .update({ valor: urlValue.trim() })
      .eq("chave", "hero_video_url");
    setSavingUrl(false);
    if (error) return toast.error(error.message);
    toast.success("URL do vídeo salva");
  };

  const upload = async (file: File) => {
    if (!file.type.startsWith("video/")) return toast.error("Envie um arquivo de vídeo (mp4)");
    if (file.size > MAX_MB * 1024 * 1024) return toast.error(`Vídeo muito grande (máx ${MAX_MB}MB)`);
    setUploading(true);
    const ext = file.name.split(".").pop() || "mp4";
    const path = `hero/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("media").upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) { setUploading(false); return toast.error(upErr.message); }
    const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(path);

    // remove o anterior se existir
    if (uploadValue) {
      try {
        const old = uploadValue.split("/media/")[1];
        if (old) await supabase.storage.from("media").remove([old]);
      } catch {}
    }

    const { error } = await supabase.from("configuracoes").update({ valor: publicUrl }).eq("chave", "hero_video_upload");
    setUploading(false);
    if (error) return toast.error(error.message);
    setUploadValue(publicUrl);
    toast.success("Vídeo enviado e ativado!");
  };

  const removerUpload = async () => {
    if (!uploadValue) return;
    if (!confirm("Remover o vídeo enviado? A URL externa (se houver) voltará a ser usada.")) return;
    setRemoving(true);
    try {
      const old = uploadValue.split("/media/")[1];
      if (old) await supabase.storage.from("media").remove([old]);
    } catch {}
    const { error } = await supabase.from("configuracoes").update({ valor: "" }).eq("chave", "hero_video_upload");
    setRemoving(false);
    if (error) return toast.error(error.message);
    setUploadValue("");
    toast.success("Vídeo removido");
  };

  const ytId = !uploadValue && urlValue ? getYouTubeId(urlValue) : null;
  const vimeoId = !uploadValue && urlValue ? getVimeoId(urlValue) : null;
  const ativo = uploadValue || urlValue;

  return (
    <div className="bg-card border rounded-2xl p-5 space-y-5">
      <div className="flex items-center gap-2">
        <Video className="h-5 w-5 text-primary" />
        <h2 className="font-display font-bold text-xl">Vídeo da Home</h2>
      </div>
      <p className="text-xs text-muted-foreground -mt-3">
        Aceita YouTube, Vimeo ou arquivo MP4. <strong>Vídeo enviado tem prioridade</strong> sobre a URL externa.
      </p>

      {/* Upload */}
      <div className="space-y-2 border rounded-xl p-4 bg-muted/30">
        <Label className="text-xs font-bold uppercase flex items-center gap-1">
          <Upload className="h-3 w-3" /> 1. Upload de vídeo (prioridade)
        </Label>
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />
          <Button onClick={() => inputRef.current?.click()} disabled={uploading} className="rounded-full">
            {uploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enviando...</> : <><Upload className="h-4 w-4 mr-2" />{uploadValue ? "Substituir vídeo" : "Enviar vídeo"}</>}
          </Button>
          {uploadValue && (
            <Button onClick={removerUpload} disabled={removing} variant="outline" className="rounded-full text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />Remover
            </Button>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">MP4/WebM até {MAX_MB}MB. Sem som, autoplay em loop.</p>
      </div>

      {/* URL externa */}
      <div className="space-y-2 border rounded-xl p-4">
        <Label className="text-xs font-bold uppercase flex items-center gap-1">
          <Link2 className="h-3 w-3" /> 2. URL externa (YouTube, Vimeo ou MP4)
        </Label>
        <div className="flex gap-2">
          <Input
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=... ou https://exemplo.com/video.mp4"
            disabled={!!uploadValue}
          />
          <Button onClick={salvarUrl} disabled={savingUrl || !!uploadValue} variant="outline">
            {savingUrl ? "..." : "Salvar"}
          </Button>
        </div>
        {uploadValue && (
          <p className="text-[11px] text-warning font-semibold">⚠ Há um vídeo enviado ativo. Remova-o para usar a URL.</p>
        )}
      </div>

      {/* Preview */}
      {ativo && (
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase">Preview (igual ao da home)</Label>
          <div className="aspect-square max-w-sm rounded-2xl overflow-hidden border-4 border-card shadow-lg bg-black">
            {uploadValue ? (
              <video src={uploadValue} autoPlay loop muted playsInline className="w-full h-full object-cover" />
            ) : ytId ? (
              <iframe
                src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&modestbranding=1&playsinline=1`}
                className="w-full h-full" allow="autoplay; encrypted-media" title="Preview" />
            ) : vimeoId ? (
              <iframe
                src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&loop=1&muted=1&background=1`}
                className="w-full h-full" allow="autoplay" title="Preview" />
            ) : (
              <video src={urlValue} autoPlay loop muted playsInline className="w-full h-full object-cover" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
