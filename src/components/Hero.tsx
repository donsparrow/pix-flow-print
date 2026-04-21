import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, Play } from "lucide-react";
import { useConfig } from "@/hooks/useConfig";
import logo from "@/assets/logo-jrtl.png";

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}
function getVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}

export function Hero() {
  const { config } = useConfig();
  const uploadUrl = config.hero_video_upload?.trim();
  const externalUrl = config.hero_video_url?.trim();
  const videoSrc = uploadUrl || externalUrl || "";
  const ytId = !uploadUrl && externalUrl ? getYouTubeId(externalUrl) : null;
  const vimeoId = !uploadUrl && externalUrl ? getVimeoId(externalUrl) : null;

  return (
    <section className="relative overflow-hidden bg-gradient-hero">
      {/* Background flutuante */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-secondary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-40 right-1/3 w-64 h-64 bg-primary/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <div className="container relative grid md:grid-cols-2 gap-10 items-center py-16 md:py-24">
        <div className="space-y-6 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border shadow-sm">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-sm font-bold">Impressão 3D feita com carinho</span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-bold leading-[1.05]">
            Suas ideias{" "}
            <span className="text-gradient-brand">impressas</span> em 3D.
          </h1>

          <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
            Decoração, action figures, utilidades e personalizados.
            Capricho artesanal com a tecnologia que você ama. <strong className="text-foreground">Sem login, pedido em minutos.</strong>
          </p>

          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-gradient-warm text-white font-bold rounded-full shadow-pop hover:translate-y-0.5 hover:shadow-md transition-all h-14 px-8 text-base">
              <Link to="/produtos">
                Explorar produtos
                <ArrowRight className="ml-1 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full h-14 px-8 text-base font-bold border-2 hover:bg-secondary hover:text-secondary-foreground hover:border-secondary">
              <Link to="/pedido">Acompanhar pedido</Link>
            </Button>
          </div>

          <div className="flex gap-8 pt-4">
            <Stat n="500+" label="Peças impressas" />
            <Stat n="100%" label="Feito à mão" />
            <Stat n="48h" label="Pronto pra retirar" />
          </div>
        </div>

        <div className="relative animate-scale-in">
          <div className="relative aspect-[4/5] md:aspect-square rounded-3xl overflow-hidden shadow-lg bg-card border-4 border-card">
            {videoSrc ? (
              ytId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&modestbranding=1&playsinline=1&rel=0`}
                  className="w-full h-full" allow="autoplay; encrypted-media" title="Vídeo"
                  loading="lazy"
                />
              ) : vimeoId ? (
                <iframe
                  src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&loop=1&muted=1&background=1`}
                  className="w-full h-full" allow="autoplay" title="Vídeo"
                  loading="lazy"
                />
              ) : (
                <video
                  src={videoSrc}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-cover"
                />
              )
            ) : (
              <div className="w-full h-full bg-gradient-cool flex flex-col items-center justify-center gap-6 p-8">
                <img src={logo} alt="JRTL STUDIO" className="w-2/3 max-w-xs animate-float drop-shadow-2xl" />
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/90 backdrop-blur text-sm font-bold">
                  <Play className="h-4 w-4 fill-primary text-primary" />
                  Configure seu vídeo no admin
                </div>
              </div>
            )}
          </div>
          {/* Floating badges */}
          <div className="hidden md:flex absolute -bottom-4 -left-4 bg-card rounded-2xl shadow-lg px-5 py-3 items-center gap-3 border border-border animate-float" style={{ animationDelay: "0.5s" }}>
            <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center text-2xl">✓</div>
            <div>
              <div className="font-bold text-sm">PIX rápido</div>
              <div className="text-xs text-muted-foreground">Pedido em 2 min</div>
            </div>
          </div>
          <div className="hidden md:flex absolute -top-4 -right-4 bg-card rounded-2xl shadow-lg px-5 py-3 items-center gap-3 border border-border animate-float" style={{ animationDelay: "1.2s" }}>
            <div className="text-2xl">⭐</div>
            <div>
              <div className="font-bold text-sm">5.0 estrelas</div>
              <div className="text-xs text-muted-foreground">+200 avaliações</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div>
      <div className="font-display font-bold text-2xl text-gradient-brand">{n}</div>
      <div className="text-xs text-muted-foreground font-semibold">{label}</div>
    </div>
  );
}
