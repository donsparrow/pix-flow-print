import { Instagram, Heart, MessageCircle } from "lucide-react";
import { useConfig } from "@/hooks/useConfig";

const placeholder = [
  "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=600&q=80",
  "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600&q=80",
  "https://images.unsplash.com/photo-1608889335941-32ac5f2041b9?w=600&q=80",
  "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=600&q=80",
  "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&q=80",
  "https://images.unsplash.com/photo-1614682835402-9ade4cba6c33?w=600&q=80",
];

export function InstagramFeed() {
  const { config } = useConfig();
  const handle = config.instagram_handle || "jrtl3d";

  return (
    <section className="container py-20">
      <div className="text-center mb-10">
        <div className="text-sm font-bold text-accent uppercase tracking-wider mb-2">Vitrine social</div>
        <h2 className="font-display text-4xl md:text-5xl font-bold mb-2">
          Siga no <span className="text-gradient-brand">Instagram</span>
        </h2>
        <a
          href={`https://instagram.com/${handle}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 mt-2 text-secondary font-bold hover:underline"
        >
          <Instagram className="h-5 w-5" />
          @{handle}
        </a>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
        {placeholder.map((src, i) => (
          <a
            key={i}
            href={`https://instagram.com/${handle}`}
            target="_blank"
            rel="noreferrer"
            className="group relative aspect-square overflow-hidden rounded-xl bg-muted"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <img
              src={src}
              alt="Instagram post"
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
              <div className="flex gap-3 text-background text-sm font-bold">
                <span className="flex items-center gap-1"><Heart className="h-4 w-4 fill-current" /> 142</span>
                <span className="flex items-center gap-1"><MessageCircle className="h-4 w-4" /> 12</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
