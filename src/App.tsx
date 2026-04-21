import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/hooks/useCart";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Produtos from "./pages/Produtos";
import Produto from "./pages/Produto";
import CategoriasPage from "./pages/CategoriasPage";
import Checkout from "./pages/Checkout";
import PedidoDetalhe from "./pages/PedidoDetalhe";
import ConsultarPedido from "./pages/ConsultarPedido";
import Auth from "./pages/Auth";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPedidos from "./pages/admin/AdminPedidos";
import AdminProdutos from "./pages/admin/AdminProdutos";
import { AdminCategorias, AdminDepoimentos, AdminConfiguracoes } from "./pages/admin/AdminOutros";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/produtos" element={<Produtos />} />
              <Route path="/produto/:slug" element={<Produto />} />
              <Route path="/categorias" element={<CategoriasPage />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/pedido" element={<ConsultarPedido />} />
              <Route path="/pedido/:codigo" element={<PedidoDetalhe />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="pedidos" element={<AdminPedidos />} />
                <Route path="produtos" element={<AdminProdutos />} />
                <Route path="categorias" element={<AdminCategorias />} />
                <Route path="depoimentos" element={<AdminDepoimentos />} />
                <Route path="configuracoes" element={<AdminConfiguracoes />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
