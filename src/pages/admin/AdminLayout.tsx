import { useEffect, useState } from "react";
import { Outlet, NavLink, Navigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIdleLogout } from "@/hooks/useIdleLogout";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo-jrtl.png";
import { LayoutDashboard, Package, ShoppingCart, Tag, Star, Settings, LogOut, Store } from "lucide-react";

const links = [
  { to: "/admin", end: true, icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/pedidos", icon: ShoppingCart, label: "Pedidos" },
  { to: "/admin/produtos", icon: Package, label: "Produtos" },
  { to: "/admin/categorias", icon: Tag, label: "Categorias" },
  { to: "/admin/depoimentos", icon: Star, label: "Depoimentos" },
  { to: "/admin/configuracoes", icon: Settings, label: "Configurações" },
];

export default function AdminLayout() {
  const { user, isAdmin, loading, signOut } = useAuth();
  useIdleLogout(2 * 60 * 60 * 1000); // logout automático após 2h de inatividade

  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center">
      <div>
        <h1 className="font-display text-2xl font-bold mb-2">Acesso negado</h1>
        <p className="text-muted-foreground mb-4">Sua conta não tem permissão de administrador.</p>
        <Button onClick={signOut} variant="outline">Sair</Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-muted/30">
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        <Link to="/" className="p-6 flex items-center gap-3 border-b">
          <img src={logo} alt="JRTL STUDIO" className="h-10 w-10" />
          <div>
            <div className="font-display text-lg font-bold text-gradient-brand leading-none">JRTL STUDIO</div>
            <div className="text-xs text-muted-foreground">Painel Admin</div>
          </div>
        </Link>
        <nav className="flex-1 p-3 space-y-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  isActive ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:bg-muted"
                }`
              }
            >
              <l.icon className="h-4 w-4" /> {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t space-y-2">
          <Button asChild variant="outline" size="sm" className="w-full"><Link to="/"><Store className="h-4 w-4 mr-2" />Ver loja</Link></Button>
          <Button onClick={signOut} variant="ghost" size="sm" className="w-full"><LogOut className="h-4 w-4 mr-2" />Sair</Button>
        </div>
      </aside>
      <main className="flex-1 p-6 md:p-8 overflow-y-auto"><Outlet /></main>
    </div>
  );
}
