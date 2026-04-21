import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search } from "lucide-react";

export default function ConsultarPedido() {
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const buscar = async () => {
    const c = codigo.trim().toUpperCase();
    if (!c) return;
    setLoading(true);
    const { data } = await supabase.from("pedidos").select("codigo").eq("codigo", c).maybeSingle();
    setLoading(false);
    if (!data) { toast.error("Pedido não encontrado"); return; }
    nav(`/pedido/${c}`);
  };

  return (
    <Layout>
      <div className="container py-20 max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold mb-2">Meus pedidos</h1>
          <p className="text-muted-foreground">Digite o código do seu pedido para acompanhar.</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="space-y-2">
            <Label className="font-bold">Código do pedido</Label>
            <Input
              placeholder="PED-XXXXXX"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && buscar()}
              className="font-mono uppercase tracking-wider text-center text-lg h-12"
              maxLength={20}
            />
          </div>
          <Button onClick={buscar} disabled={loading} size="lg" className="w-full bg-gradient-brand text-white font-bold rounded-full h-12">
            <Search className="h-4 w-4 mr-2" />
            {loading ? "Buscando..." : "Consultar pedido"}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
