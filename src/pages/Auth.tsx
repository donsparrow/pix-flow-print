import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import logo from "@/assets/logo-jrtl.png";
import { useAuth } from "@/hooks/useAuth";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const nav = useNavigate();

  useEffect(() => { if (user) nav("/admin"); }, [user]);

  const submit = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error("Email ou senha inválidos");
    nav("/admin");
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
          <h1 className="text-xl font-bold text-center mb-6">Entrar na área administrativa</h1>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="font-bold">Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
            </div>
            <div className="space-y-1.5">
              <Label className="font-bold">Senha</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} />
            </div>
            <Button onClick={submit} disabled={loading} className="w-full bg-gradient-brand text-white font-bold rounded-full h-12">
              {loading ? "..." : "Entrar"}
            </Button>
          </div>
        </div>
        <Link to="/" className="block text-center mt-6 text-sm text-muted-foreground hover:text-primary">← Voltar para a loja</Link>
      </div>
    </div>
  );
}
