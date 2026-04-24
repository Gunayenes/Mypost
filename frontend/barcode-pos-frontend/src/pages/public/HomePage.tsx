import HeroSection from '@/components/landing/HeroSection';
import StatsBar from '@/components/landing/StatsBar';
import FeaturesGrid from '@/components/landing/FeaturesGrid';
import HowItWorks from '@/components/landing/HowItWorks';
import WhyCariSoft from '@/components/landing/WhyCariSoft';
import Testimonials from '@/components/landing/Testimonials';
import PricingCards from '@/components/landing/PricingCards';
import FAQ from '@/components/landing/FAQ';
import CTASection from '@/components/landing/CTASection';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <StatsBar />
      <FeaturesGrid />
      <HowItWorks />
      <WhyCariSoft />
      <Testimonials />
      <PricingCards />
      <FAQ />
      <CTASection />
    </>
  );
}
