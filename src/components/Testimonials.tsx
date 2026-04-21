import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star, Quote } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

type Dep = { id: string; nome: string; texto: string; nota: number };

export function Testimonials() {
  const [dep, setDep] = useState<Dep[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("depoimentos")
        .select("id, nome, texto, nota")
        .eq("ativo", true)
        .order("ordem");
      setDep(data || []);
    })();
  }, []);

  if (dep.length === 0) return null;

  return (
    <section className="py-20 bg-gradient-to-b from-muted/30 to-background">
      <div className="container">
        <div className="text-center mb-12">
          <div className="text-sm font-bold text-success uppercase tracking-wider mb-2">Quem comprou</div>
          <h2 className="font-display text-4xl md:text-5xl font-bold">
            Quer mesmo <span className="text-gradient-brand">recomenda</span>
          </h2>
        </div>

        <Carousel
          opts={{ loop: true, align: "start" }}
          plugins={[Autoplay({ delay: 5000, stopOnInteraction: false })]}
          className="max-w-5xl mx-auto"
        >
          <CarouselContent>
            {dep.map((d) => (
              <CarouselItem key={d.id} className="md:basis-1/2 lg:basis-1/3">
                <div className="h-full bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                  <Quote className="h-8 w-8 text-secondary mb-3" />
                  <p className="text-sm leading-relaxed flex-1">"{d.texto}"</p>
                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                    <div className="font-display font-bold">{d.nome}</div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: d.nota }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                      ))}
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>
      </div>
    </section>
  );
}
