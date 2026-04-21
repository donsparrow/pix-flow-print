import { Instagram, Heart, ExternalLink, Sparkles } from "lucide-react";
import { useConfig } from "@/hooks/useConfig";
import { Button } from "@/components/ui/button";

const fallback = [
  "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=600&q=80",
  "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600&q=80",
  "https://images.unsplash.com/photo-1608889335941-32ac5f2041b9?w=600&q=80",
  "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=600&q=80",
  "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&q=80",
  "https://images.unsplash.com/photo-1614682835402-9ade4cba6c33?w=600&q=80",
];

type Post = { imagem: string; link?: string };

export function InstagramFeed() {
  const { config } = useConfig();
  const handle = (config.instagram_handle || "jrtl.studio").replace(/^@/, "");
  const subtitulo = config.instagram_subtitulo || "Acompanhe nossas criações, bastidores e novidades em primeira mão.";
  const profileUrl = `https://instagram.com/${handle}`;

  let posts: Post[] = [];
  try {
    const raw = config.instagram_posts ? JSON.parse(config.instagram_posts) : [];
    if (Array.isArray(raw)) posts = raw.filter((p) => p && p.imagem).slice(0, 9);
  } catch {}

  const items: Post[] = posts.length > 0
    ? posts
    : fallback.map((imagem) => ({ imagem, link: profileUrl }));

  return (
    <section className="container py-20">
      <div className="text-center mb-10 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/10 border border-secondary/30 mb-4">
          <Sparkles className="h-3.5 w-3.5 text-secondary" />
          <span className="text-xs font-bold text-secondary uppercase tracking-wider">Vitrine social</span>
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

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-10">
        {items.map((post, i) => {
          const href = post.link?.trim() || profileUrl;
          return (
            <a
              key={i}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="group relative aspect-square overflow-hidden rounded-2xl bg-muted shadow-sm hover:shadow-xl transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <img
                src={post.imagem}
                alt={`Post Instagram ${i + 1}`}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                <div className="flex items-center justify-between w-full text-background">
                  <span className="flex items-center gap-1.5 text-sm font-bold">
                    <Heart className="h-4 w-4 fill-current" /> Ver post
                  </span>
                  <ExternalLink className="h-4 w-4" />
                </div>
              </div>
              {/* Badge canto */}
              <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/90 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-y-1 group-hover:translate-y-0">
                <Instagram className="h-4 w-4 text-foreground" />
              </div>
            </a>
          );
        })}
      </div>

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
