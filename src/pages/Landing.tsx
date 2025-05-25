
import { Hero } from '@/components/landing/Hero';
import { FeaturedProducts } from '@/components/landing/FeaturedProducts';
import { Benefits } from '@/components/landing/Benefits';
import { Testimonials } from '@/components/landing/Testimonials';
import { About } from '@/components/landing/About';
import { FAQ } from '@/components/landing/FAQ';
import { Footer } from '@/components/landing/Footer';

const Landing = () => {
  return (
    <div className="min-h-screen bg-white">
      <Hero />
      <FeaturedProducts />
      <Benefits />
      <Testimonials />
      <About />
      <FAQ />
      <Footer />
    </div>
  );
};

export default Landing;
