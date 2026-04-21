import { Layout } from "@/components/Layout";
import { Hero } from "@/components/Hero";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { Categories } from "@/components/Categories";
import { Testimonials } from "@/components/Testimonials";
import { InstagramFeed } from "@/components/InstagramFeed";

const Index = () => {
  return (
    <Layout>
      <Hero />
      <FeaturedProducts />
      <Categories />
      <Testimonials />
      <InstagramFeed />
    </Layout>
  );
};

export default Index;
