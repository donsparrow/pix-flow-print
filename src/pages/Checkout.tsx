import { Layout } from "@/components/Layout";
import { useCart } from "@/hooks/useCart";
import { useConfig } from "@/hooks/useConfig";
import { useState } from "react";
import { brl, formatCEP, formatPhone, onlyDigits } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { Truck, ShoppingBag, ArrowLeft } from "lucide-react";

const schema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome").max(100),
  telefone: z.string().trim().min(10, "Telefone inválido").max(20),
  email: z.string().trim().email("Email inválido").max(255).or(z.literal("")),
  cep: z.string().trim(),
  endereco: z.string().trim().max(200),
  numero: z.string().trim().max(10),
  complemento: z.string().trim().max(100),
  bairro: z.string().trim().max(100),
  cidade: z.string().trim().max(100),
  estado: z.string().trim().max(2),
  observacoes: z.string().trim().max(500),
});

export default function Checkout() {
  const { items, total, clear } = useCart();
  const { config } = useConfig();
  const nav = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [metodo, setMetodo] = useState<"grande_vitoria" | "demais_regioes" | "retirada">("grande_vitoria");

  const [form, setForm] = useState({
    nome: "", telefone: "", email: "",
    cep: "", endereco: "", numero: "", complemento: "",
    bairro: "", cidade: "", estado: "", observacoes: "",
  });

  const freteGV = parseFloat(config.frete_grande_vitoria || "0");
  const freteDR = parseFloat(config.frete_demais_regioes || "0");
  const valorFrete = metodo === "grande_vitoria" ? freteGV : metodo === "demais_regioes" ? freteDR : 0;
  const totalGeral = total + valorFrete;

  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (items.length === 0) {
      toast.error("Carrinho vazio");
      return;
    }
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (metodo !== "retirada" && !form.endereco) {
      toast.error("Informe o endereço para entrega");
      return;
    }

    setSubmitting(true);
    const faltaCor = items.find((i) => i.cores_disponiveis && i.cores_disponiveis.length > 0 && !i.cor_selecionada);
    if (faltaCor) {
      toast.error(`Selecione a cor para ${faltaCor.nome}`);
      return;
    }
    const { data, error } = await supabase.rpc("criar_pedido", {
      _cliente: form,
      _itens: items.map((i) => ({ produto_id: i.produto_id, quantidade: i.quantidade, cor_selecionada: i.cor_selecionada || null })) as any,
      _metodo_frete: metodo,
      _valor_frete: valorFrete,
      _observacoes: form.observacoes || null,
    });
    setSubmitting(false);

    if (error || !data || (Array.isArray(data) && data.length === 0)) {
      toast.error(error?.message || "Erro ao criar pedido");
      return;
    }
    const result = Array.isArray(data) ? data[0] : data;
    clear();
    nav(`/pedido/${result.codigo}`, { state: { acabou_de_criar: true } });
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container py-20 text-center space-y-4">
          <ShoppingBag className="h-20 w-20 mx-auto text-muted-foreground/40" />
          <h1 className="font-display text-3xl font-bold">Seu carrinho está vazio</h1>
          <Button asChild className="rounded-full">
            <Link to="/produtos">Ver produtos</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-10 max-w-5xl">
        <Link to="/produtos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4">
          <ArrowLeft className="h-4 w-4" /> Continuar comprando
        </Link>
        <h1 className="font-display text-4xl font-bold mb-8">Finalizar pedido</h1>

        <div className="grid lg:grid-cols-[1fr_400px] gap-8">
          <div className="space-y-8">
            <Section title="Seus dados">
              <Field label="Nome completo *">
                <Input value={form.nome} onChange={(e) => update("nome", e.target.value)} maxLength={100} />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="WhatsApp *">
                  <Input value={form.telefone} onChange={(e) => update("telefone", formatPhone(e.target.value))} placeholder="(27) 99999-9999" />
                </Field>
                <Field label="Email (opcional)">
                  <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} maxLength={255} />
                </Field>
              </div>
            </Section>

            <Section title="Entrega">
              <RadioGroup value={metodo} onValueChange={(v: any) => setMetodo(v)} className="space-y-2">
                <ShipOption value="grande_vitoria" current={metodo} title="Entrega Grande Vitória" desc={`${config.frete_grande_vitoria_prazo || "2"} dias úteis`} price={freteGV} />
                <ShipOption value="demais_regioes" current={metodo} title="Demais regiões (Correios)" desc={`${config.frete_demais_regioes_prazo || "7"} dias úteis`} price={freteDR} />
                <ShipOption value="retirada" current={metodo} title="Retirar pessoalmente" desc="Combinar local pelo WhatsApp" price={0} />
              </RadioGroup>

              {metodo !== "retirada" && (
                <div className="space-y-4 pt-2">
                  <div className="grid sm:grid-cols-[200px_1fr] gap-4">
                    <Field label="CEP">
                      <Input value={form.cep} onChange={(e) => update("cep", formatCEP(e.target.value))} placeholder="00000-000" />
                    </Field>
                    <Field label="Endereço">
                      <Input value={form.endereco} onChange={(e) => update("endereco", e.target.value)} maxLength={200} />
                    </Field>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <Field label="Número">
                      <Input value={form.numero} onChange={(e) => update("numero", e.target.value)} maxLength={10} />
                    </Field>
                    <Field label="Complemento">
                      <Input value={form.complemento} onChange={(e) => update("complemento", e.target.value)} maxLength={100} />
                    </Field>
                    <Field label="Bairro">
                      <Input value={form.bairro} onChange={(e) => update("bairro", e.target.value)} maxLength={100} />
                    </Field>
                  </div>
                  <div className="grid sm:grid-cols-[1fr_120px] gap-4">
                    <Field label="Cidade">
                      <Input value={form.cidade} onChange={(e) => update("cidade", e.target.value)} maxLength={100} />
                    </Field>
                    <Field label="UF">
                      <Input value={form.estado} onChange={(e) => update("estado", e.target.value.toUpperCase())} maxLength={2} />
                    </Field>
                  </div>
                </div>
              )}
            </Section>

            <Section title="Observações (opcional)">
              <Textarea value={form.observacoes} onChange={(e) => update("observacoes", e.target.value)} placeholder="Cor preferida, personalização, etc." maxLength={500} />
            </Section>
          </div>

          <aside className="lg:sticky lg:top-24 h-fit">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-display font-bold text-xl">Resumo</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {items.map((i) => (
                  <div key={`${i.produto_id}-${i.cor_selecionada || ""}`} className="flex gap-3 text-sm">
                    {i.imagem_url && <img src={i.imagem_url} alt={i.nome} className="w-12 h-12 rounded-lg object-cover" />}
                    <div className="flex-1 min-w-0">
                      <div className="line-clamp-1 font-semibold">{i.nome}</div>
                      {i.cor_selecionada && <div className="text-xs text-muted-foreground">Cor: <span className="font-semibold text-foreground">{i.cor_selecionada}</span></div>}
                      <div className="text-muted-foreground text-xs">{i.quantidade} × {brl(i.preco)}</div>
                    </div>
                    <div className="font-bold">{brl(i.preco * i.quantidade)}</div>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3 space-y-2 text-sm">
                <Row label="Subtotal" value={brl(total)} />
                <Row label="Frete" value={brl(valorFrete)} />
                <div className="flex justify-between font-display font-bold text-xl pt-2 border-t">
                  <span>Total</span>
                  <span className="text-primary">{brl(totalGeral)}</span>
                </div>
              </div>
              <Button size="lg" onClick={submit} disabled={submitting} className="w-full bg-gradient-warm text-white font-bold rounded-full shadow-pop hover:translate-y-0.5 hover:shadow-md transition-all h-14">
                {submitting ? "Criando pedido..." : "Gerar pedido e PIX"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">Pagamento via PIX. Sem login necessário.</p>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}

function Section({ title, children }: any) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
      <h3 className="font-display font-bold text-xl">{title}</h3>
      {children}
    </div>
  );
}
function Field({ label, children }: any) {
  return <div className="space-y-1.5"><Label className="text-sm font-bold">{label}</Label>{children}</div>;
}
function Row({ label, value }: any) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span className="font-semibold">{value}</span></div>;
}
function ShipOption({ value, current, title, desc, price }: any) {
  const sel = value === current;
  return (
    <Label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${sel ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
      <RadioGroupItem value={value} />
      <Truck className={`h-5 w-5 ${sel ? "text-primary" : "text-muted-foreground"}`} />
      <div className="flex-1">
        <div className="font-bold text-sm">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <div className="font-display font-bold text-primary">{price === 0 ? "Grátis" : brl(price)}</div>
    </Label>
  );
}
