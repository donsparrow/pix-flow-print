import { Link, NavLink } from "react-router-dom";
import { ShoppingBag, Search, Menu, X } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/logo-jrtl.png";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { Badge } from "@/components/ui/badge";

const links = [
  { to: "/", label: "Início" },
  { to: "/produtos", label: "Produtos" },
  { to: "/categorias", label: "Categorias" },
  { to: "/pedido", label: "Meu Pedido" },
];

export function Header() {
  const { count, setOpen } = useCart();
  const [mobile, setMobile] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/85 backdrop-blur-lg border-b border-border">
      <div className="container flex items-center justify-between h-20">
        <Link to="/" className="flex items-center gap-3 group">
          <img src={logo} alt="JRTL STUDIO" className="h-14 w-14 transition-transform group-hover:scale-105" />
          <div className="hidden sm:block">
            <div className="font-display text-2xl font-bold text-gradient-brand leading-none">JRTL STUDIO</div>
            <div className="text-xs text-muted-foreground font-semibold">Impressões personalizadas</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                `px-4 py-2 rounded-full font-semibold text-sm transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-foreground/70 hover:text-primary hover:bg-muted"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full"
            onClick={() => setOpen(true)}
            aria-label="Carrinho"
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 bg-accent text-accent-foreground border-2 border-background">
                {count}
              </Badge>
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-full"
            onClick={() => setMobile((v) => !v)}
            aria-label="Menu"
          >
            {mobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobile && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="container py-4 flex flex-col gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                onClick={() => setMobile(false)}
                className={({ isActive }) =>
                  `px-4 py-3 rounded-xl font-semibold ${
                    isActive ? "bg-primary/10 text-primary" : "text-foreground/80"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
