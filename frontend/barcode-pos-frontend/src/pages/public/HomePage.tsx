import HeroSection from '@/components/landing/HeroSection';
import FeaturesGrid from '@/components/landing/FeaturesGrid';
import StatsBar from '@/components/landing/StatsBar';
import Testimonials from '@/components/landing/Testimonials';
import PricingCards from '@/components/landing/PricingCards';
import CTASection from '@/components/landing/CTASection';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturesGrid />
      <StatsBar />
      <Testimonials />
      <PricingCards />
      <CTASection />
    </>
  );
}
