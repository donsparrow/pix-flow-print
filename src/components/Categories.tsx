import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

type Cat = { id: string; nome: string; slug: string; imagem_url: string | null; emoji: string | null };

const fallbackEmojis: Record<string, string> = {
  "action-figures": "🦸",
  "decoracao": "🌸",
  "utilidades": "🛠️",
  "personalizados": "✨",
  "geek-games": "🎮",
  "brinquedos": "🧸",
  "todos": "📦",
};

const colorClasses = [
  "from-primary to-primary-glow",
  "from-secondary to-accent",
  "from-accent to-warning",
  "from-success to-primary",
  "from-secondary to-primary",
];

export function Categories() {
  const [cats, setCats] = useState<Cat[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("categorias")
        .select("id, nome, slug, imagem_url, emoji")
        .eq("ativo", true)
        .neq("slug", "todos")
        .order("ordem");
      setCats((data as Cat[]) || []);
    })();
  }, []);

  return (
    <section className="container py-16">
      <div className="text-center mb-10">
        <div className="text-sm font-bold text-secondary uppercase tracking-wider mb-2">Navegue</div>
        <h2 className="font-display text-4xl md:text-5xl font-bold">
          Por <span className="text-gradient-brand">categoria</span>
        </h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cats.map((c, i) => (
          <Link
            key={c.id}
            to={`/produtos?categoria=${c.slug}`}
            className={`group relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br ${colorClasses[i % colorClasses.length]} p-6 flex flex-col justify-between hover:scale-105 transition-transform shadow-md hover:shadow-lg`}
          >
            {c.imagem_url ? (
              <img
                src={c.imagem_url}
                alt={c.nome}
                className="w-16 h-16 rounded-xl object-cover bg-white/20 backdrop-blur-sm shadow-md"
                loading="lazy"
              />
            ) : (
              <div className="text-5xl drop-shadow">{c.emoji || fallbackEmojis[c.slug] || "📦"}</div>
            )}
            <div>
              <div className="font-display text-xl font-bold text-white drop-shadow">{c.nome}</div>
              <div className="text-white/80 text-xs font-semibold mt-1">Ver produtos →</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
