import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import logo from "@/assets/logo-jrtl.png";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export default function Auth() {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const nav = useNavigate();

  useEffect(() => { if (user) nav("/admin"); }, [user]);

  const submit = async () => {
    setLoading(true);
    if (tab === "signup") {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${window.location.origin}/admin`, data: { nome } },
      });
      setLoading(false);
      if (error) return toast.error(error.message);
      toast.success("Conta criada! Você já pode fazer login.");
      setTab("login");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return toast.error("Email ou senha inválidos");
      nav("/admin");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-3 mb-8">
          <img src={logo} alt="JRTL STUDIO" className="h-16 w-16" />
          <div>
            <div className="font-display text-2xl font-bold text-gradient-brand">JRTL STUDIO</div>
            <div className="text-xs text-muted-foreground font-semibold">Admin</div>
          </div>
        </Link>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          <div className="flex gap-1 p-1 bg-muted rounded-full mb-6">
            <button onClick={() => setTab("login")} className={`flex-1 py-2 rounded-full font-bold text-sm transition-all ${tab === "login" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>Entrar</button>
            <button onClick={() => setTab("signup")} className={`flex-1 py-2 rounded-full font-bold text-sm transition-all ${tab === "signup" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>Criar conta</button>
          </div>

          <div className="space-y-4">
            {tab === "signup" && (
              <div className="space-y-1.5">
                <Label className="font-bold">Nome</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={100} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="font-bold">Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
            </div>
            <div className="space-y-1.5">
              <Label className="font-bold">Senha</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} />
            </div>
            <Button onClick={submit} disabled={loading} className="w-full bg-gradient-brand text-white font-bold rounded-full h-12">
              {loading ? "..." : tab === "login" ? "Entrar" : "Criar conta"}
            </Button>
            {tab === "signup" && (
              <p className="text-xs text-muted-foreground text-center">
                Após criar, peça ao admin existente para liberar seu acesso, ou se for o primeiro acesso, será concedido automaticamente.
              </p>
            )}
          </div>
        </div>
        <Link to="/" className="block text-center mt-6 text-sm text-muted-foreground hover:text-primary">← Voltar para a loja</Link>
      </div>
    </div>
  );
}
