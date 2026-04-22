import { useMemo } from "react";
import { Instagram, Sparkles } from "lucide-react";
import { useConfig } from "@/hooks/useConfig";
import { Button } from "@/components/ui/button";

/**
 * Renderiza o embed em um <iframe sandbox> isolado.
 * Mesmo que um admin (ou conta comprometida) salve HTML/JS malicioso,
 * o código roda em um documento de origem opaca, sem acesso à sessão,
 * cookies, localStorage ou DOM da loja.
 */
export function InstagramFeed() {
  const { config } = useConfig();
  const handle = (config.instagram_handle || "jrtl.studio").replace(/^@/, "");
  const subtitulo =
    config.instagram_subtitulo ||
    "Acompanhe nossas criações, bastidores e novidades em primeira mão.";
  const embed = (config.instagram_embed_code || "").trim();
  const profileUrl = `https://instagram.com/${handle}`;

  const srcDoc = useMemo(() => {
    if (!embed) return "";
    return `<!doctype html><html><head><meta charset="utf-8"/>
<base target="_blank">
<style>
  html,body{margin:0;padding:0;background:transparent;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;}
  body{overflow-x:hidden;}
</style>
</head><body>${embed}</body></html>`;
  }, [embed]);

  return (
    <section className="container py-20">
      <div className="text-center mb-10 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/10 border border-secondary/30 mb-4">
          <Sparkles className="h-3.5 w-3.5 text-secondary" />
          <span className="text-xs font-bold text-secondary uppercase tracking-wider">
            REDE SOCIAL
          </span>
        </div>
        <h2 className="font-display text-4xl md:text-5xl font-bold mb-3">
          Siga a gente no <span className="text-gradient-brand">Instagram</span>
        </h2>
        <p className="text-muted-foreground">{subtitulo}</p>
        <a
          href={profileUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 mt-3 text-secondary font-bold hover:underline text-sm"
        >
          <Instagram className="h-4 w-4" /> @{handle}
        </a>
      </div>

      {embed ? (
        <div className="instagram-embed-wrapper mb-10">
          <iframe
            title="Instagram feed"
            srcDoc={srcDoc}
            sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
            referrerPolicy="no-referrer"
            loading="lazy"
            className="w-full min-h-[600px] border-0 bg-transparent"
          />
        </div>
      ) : (
        <div className="mb-10 rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-muted/30 p-10 text-center text-muted-foreground">
          <Instagram className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">
            O feed automático ainda não foi configurado. Siga-nos diretamente no Instagram abaixo.
          </p>
        </div>
      )}

      <div className="text-center">
        <Button
          asChild
          size="lg"
          className="bg-gradient-warm text-white font-bold rounded-full shadow-pop hover:translate-y-0.5 hover:shadow-md transition-all h-14 px-8 text-base"
        >
          <a href={profileUrl} target="_blank" rel="noreferrer">
            <Instagram className="h-5 w-5 mr-1" /> Seguir no Instagram
          </a>
        </Button>
      </div>
    </section>
  );
}
