import { Link } from "react-router-dom";
import logo from "@/assets/logo-jrtl.png";
import { Instagram, MessageCircle } from "lucide-react";
import { useConfig } from "@/hooks/useConfig";

export function Footer() {
  const { config } = useConfig();
  const insta = config.instagram_handle || "jrtl3d";
  const wpp = config.whatsapp_numero || "";

  return (
    <footer className="mt-24 bg-foreground text-background dark:bg-card dark:text-foreground dark:border-t dark:border-border">
      <div className="container py-14 grid md:grid-cols-3 gap-10">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <img src={logo} alt="JRTL STUDIO" className="h-12 w-12 dark:bg-white dark:rounded-2xl dark:p-1" />
            <div>
              <div className="font-display text-xl font-bold">JRTL STUDIO</div>
              <div className="text-xs opacity-70">Impressões personalizadas</div>
            </div>
          </div>
          <p className="text-sm opacity-70 leading-relaxed">
            Da minha família para a sua
          </p>
        </div>

        <div>
          <h4 className="font-display font-bold mb-4">Navegação</h4>
          <ul className="space-y-2 text-sm opacity-80">
            <li><Link to="/" className="hover:opacity-100">Início</Link></li>
            <li><Link to="/produtos" className="hover:opacity-100">Produtos</Link></li>
            <li><Link to="/categorias" className="hover:opacity-100">Categorias</Link></li>
            <li><Link to="/pedido" className="hover:opacity-100">Consultar Pedido</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display font-bold mb-4">Contato</h4>
          <div className="flex gap-3">
            <a
              href={`https://instagram.com/${insta}`}
              target="_blank"
              rel="noreferrer"
              className="w-10 h-10 rounded-full bg-background/10 dark:bg-foreground/10 hover:bg-secondary transition-colors flex items-center justify-center"
            >
              <Instagram className="h-5 w-5" />
            </a>
            {wpp && (
              <a
                href={`https://wa.me/${wpp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-background/10 dark:bg-foreground/10 hover:bg-success transition-colors flex items-center justify-center"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-background/10 dark:border-foreground/10">
        <div className="container py-5 text-xs opacity-60 flex flex-col md:flex-row justify-between gap-2">
          <span>© {new Date().getFullYear()} JRTL STUDIO. Todos os direitos reservados.</span>
          <Link to="/admin" className="hover:opacity-100">Área administrativa</Link>
        </div>
      </div>
    </footer>
  );
}
