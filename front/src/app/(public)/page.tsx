import Footer from "@/shared/components/Footer";
import HeroSection from "@/app/features/landing/components/home/HeroSection";
import Navbar from "@/shared/components/Navbar";
import { BookingSection } from "../features/landing/components/home/BookingSection";
import { KeyFeatures } from "../features/landing/components/home/KeyFeatures";
import { FaqSection } from "../features/landing/components/home/FaqSection";
import { CTASection } from "../features/landing/components/home/CTASection";

export default function Home() {
  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <HeroSection />
      <KeyFeatures />
      <BookingSection />
      <FaqSection />
      <CTASection />

      <Footer />
    </div>
  );
}
