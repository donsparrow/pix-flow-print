import { Layout } from "@/components/Layout";
import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useConfig } from "@/hooks/useConfig";
import { brl, statusLabels, statusColors, STATUS_ORDER } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, MessageCircle, CheckCircle2, Upload, PartyPopper, ArrowLeft } from "lucide-react";

export default function PedidoDetalhe() {
  const { codigo } = useParams();
  const loc = useLocation();
  const acabouDeCriar = (loc.state as any)?.acabou_de_criar;
  const { config } = useConfig();

  const [pedido, setPedido] = useState<any>(null);
  const [itens, setItens] = useState<any[]>([]);
  const [comprovante, setComprovante] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  const carregar = async () => {
    if (!codigo) return;
    const { data: p } = await supabase.from("pedidos").select("*").eq("codigo", codigo).maybeSingle();
    setPedido(p);
    if (p) {
      const { data: i } = await supabase.from("itens_pedido").select("*").eq("pedido_id", p.id);
      setItens(i || []);
      const { data: c } = await supabase.from("comprovantes").select("*").eq("pedido_id", p.id).order("created_at", { ascending: false }).maybeSingle();
      setComprovante(c);
    }
  };

  useEffect(() => { carregar(); }, [codigo]);

  if (!pedido) return <Layout><div className="container py-20 text-center">Carregando pedido...</div></Layout>;

  const pixKey = config.pix_chave || "";
  const wpp = (config.whatsapp_numero || "").replace(/\D/g, "");
  const statusIdx = STATUS_ORDER.indexOf(pedido.status as any);

  const copy = (txt: string, label = "Copiado!") => {
    navigator.clipboard.writeText(txt);
    toast.success(label);
  };

  const mensagemWpp = encodeURIComponent(
    `Olá! Acabei de fazer um pedido na JRTL 3D.\n\n` +
    `*Código:* ${pedido.codigo}\n` +
    `*Cliente:* ${pedido.cliente_nome}\n` +
    `*Total:* ${brl(Number(pedido.valor_total))}\n\n` +
    `*Itens:*\n${itens.map((i) => `• ${i.quantidade}× ${i.produto_nome}`).join("\n")}\n\n` +
    `Aguardo confirmação 😊`
  );

  const mensagemJaPaguei = encodeURIComponent(
    `Olá! Já efetuei o pagamento do pedido *${pedido.codigo}* 💸\n\n` +
    `*Cliente:* ${pedido.cliente_nome}\n` +
    `*Valor:* ${brl(Number(pedido.valor_total))}\n\n` +
    `Vou enviar o comprovante em seguida. Obrigado!`
  );

  const uploadComprovante = async (file: File) => {
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${pedido.id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("comprovantes").upload(path, file);
    if (upErr) { toast.error("Erro no upload"); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("comprovantes").getPublicUrl(path);
    const { error } = await supabase.from("comprovantes").insert({ pedido_id: pedido.id, arquivo_url: publicUrl });
    setUploading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Comprovante enviado! Vamos analisar em breve.");
    carregar();
  };

  return (
    <Layout>
      <div className="container py-10 max-w-4xl">
        <Link to="/pedido" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4">
          <ArrowLeft className="h-4 w-4" /> Consultar outro pedido
        </Link>

        {acabouDeCriar && (
          <div className="bg-success/10 border-2 border-success/30 rounded-2xl p-6 mb-6 flex items-center gap-4 animate-scale-in">
            <PartyPopper className="h-10 w-10 text-success flex-shrink-0" />
            <div>
              <div className="font-display font-bold text-xl text-success">Pedido criado com sucesso!</div>
              <div className="text-sm text-muted-foreground">Anote o código abaixo para acompanhar seu pedido.</div>
            </div>
          </div>
        )}

        <div className="bg-gradient-brand rounded-3xl p-8 text-center text-white shadow-lg mb-6">
          <div className="text-sm font-bold opacity-80 uppercase tracking-wider">Código do pedido</div>
          <div className="font-display font-bold text-4xl md:text-5xl mt-1 tracking-wider">{pedido.codigo}</div>
          <Button size="sm" variant="secondary" className="mt-4 rounded-full" onClick={() => copy(pedido.codigo, "Código copiado")}>
            <Copy className="h-3 w-3 mr-1" /> Copiar código
          </Button>
        </div>

        {/* Timeline */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-xl">Status</h3>
            <Badge className={statusColors[pedido.status]}>{statusLabels[pedido.status]}</Badge>
          </div>
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {STATUS_ORDER.map((s, i) => {
              const ativo = i <= statusIdx;
              return (
                <div key={s} className="flex items-center gap-1 flex-shrink-0">
                  <div className={`flex flex-col items-center gap-1 ${ativo ? "" : "opacity-40"}`}>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${ativo ? "bg-gradient-brand text-white" : "bg-muted"}`}>
                      {i <= statusIdx ? <CheckCircle2 className="h-5 w-5" /> : i + 1}
                    </div>
                    <div className="text-[10px] font-bold text-center max-w-[80px] leading-tight">{statusLabels[s]}</div>
                  </div>
                  {i < STATUS_ORDER.length - 1 && (
                    <div className={`h-0.5 w-6 ${i < statusIdx ? "bg-primary" : "bg-muted"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* PIX */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-xl flex items-center gap-2">
              💸 Pagamento via PIX
            </h3>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground font-bold uppercase">Chave PIX</Label>
              <div className="flex gap-2">
                <Input value={pixKey} readOnly className="font-mono" />
                <Button size="icon" variant="outline" onClick={() => copy(pixKey, "Chave PIX copiada")}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                Recebedor: <strong>{config.pix_nome}</strong> {config.pix_banco && <>· {config.pix_banco}</>}
              </div>
            </div>
            <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 text-sm">
              <strong>Como pagar:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1 text-xs">
                <li>Abra o app do seu banco e escolha PIX</li>
                <li>Cole a chave acima</li>
                <li>Pague o valor de <strong>{brl(Number(pedido.valor_total))}</strong></li>
                <li>Envie o comprovante abaixo ou pelo WhatsApp</li>
              </ol>
            </div>
            <div className="flex flex-col gap-2">
              <Button asChild className="w-full bg-success hover:bg-success/90 text-success-foreground font-bold rounded-full">
                <a href={`https://wa.me/${wpp}?text=${mensagemJaPaguei}`} target="_blank" rel="noreferrer">
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Já paguei
                </a>
              </Button>
              <Button asChild variant="outline" className="w-full font-bold rounded-full">
                <a href={`https://wa.me/${wpp}?text=${mensagemWpp}`} target="_blank" rel="noreferrer">
                  <MessageCircle className="h-4 w-4 mr-2" /> Enviar pedido no WhatsApp
                </a>
              </Button>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  className="hidden"
                  onChange={(e) => e.target.files && uploadComprovante(e.target.files[0])}
                />
                <Button asChild variant="outline" className="w-full font-bold rounded-full" disabled={uploading}>
                  <span><Upload className="h-4 w-4 mr-2" />{uploading ? "Enviando..." : comprovante ? "Reenviar comprovante" : "Enviar comprovante"}</span>
                </Button>
              </label>
              {comprovante && (
                <div className="text-xs text-success font-bold text-center">✓ Comprovante recebido</div>
              )}
            </div>
          </div>

          {/* Resumo */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-xl">Resumo</h3>
            <div className="space-y-2">
              {itens.map((i) => (
                <div key={i.id} className="flex gap-3 text-sm">
                  {i.produto_imagem && <img src={i.produto_imagem} alt="" className="w-12 h-12 rounded-lg object-cover" />}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold line-clamp-1">{i.produto_nome}</div>
                    <div className="text-xs text-muted-foreground">{i.quantidade} × {brl(Number(i.preco_unitario))}</div>
                  </div>
                  <div className="font-bold">{brl(Number(i.subtotal))}</div>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{brl(Number(pedido.valor_produtos))}</span></div>
              <div className="flex justify-between"><span>Frete</span><span>{brl(Number(pedido.valor_frete))}</span></div>
              <div className="flex justify-between font-display font-bold text-xl pt-2 border-t">
                <span>Total</span><span className="text-primary">{brl(Number(pedido.valor_total))}</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground border-t pt-3">
              <div><strong>Cliente:</strong> {pedido.cliente_nome}</div>
              <div><strong>Tel:</strong> {pedido.cliente_telefone}</div>
              {pedido.cliente_endereco && (
                <div><strong>Endereço:</strong> {pedido.cliente_endereco}, {pedido.cliente_numero} — {pedido.cliente_bairro}, {pedido.cliente_cidade}/{pedido.cliente_estado}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
