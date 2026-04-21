import { Layout } from "@/components/Layout";
import { Categories } from "@/components/Categories";

export default function CategoriasPage() {
  return (
    <Layout>
      <div className="py-10">
        <div className="container text-center mb-4">
          <h1 className="font-display text-4xl md:text-5xl font-bold">
            Todas as <span className="text-gradient-brand">categorias</span>
          </h1>
        </div>
        <Categories />
      </div>
    </Layout>
  );
}
