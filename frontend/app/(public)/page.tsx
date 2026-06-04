import HeroSection from "@/components/home/HeroSection";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import WhyUs from "@/components/home/WhyUs";
import RecipesTeaser from "@/components/home/RecipesTeaser";
import BlogTeaser from "@/components/home/BlogTeaser";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturedProducts />
      <WhyUs />
      <RecipesTeaser />
      <BlogTeaser />
    </>
  );
}
